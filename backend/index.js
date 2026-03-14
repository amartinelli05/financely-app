const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = 3000;
const SECRET_KEY = process.env.JWT_SECRET || "sua_chave_secreta_aqui";

// Configuração do CORS para permitir a comunicação entre as portas 3001 e 3000
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

// Teste de conexão
pool.connect((err) => {
  if (err) return console.error('❌ ERRO NO NEON:', err.stack);
  console.log('✅ CONEXÃO COM POSTGRES (NEON) ESTABELECIDA!');
});

// --- AUTENTICAÇÃO ---

app.post('/registrar', async (req, res) => {
  const { nome, email, senha } = req.body;
  try {
    const senhaCripto = await bcrypt.hash(senha, 10);
    await pool.query(
      'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3)', 
      [nome, email.trim(), senhaCripto]
    );
    res.status(201).send("Usuário criado!");
  } catch (err) {
    res.status(500).send("Erro ao cadastrar: " + err.message);
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
      res.json({ 
        auth: true, 
        token, 
        id_usuario: usuario.id_usuario, 
        nome: usuario.nome 
      });
    } else {
      res.status(401).json({ erro: "Senha incorreta." });
    }
  } catch (err) {
    res.status(500).json({ erro: "Erro interno no servidor." });
  }
});

// --- TRANSAÇÕES (FILTRADAS) ---

app.get('/listar-transacoes', async (req, res) => {
  const { id_usuario } = req.query;
  if (!id_usuario) return res.status(400).json({ erro: "Usuário não identificado." });

  try {
    const query = `
      SELECT t.*, c.nome_categoria 
      FROM transacoes t 
      LEFT JOIN categorias c ON t.id_categoria = c.id_categoria
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
  const { id_categoria, valor, descricao, data_transacao, tipo, id_usuario } = req.body;
  
  if (!id_usuario) return res.status(400).json({ erro: "ID do usuário é obrigatório." });

  const tipoFormatado = tipo.toLowerCase().trim() === 'saida' ? 'Saída' : 'Entrada';
  const valorFinal = tipoFormatado === 'Saída' ? -Math.abs(valor) : Math.abs(valor);

  try {
    const query = `
      INSERT INTO transacoes (id_categoria, valor, descricao, data_transacao, tipo_movimento, id_usuario) 
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `;
    const result = await pool.query(query, [id_categoria, valorFinal, descricao, data_transacao, tipoFormatado, id_usuario]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// --- CATEGORIAS ---

// LISTAR CATEGORIAS (Padrão + do Usuário)
app.get('/listar-categorias', async (req, res) => {
  const { id_usuario } = req.query;
  try {
    // Busca categorias onde o id_usuario é nulo (padrão) OU é o id do usuário logado
    const result = await pool.query(
      'SELECT * FROM categorias WHERE id_usuario IS NULL OR id_usuario = $1 ORDER BY nome_categoria ASC', 
      [id_usuario]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// CRIAR CATEGORIA VINCULADA AO USUÁRIO
app.post('/categorias', async (req, res) => {
  const { nome_categoria, id_usuario } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO categorias (nome_categoria, id_usuario) VALUES ($1, $2) RETURNING id_categoria',
      [nome_categoria, id_usuario]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// --- METAS ---

app.get('/listar-metas', async (req, res) => {
  const { id_usuario } = req.query; // Pega o id do usuário da URL
  try {
    const resultado = await pool.query(
      'SELECT * FROM metas WHERE id_usuario = $1 ORDER BY id_meta ASC', 
      [id_usuario]
    );
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.post('/cadastrar-meta', async (req, res) => {
  const { objetivo, valor_alvo, prazo, id_usuario } = req.body; // Recebe o id_usuario
  try {
    await pool.query(
      'INSERT INTO metas (objetivo, valor_alvo, prazo, id_usuario) VALUES ($1, $2, $3, $4)',
      [objetivo, valor_alvo, prazo, id_usuario]
    );
    res.status(201).send('Meta criada!');
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Financely online na porta ${port}`);
});