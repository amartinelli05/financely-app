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
  origin: '*', // Permite que qualquer porta (3001, 3002...) acesse o backend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// --- AJUSTE PARA O NEON (POSTGRES 17) ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Isso permite a conexão segura com o Neon
  }
});

// Teste de conexão imediato
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ ERRO CRÍTICO NO NEON:', err.stack);
  }
  console.log('✅ CONEXÃO COM POSTGRES (NEON) ESTABELECIDA!');
  release();
});

// --- LOGIN E REGISTRO ---
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
      res.json({ auth: true, token, nome: usuario.nome, email: usuario.email });
    } else {
      res.status(401).json({ erro: "Senha incorreta." });
    }
  } catch (err) {
    res.status(500).json({ erro: "Erro interno no servidor." });
  }
});

app.post('/registrar', async (req, res) => {
  const { nome, email, senha } = req.body;
  console.log("Tentando registrar usuário:", email); // Isso deve aparecer no seu terminal

  try {
    const senhaCripto = await bcrypt.hash(senha, 10);
    const result = await pool.query(
      'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id_usuario', 
      [nome, email.trim(), senhaCripto]
    );
    
    console.log("✅ Usuário criado com ID:", result.rows[0].id_usuario);
    res.status(201).send("Usuário criado!");
  } catch (err) {
    console.error("❌ ERRO NO INSERT DO NEON:", err.message); // Isso vai dizer o erro real
    res.status(500).send("Erro ao cadastrar: " + err.message);
  }
});

// --- TRANSAÇÕES ---

app.get('/listar-transacoes', async (req, res) => {
  try {
    const query = `
      SELECT t.id_transacao, t.valor, t.descricao, t.data_transacao, t.id_categoria, t.tipo_movimento, c.nome_categoria 
      FROM transacoes t 
      LEFT JOIN categorias c ON t.id_categoria = c.id_categoria
      ORDER BY t.data_transacao DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.post('/nova-transacao', async (req, res) => {
  console.log("Recebendo nova transação:", req.body);
  const { id_categoria, valor, descricao, data_transacao, tipo } = req.body;
  
  if (!tipo) return res.status(400).json({ erro: "Tipo de movimentação é obrigatório." });

  const tipoFormatado = tipo.toLowerCase().trim() === 'saida' ? 'Saída' : 'Entrada';
  const valorFinal = tipoFormatado === 'Saída' ? -Math.abs(valor) : Math.abs(valor);

  try {
    const query = `
      INSERT INTO transacoes (id_categoria, valor, descricao, data_transacao, tipo_movimento) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `;
    const result = await pool.query(query, [id_categoria, valorFinal, descricao, data_transacao, tipoFormatado]);
    console.log("✅ Salvo no banco:", result.rows[0].id_transacao);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ ERRO AO SALVAR:", err.message);
    res.status(500).json({ erro: err.message });
  }
});

// --- METAS, CATEGORIAS E USUÁRIO ---

app.get('/listar-metas', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM metas ORDER BY id_meta ASC');
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.post('/cadastrar-meta', async (req, res) => {
  const { objetivo, valor_alvo, prazo } = req.body;
  try {
    await pool.query(
      'INSERT INTO metas (objetivo, valor_alvo, prazo) VALUES ($1, $2, $3)',
      [objetivo, valor_alvo, prazo]
    );
    res.status(201).send('Meta criada!');
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.get('/testar-banco', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categorias ORDER BY nome_categoria ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(port, () => {
  console.log(`🚀 Financely online em http://localhost:${port}`);
});