const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = 3000;
const SECRET_KEY = process.env.JWT_SECRET || "sua_chave_secreta_aqui";

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// --- LOGIN E REGISTRO (MANTIDOS) ---
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
      res.json({ auth: true, token, nome: usuario.nome });
    } else {
      res.status(401).json({ erro: "Senha incorreta." });
    }
  } catch (err) {
    res.status(500).json({ erro: "Erro interno no servidor." });
  }
});

app.post('/registrar', async (req, res) => {
  const { nome, email, senha } = req.body;
  try {
    const senhaCripto = await bcrypt.hash(senha, 10);
    await pool.query('INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3)', [nome, email.trim(), senhaCripto]);
    res.status(201).send("Usuário criado!");
  } catch (err) {
    res.status(500).send("Erro ao cadastrar.");
  }
});

// --- TRANSAÇÕES (ATUALIZADO) ---

app.get('/listar-transacoes', async (req, res) => {
  try {
    const query = `
      SELECT t.id_transacao, t.valor, t.descricao, t.data_transacao as data, t.id_categoria, c.nome_categoria 
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

// Rota de salvamento ajustada para tratar Entrada/Saída e Data
app.post('/nova-transacao', async (req, res) => {
  const { id_categoria, valor, descricao, data_transacao, tipo } = req.body;
  
  // Forçamos o tipo a ser exatamente 'entrada' ou 'saida' em minúsculo
  const tipoFinal = tipo.toLowerCase().trim();
  const valorFinal = tipoFinal === 'saida' ? -Math.abs(valor) : Math.abs(valor);

  try {
    const query = `
      INSERT INTO transacoes (id_categoria, valor, descricao, data_transacao, tipo_movimento) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `;
    const result = await pool.query(query, [id_categoria, valorFinal, descricao, data_transacao, tipoFinal]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: err.message });
  }
});

app.put('/editar-transacao/:id', async (req, res) => {
  const { id } = req.params;
  const { descricao, valor, id_categoria, data_transacao } = req.body;
  try {
    await pool.query(
      'UPDATE transacoes SET descricao = $1, valor = $2, id_categoria = $3, data_transacao = $4 WHERE id_transacao = $5',
      [descricao, valor, id_categoria, data_transacao, id]
    );
    res.send('Atualizado!');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.delete('/deletar-transacao/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM transacoes WHERE id_transacao = $1', [id]);
    res.send('Excluído!');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// --- CATEGORIAS (NOVO) ---

// Rota para cadastrar nova categoria direto do app
app.post('/categorias', async (req, res) => {
  const { nome_categoria } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO categorias (nome_categoria) VALUES ($1) RETURNING *',
      [nome_categoria]
    );
    res.status(201).json(result.rows[0]);
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

// --- USUÁRIO (MANTIDO) ---
app.put('/usuario/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, email } = req.body;
  try {
    await pool.query('UPDATE usuarios SET nome = $1, email = $2 WHERE id_usuario = $3', [nome, email, id]);
    res.send("Perfil atualizado!");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Rota para pegar os totais do Dashboard
app.get('/totais', async (req, res) => {
  try {
    const query = `
      SELECT 
        SUM(CASE WHEN valor > 0 THEN valor ELSE 0 END) as entradas,
        SUM(CASE WHEN valor < 0 THEN ABS(valor) ELSE 0 END) as saidas,
        SUM(valor) as saldo
      FROM transacoes
    `;
    const result = await pool.query(query);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.delete('/usuario/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM usuarios WHERE id_usuario = $1', [id]);
    res.send("Conta excluída.");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(port, () => {
  console.log(`🚀 Financely online em http://localhost:${port}`);
});