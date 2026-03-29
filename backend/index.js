const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const SECRET_KEY = process.env.JWT_SECRET || "sua_chave_secreta_aqui";

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// --- CONFIGURAÇÃO DO BANCO (UNIFICADA E ESTÁVEL) ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  max: 10
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado no cliente do banco:', err);
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ ERRO AO CONECTAR NO NEON:', err.stack);
  }
  console.log('✅ CONEXÃO COM POSTGRES (NEON) ESTABELECIDA!');
  release();
});

// --- 1. AUTENTICAÇÃO ---

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

// --- 2. TRANSAÇÕES (Lançamentos) ---

app.get('/listar-transacoes', async (req, res) => {
    const { id_usuario } = req.query;
    try {
        const query = `
            SELECT t.*, c.nome_categoria, co.nome_conta 
            FROM transacoes t
            LEFT JOIN categorias c ON t.id_categoria = c.id_categoria
            LEFT JOIN contas co ON t.id_conta = co.id_conta
            WHERE t.id_usuario = $1
            ORDER BY t.id_transacao DESC`;
        const resultado = await pool.query(query, [id_usuario]);
        res.json(resultado.rows);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao listar transações' });
    }
});

app.post('/nova-transacao', async (req, res) => {
  const { id_categoria, id_conta, valor, descricao, data_transacao, tipo_movimento, id_usuario } = req.body;
  const client = await pool.connect(); 
  try {
    await client.query('BEGIN');
    const novaTransacao = await client.query(
      `INSERT INTO transacoes (id_categoria, id_conta, valor, descricao, data_transacao, tipo_movimento, id_usuario) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id_categoria, id_conta, valor, descricao, data_transacao, tipo_movimento, id_usuario]
    );
    const valorAjuste = tipo_movimento === 'Entrada' ? Math.abs(valor) : -Math.abs(valor);
    await client.query(
      'UPDATE contas SET saldo_atual = saldo_atual + $1 WHERE id_conta = $2',
      [valorAjuste, id_conta]
    );
    await client.query('COMMIT');
    res.status(201).json(novaTransacao.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ erro: "Erro ao processar lançamento." });
  } finally {
    client.release();
  }
});

app.delete('/deletar-transacao/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const transacaoRes = await client.query('SELECT id_conta FROM transacoes WHERE id_transacao = $1', [id]);
    if (transacaoRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ erro: "Transação não encontrada." });
    }
    const id_conta = transacaoRes.rows[0].id_conta;
    await client.query('DELETE FROM transacoes WHERE id_transacao = $1', [id]);
    
    const somaRes = await client.query('SELECT SUM(valor) as total FROM transacoes WHERE id_conta = $1', [id_conta]);
    const contaRes = await client.query('SELECT saldo_inicial FROM contas WHERE id_conta = $1', [id_conta]);
    const novoSaldo = (parseFloat(contaRes.rows[0].saldo_inicial) || 0) + (parseFloat(somaRes.rows[0].total) || 0);
    
    await client.query('UPDATE contas SET saldo_atual = $1 WHERE id_conta = $2', [novoSaldo, id_conta]);
    await client.query('COMMIT');
    res.json({ mensagem: "Excluído e saldo atualizado!" });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ erro: "Erro ao deletar." });
  } finally { client.release(); }
});

app.put('/editar-transacao/:id', async (req, res) => {
  const { id } = req.params;
  const { descricao, valor, id_categoria, data_transacao, tipo_movimento } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const atualRes = await client.query('SELECT id_conta FROM transacoes WHERE id_transacao = $1', [id]);
    if (atualRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ erro: "Não encontrado." });
    }
    const id_conta = atualRes.rows[0].id_conta;
    await client.query(
      `UPDATE transacoes SET descricao = $1, valor = $2, id_categoria = $3, data_transacao = $4, tipo_movimento = $5 WHERE id_transacao = $6`,
      [descricao, valor, id_categoria, data_transacao, tipo_movimento, id]
    );
    const somaRes = await client.query('SELECT SUM(valor) as total FROM transacoes WHERE id_conta = $1', [id_conta]);
    const contaRes = await client.query('SELECT saldo_inicial FROM contas WHERE id_conta = $1', [id_conta]);
    const novoSaldo = (parseFloat(contaRes.rows[0].saldo_inicial) || 0) + (parseFloat(somaRes.rows[0].total) || 0);
    await client.query('UPDATE contas SET saldo_atual = $1 WHERE id_conta = $2', [novoSaldo, id_conta]);
    await client.query('COMMIT');
    res.json({ mensagem: "Editado e saldo recalculado!" });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ erro: "Erro ao editar." });
  } finally { client.release(); }
});

// --- 3. CATEGORIAS (LISTAR, CRIAR, EDITAR E EXCLUIR) ---

// Listar categorias do sistema (NULL) e as do usuário
app.get('/listar-categorias', async (req, res) => {
  const { id_usuario } = req.query;
  try {
    const result = await pool.query(
      'SELECT * FROM categorias WHERE id_usuario IS NULL OR id_usuario = $1 ORDER BY nome_categoria ASC', 
      [id_usuario]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

// Criar nova categoria
app.post('/categorias', async (req, res) => {
  const { nome_categoria, id_usuario } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO categorias (nome_categoria, id_usuario) VALUES ($1, $2) RETURNING *', 
      [nome_categoria, id_usuario]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

// EDITAR CATEGORIA (Nova)
app.put('/editar-categoria/:id', async (req, res) => {
  const { id } = req.params;
  const { nome_categoria } = req.body;
  try {
    const result = await pool.query(
      'UPDATE categorias SET nome_categoria = $1 WHERE id_categoria = $2 RETURNING *',
      [nome_categoria, id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

// EXCLUIR CATEGORIA (Com a trava de segurança)
app.delete('/excluir-categoria/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // O banco de dados vai verificar automaticamente se existe id_categoria na tabela transacoes
    await pool.query('DELETE FROM categorias WHERE id_categoria = $1', [id]);
    res.json({ mensagem: "Categoria excluída com sucesso!" });
  } catch (err) {
    // Código 23503: Violação de chave estrangeira (tem transação usando essa categoria)
    if (err.code === '23503') {
      return res.status(400).json({ 
        erro: "Não é possível excluir: existem lançamentos usando esta categoria." 
      });
    }
    res.status(500).json({ erro: "Erro ao excluir categoria: " + err.message });
  }
});

// --- 4. CONTAS ---

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
        const novaConta = await pool.query(query, [id_usuario, nome_conta, valor, valor, tipo_conta, agencia, numero_conta]);
        res.status(201).json(novaConta.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/editar-conta/:id', async (req, res) => {
    const { id } = req.params;
    const { nome_conta, saldo_inicial, tipo_conta, agencia, numero_conta } = req.body;
    try {
        await pool.query(
            `UPDATE contas SET nome_conta = $1, saldo_inicial = $2, tipo_conta = $3, agencia = $4, numero_conta = $5 WHERE id_conta = $6`,
            [nome_conta, parseFloat(saldo_inicial), tipo_conta, agencia, numero_conta, id]
        );
        const somaTransacoes = await pool.query('SELECT SUM(valor) as total FROM transacoes WHERE id_conta = $1', [id]);
        const novoSaldo = parseFloat(saldo_inicial) + (parseFloat(somaTransacoes.rows[0].total) || 0);
        const resultadoFinal = await pool.query('UPDATE contas SET saldo_atual = $1 WHERE id_conta = $2 RETURNING *', [novoSaldo, id]);
        res.json(resultadoFinal.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Erro ao editar conta.' }); }
});

app.delete('/excluir-conta/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM contas WHERE id_conta = $1', [id]);
    res.json({ message: 'Conta excluída!' });
  } catch (err) {
    if (err.code === '23503') return res.status(400).json({ error: 'Esta conta possui lançamentos vinculados.' });
    res.status(500).json({ error: 'Erro ao excluir conta.' });
  }
});

// --- 5. METAS E ADMIN ---

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
    // Adicionado valor_poupado = 0 como padrão no insert
    await pool.query(
      'INSERT INTO metas (objetivo, valor_alvo, prazo, id_usuario, valor_poupado) VALUES ($1, $2, $3, $4, 0)', 
      [objetivo, valor_alvo, prazo, id_usuario]
    );
    res.status(201).send('Meta criada!');
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

// NOVA ROTA: Editar os dados principais da meta
app.put('/editar-meta/:id', async (req, res) => {
  const { id } = req.params;
  const { objetivo, valor_alvo, prazo } = req.body;
  try {
    await pool.query(
      'UPDATE metas SET objetivo = $1, valor_alvo = $2, prazo = $3 WHERE id_meta = $4',
      [objetivo, valor_alvo, prazo, id]
    );
    res.json({ mensagem: "Meta atualizada com sucesso!" });
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

// MANTIDA E MELHORADA: Rota para "Dar Saída" (adicionar valor à poupança da meta)
app.put('/atualizar-meta/:id', async (req, res) => {
  const { id } = req.params;
  const { valor_adicional } = req.body; 
  try {
    const result = await pool.query(
      'UPDATE metas SET valor_poupado = COALESCE(valor_poupado, 0) + $1 WHERE id_meta = $2 RETURNING *', 
      [parseFloat(valor_adicional), id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao atualizar meta." });
  }
});

app.delete('/deletar-meta/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM metas WHERE id_meta = $1', [id]);
    res.json({ mensagem: "Meta excluída!" });
  } catch (err) { res.status(500).json({ erro: err.message }); }
});

app.get('/admin-stats', async (req, res) => {
  const { senha } = req.query;
  if (senha !== 'financely-2026') return res.status(403).send('Acesso Negado');
  try {
    const totalU = await pool.query('SELECT COUNT(*) FROM usuarios');
    const totalT = await pool.query('SELECT COUNT(*) FROM transacoes');
    res.send(`<h1>📊 Admin Stats</h1><p>Usuários: ${totalU.rows[0].count} | Lançamentos: ${totalT.rows[0].count}</p>`);
  } catch (err) { res.status(500).send("Erro."); }
});


// --- 6. INICIALIZAÇÃO DO SERVIDOR ---
const PORT_FINAL = process.env.PORT || 3000;

app.listen(PORT_FINAL, '0.0.0.0', () => {
  console.log(`🚀 Financely online na porta ${PORT_FINAL}`);
});
