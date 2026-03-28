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
  if (!id_usuario) return res.status(400).json({ erro: "Usuário não identificado." });
  try {
    const query = `
      SELECT t.*, c.nome_categoria, co.nome_conta 
      FROM transacoes t 
      LEFT JOIN categorias c ON t.id_categoria = c.id_categoria
      LEFT JOIN contas co ON t.id_conta = co.id_conta
      WHERE t.id_usuario = $1
      ORDER BY t.data_transacao DESC
    `;
    const result = await pool.query(query, [id_usuario]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
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
  try {
    const resultado = await pool.query('DELETE FROM transacoes WHERE id_transacao = $1', [id]);
    if (resultado.rowCount === 0) return res.status(404).json({ erro: "Transação não encontrada." });
    res.json({ mensagem: "Excluído com sucesso!" });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao deletar no servidor." });
  }
});

app.put('/editar-transacao/:id', async (req, res) => {
  const { id } = req.params;
  const { descricao, valor, id_categoria, data_transacao, tipo_movimento } = req.body;
  try {
    const atualRes = await pool.query('SELECT * FROM transacoes WHERE id_transacao = $1', [id]);
    if (atualRes.rows.length === 0) return res.status(404).json({ erro: "Transação não encontrada." });
    const atual = atualRes.rows[0];
    await pool.query(
      `UPDATE transacoes SET descricao = $1, valor = $2, id_categoria = $3, data_transacao = $4, tipo_movimento = $5 WHERE id_transacao = $6`,
      [descricao || atual.descricao, valor !== undefined ? valor : atual.valor, id_categoria || atual.id_categoria, data_transacao || atual.data_transacao, tipo_movimento || atual.tipo_movimento, id]
    );
    res.json({ mensagem: "Atualizado com sucesso!" });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao salvar: " + err.message });
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
    const { id_usuario, nome_conta, saldo_inicial, numero_conta, agencia, tipo_conta } = req.body;
    
    // Garantimos que o valor é um número para o banco não dar erro de tipo
    const valorInicial = parseFloat(saldo_inicial) || 0;

    try {
        // SQL corrigido: Inserindo em saldo_inicial E saldo_atual ao mesmo tempo
        const query = `
            INSERT INTO contas (id_usuario, nome_conta, saldo_inicial, saldo_atual, numero_conta, agencia, tipo_conta) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
        
        const values = [id_usuario, nome_conta, valorInicial, valorInicial, numero_conta, agencia, tipo_conta];
        
        const novaConta = await pool.query(query, values);
        res.status(201).json(novaConta.rows[0]);
    } catch (err) {
        console.error("❌ ERRO NO BANCO AO SALVAR CONTA:", err.message);
        res.status(500).json({ error: 'Erro interno no banco de dados: ' + err.message });
    }
});

app.delete('/excluir-conta/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM contas WHERE id_conta = $1', [id]);
    res.json({ message: 'Conta excluída com sucesso!' });
  } catch (err) {
    if (err.code === '23503') return res.status(400).json({ error: 'Não é possível excluir: esta conta possui lançamentos vinculados.' });
    res.status(500).json({ error: 'Erro interno ao excluir conta.' });
  }
});

// --- VERSÃO CORRIGIDA DA ROTA DE EDIÇÃO ---
app.put('/editar-conta/:id', async (req, res) => {
    const { id } = req.params;
    const { nome_conta, saldo_inicial, tipo_conta, agencia, numero_conta } = req.body;
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Busca os valores antigos para calcular a diferença
        const buscaAnterior = await client.query('SELECT saldo_inicial, saldo_atual FROM contas WHERE id_conta = $1', [id]);
        const antigoInicial = parseFloat(buscaAnterior.rows[0].saldo_inicial);
        const novoInicial = parseFloat(saldo_inicial);

        // 2. Calcula quanto o saldo inicial mudou
        const diferenca = novoInicial - antigoInicial;

        // 3. Atualiza a conta: o saldo_inicial vira o novo, 
        // e o saldo_atual recebe o ajuste da diferença
        const resultado = await client.query(
            `UPDATE contas 
             SET nome_conta = $1, 
                 saldo_inicial = $2, 
                 saldo_atual = saldo_atual + $3, 
                 tipo_conta = $4, 
                 agencia = $5, 
                 numero_conta = $6 
             WHERE id_conta = $7 RETURNING *`,
            [nome_conta, novoInicial, diferenca, tipo_conta, agencia, numero_conta, id]
        );

        await client.query('COMMIT');
        res.json(resultado.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar saldo inicial e ajustar saldo atual.' });
    } finally {
        client.release();
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