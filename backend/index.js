const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = 3000;
const SECRET_KEY = process.env.JWT_SECRET || "sua_chave_secreta_aqui";

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect((err) => {
  if (err) return console.error('❌ ERRO NO NEON:', err.stack);
  console.log('✅ CONEXÃO COM POSTGRES (NEON) ESTABELECIDA!');
});

// --- AUTENTICAÇÃO ---

app.post('/registrar', async (req, res) => {
  const { nome, email, senha } = req.body;
  try {
    const senhaCripto = await bcrypt.hash(senha, 10);
    const result = await pool.query(
      'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id_usuario', 
      [nome, email.trim().toLowerCase(), senhaCripto]
    );
    res.status(201).json({ mensagem: "Usuário criado!", id: result.rows[0].id_usuario });
  } catch (err) {
    res.status(500).json({ erro: "Erro no banco de dados: " + err.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const email = req.body.email ? req.body.email.trim() : "";
    const senha = req.body.senha ? req.body.senha.trim() : "";
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ erro: "Usuário não encontrado." });
    const usuario = result.rows[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (senhaCorreta) {
      const token = jwt.sign({ id: usuario.id_usuario }, SECRET_KEY, { expiresIn: '24h' });
      res.json({ auth: true, token, id_usuario: usuario.id_usuario, nome: usuario.nome });
    } else {
      res.status(401).json({ erro: "Senha incorreta." });
    }
  } catch (err) {
    res.status(500).json({ erro: "Erro interno no servidor." });
  }
});

// --- TRANSAÇÕES (LISTAR E CRIAR COM SALDO AUTOMÁTICO) ---

app.get('/listar-transacoes', async (req, res) => {
    const { id_usuario } = req.query;
    try {
        const query = `
            SELECT t.*, c.nome_categoria, co.nome_conta 
            FROM transacoes t
            LEFT JOIN categorias c ON t.id_categoria = c.id_categoria
            LEFT JOIN contas co ON t.id_conta = co.id_conta
            WHERE t.id_usuario = $1
            ORDER BY t.id_transacao DESC`; // <--- O SEGREDO ESTÁ AQUI
            
        const resultado = await pool.query(query, [id_usuario]);
        res.json(resultado.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar transações' });
    }
});

app.post('/nova-transacao', async (req, res) => {
  const { id_categoria, id_conta, valor, descricao, data_transacao, tipo_movimento, id_usuario } = req.body;
  
  const client = await pool.connect(); 
  try {
    await client.query('BEGIN');

    // 1. Registra a transação na tabela de transações
    const novaTransacao = await client.query(
      `INSERT INTO transacoes (id_categoria, id_conta, valor, descricao, data_transacao, tipo_movimento, id_usuario) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id_categoria, id_conta, valor, descricao, data_transacao, tipo_movimento, id_usuario]
    );

    // 2. Calcula o ajuste (se for Entrada soma, se for Saída subtrai)
    const valorAjuste = tipo_movimento === 'Entrada' ? Math.abs(valor) : -Math.abs(valor);

    // 3. ATUALIZA APENAS O SALDO_ATUAL (O inicial continua intacto)
    await client.query(
      'UPDATE contas SET saldo_atual = saldo_atual + $1 WHERE id_conta = $2',
      [valorAjuste, id_conta]
    );

    await client.query('COMMIT');
    res.status(201).json(novaTransacao.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Erro na transação:", err);
    res.status(500).json({ erro: "Erro ao processar lançamento e atualizar saldo atual." });
  } finally {
    client.release();
  }
});

// --- EDITAR E EXCLUIR TRANSAÇÃO ---

app.delete('/deletar-transacao/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Descobrimos qual é a conta dessa transação antes de apagar
    const transacaoRes = await client.query(
      'SELECT id_conta FROM transacoes WHERE id_transacao = $1',
      [id]
    );

    if (transacaoRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Transação não encontrada." });
    }

    const id_conta = transacaoRes.rows[0].id_conta;

    // 2. Agora sim, deletamos a transação
    await client.query('DELETE FROM transacoes WHERE id_transacao = $1', [id]);

    // 3. BUSCA O SALDO INICIAL da conta
    const contaRes = await client.query(
      'SELECT saldo_inicial FROM contas WHERE id_conta = $1',
      [id_conta]
    );
    const saldoInicial = parseFloat(contaRes.rows[0].saldo_inicial) || 0;

    // 4. SOMA TODAS as transações que sobraram para essa conta
    const somaRes = await client.query(
      'SELECT SUM(valor) as total FROM transacoes WHERE id_conta = $1',
      [id_conta]
    );
    const totalMovimentado = parseFloat(somaRes.rows[0].total) || 0;

    // 5. O novo saldo atual é a soma exata
    const novoSaldoAtual = saldoInicial + totalMovimentado;

    // 6. Atualiza a tabela de contas com o valor real
    await client.query(
      'UPDATE contas SET saldo_atual = $1 WHERE id_conta = $2',
      [novoSaldoAtual, id_conta]
    );

    await client.query('COMMIT');
    res.json({ message: "Transação excluída e saldo recalculado com sucesso!" });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Erro ao deletar:", err);
    res.status(500).json({ error: "Erro ao atualizar saldo após exclusão." });
  } finally {
    client.release();
  }
});

app.put('/editar-transacao/:id', async (req, res) => {
  const { id } = req.params;
  const { descricao, valor, id_categoria, data_transacao, tipo_movimento } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Busca a transação atual para saber qual conta ela pertence
    const atualRes = await client.query('SELECT * FROM transacoes WHERE id_transacao = $1', [id]);
    if (atualRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ erro: "Transação não encontrada." });
    }
    const atual = atualRes.rows[0];
    const id_conta = atual.id_conta; // Pegamos o ID da conta vinculado a ela

    // 2. Atualiza a transação com os novos dados
    // Se o valor ou tipo mudou, o banco vai registrar o novo valor (positivo ou negativo)
    await client.query(
      `UPDATE transacoes 
       SET descricao = $1, valor = $2, id_categoria = $3, data_transacao = $4, tipo_movimento = $5 
       WHERE id_transacao = $6`,
      [
        descricao || atual.descricao, 
        valor !== undefined ? valor : atual.valor, 
        id_categoria || atual.id_categoria, 
        data_transacao || atual.data_transacao, 
        tipo_movimento || atual.tipo_movimento, 
        id
      ]
    );

    // 3. RECALCULO TOTAL DO SALDO DA CONTA
    // Busca o saldo inicial da conta
    const contaRes = await client.query('SELECT saldo_inicial FROM contas WHERE id_conta = $1', [id_conta]);
    const saldoInicial = parseFloat(contaRes.rows[0].saldo_inicial) || 0;

    // Soma todas as transações (incluindo a que acabamos de editar)
    const somaRes = await client.query('SELECT SUM(valor) as total FROM transacoes WHERE id_conta = $1', [id_conta]);
    const totalMovimentado = parseFloat(somaRes.rows[0].total) || 0;

    // 4. Atualiza o saldo_atual da conta com o valor real recalculado
    await client.query(
      'UPDATE contas SET saldo_atual = $1 WHERE id_conta = $2',
      [saldoInicial + totalMovimentado, id_conta]
    );

    await client.query('COMMIT');
    res.json({ mensagem: "Transação editada e saldo da conta recalculado!" });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Erro ao editar transação:", err);
    res.status(500).json({ erro: "Erro ao salvar e atualizar saldo." });
  } finally {
    client.release();
  }
});

// --- CATEGORIAS ---

app.get('/listar-categorias', async (req, res) => {
  const { id_usuario } = req.query;
  try {
    const result = await pool.query('SELECT * FROM categorias WHERE id_usuario IS NULL OR id_usuario = $1 ORDER BY nome_categoria ASC', [id_usuario]);
    res.json(result.rows);
  } catch (err) { res.status(500).send(err.message); }
});

app.post('/categorias', async (req, res) => {
  const { nome_categoria, id_usuario } = req.body;
  try {
    const result = await pool.query('INSERT INTO categorias (nome_categoria, id_usuario) VALUES ($1, $2) RETURNING id_categoria', [nome_categoria, id_usuario]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

// --- METAS ---

app.get('/listar-metas', async (req, res) => {
  const { id_usuario } = req.query;
  try {
    const resultado = await pool.query('SELECT * FROM metas WHERE id_usuario = $1 ORDER BY id_meta ASC', [id_usuario]);
    res.json(resultado.rows);
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

app.post('/cadastrar-meta', async (req, res) => {
  const { objetivo, valor_alvo, prazo, id_usuario } = req.body;
  try {
    await pool.query('INSERT INTO metas (objetivo, valor_alvo, prazo, id_usuario) VALUES ($1, $2, $3, $4)', [objetivo, valor_alvo, prazo, id_usuario]);
    res.status(201).send('Meta criada!');
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

app.delete('/deletar-meta/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM metas WHERE id_meta = $1', [id]);
    res.json({ mensagem: "Meta excluída com sucesso!" });
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

app.put('/atualizar-meta/:id', async (req, res) => {
  const { id } = req.params;
  const valor_adicional = parseFloat(req.body.valor_adicional); 
  if (isNaN(valor_adicional)) return res.status(400).json({ erro: "Valor inválido" });
  try {
    const result = await pool.query('UPDATE metas SET valor_poupado = COALESCE(valor_poupado, 0) + $1 WHERE id_meta = $2 RETURNING *', [valor_adicional, id]);
    if (result.rows.length > 0) res.json(result.rows[0]);
    else res.status(404).json({ erro: "Meta não encontrada." });
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

// --- CONTAS ---

app.get('/listar-contas', async (req, res) => {
  const { id_usuario } = req.query;
  try {
    const resultado = await pool.query('SELECT * FROM contas WHERE id_usuario = $1 ORDER BY nome_conta ASC', [id_usuario]);
    res.json(resultado.rows);
  } catch (err) { res.status(500).json({ error: 'Erro ao buscar contas' }); }
});

app.post('/cadastrar-conta', async (req, res) => {
    const { id_usuario, nome_conta, saldo_inicial, tipo_conta, agencia, numero_conta } = req.body;
    const valor = parseFloat(saldo_inicial) || 0;
    try {
        const query = `
            INSERT INTO contas (id_usuario, nome_conta, saldo_inicial, saldo_atual, tipo_conta, agencia, numero_conta) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
        const values = [id_usuario, nome_conta, valor, valor, tipo_conta, agencia, numero_conta];
        const novaConta = await pool.query(query, values);
        res.status(201).json(novaConta.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/deletar-transacao/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Primeiro, descobrimos qual era a conta desta transação antes de deletar
    const transacaoRes = await client.query(
      'SELECT id_conta FROM transacoes WHERE id_transacao = $1',
      [id]
    );

    if (transacaoRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ erro: "Transação não encontrada." });
    }

    const id_conta = transacaoRes.rows[0].id_conta;

    // 2. Deletamos a transação
    await client.query('DELETE FROM transacoes WHERE id_transacao = $1', [id]);

    // 3. RECALCULO TOTAL: Soma todas as transações restantes para esta conta
    const somaRes = await client.query(
      'SELECT SUM(valor) as total FROM transacoes WHERE id_conta = $1',
      [id_conta]
    );
    const totalMovimentado = parseFloat(somaRes.rows[0].total) || 0;

    // 4. Busca o saldo_inicial da conta para compor o novo saldo_atual
    const contaRes = await client.query(
      'SELECT saldo_inicial FROM contas WHERE id_conta = $1',
      [id_conta]
    );
    const saldoInicial = parseFloat(contaRes.rows[0].saldo_inicial) || 0;

    // 5. Atualiza a conta com o valor real (Inicial + Restante das Transações)
    await client.query(
      'UPDATE contas SET saldo_atual = $1 WHERE id_conta = $2',
      [saldoInicial + totalMovimentado, id_conta]
    );

    await client.query('COMMIT');
    res.json({ mensagem: "Transação excluída e saldo da conta atualizado com sucesso!" });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ erro: "Erro ao deletar e atualizar saldo." });
  } finally {
    client.release();
  }
});

// --- VERSÃO CORRIGIDA DA ROTA DE EDIÇÃO ---
app.put('/editar-conta/:id', async (req, res) => {
    const { id } = req.params;
    const { nome_conta, saldo_inicial, tipo_conta, agencia, numero_conta } = req.body;
    
    try {
        // 1. Primeiro, atualizamos os dados básicos e o saldo_inicial
        await pool.query(
            `UPDATE contas 
             SET nome_conta = $1, saldo_inicial = $2, tipo_conta = $3, agencia = $4, numero_conta = $5 
             WHERE id_conta = $6`,
            [nome_conta, parseFloat(saldo_inicial), tipo_conta, agencia, numero_conta, id]
        );

        // 2. BUSCA A SOMA DE TODAS AS TRANSAÇÕES desta conta
        const somaTransacoes = await pool.query(
            'SELECT SUM(valor) as total FROM transacoes WHERE id_conta = $1',
            [id]
        );
        
        const totalMovimentado = parseFloat(somaTransacoes.rows[0].total) || 0;
        const novoSaldoInicial = parseFloat(saldo_inicial);

        // 3. O SALDO ATUAL é a base (inicial) + tudo que aconteceu depois (movimentado)
        const saldoRealCalculado = novoSaldoInicial + totalMovimentado;

        // 4. Atualizamos o saldo_atual com o valor real
        const resultadoFinal = await pool.query(
            'UPDATE contas SET saldo_atual = $1 WHERE id_conta = $2 RETURNING *',
            [saldoRealCalculado, id]
        );

        res.json(resultadoFinal.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao recalcular saldo da conta.' });
    }
});

// --- ADMIN HUB ---

app.get('/admin-stats', async (req, res) => {
  const { senha } = req.query;
  if (senha !== 'financely-2026') return res.status(403).send('<div style="font-family:sans-serif; text-align:center; margin-top:100px;"><h1 style="color:#ef4444;">🚫 Acesso Negado</h1></div>');
  try {
    const totalU = await pool.query('SELECT COUNT(*) FROM usuarios');
    const totalT = await pool.query('SELECT COUNT(*) FROM transacoes');
    const totalM = await pool.query('SELECT COUNT(*) FROM metas');
    const recentes = await pool.query('SELECT nome, email FROM usuarios ORDER BY id_usuario DESC LIMIT 5');
    res.send(`
      <!DOCTYPE html>
      <html lang="pt-br">
      <body style="font-family: sans-serif; padding: 40px; background: #f8fafc;">
        <h1>📊 Financely Admin Hub</h1>
        <p>Usuários: ${totalU.rows[0].count} | Lançamentos: ${totalT.rows[0].count} | Metas: ${totalM.rows[0].count}</p>
        <hr>
        <h3>Últimos Usuários</h3>
        <ul>${recentes.rows.map(u => `<li>${u.nome} (${u.email})</li>`).join('')}</ul>
      </body>
      </html>
    `);
  } catch (err) { res.status(500).send("Erro ao carregar dados."); }
});

app.listen(port, () => {
  console.log(`🚀 Financely online na porta ${port}`);
});