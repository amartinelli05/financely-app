const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = 3000;
const SECRET_KEY = process.env.JWT_SECRET || "sua_chave_secreta_aqui";

// Middlewares
app.use(cors());
app.use(express.json());

// Conexão PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// --- ROTA DE LOGIN COM TRIM ---
app.post('/login', async (req, res) => {
  try {
    // Aplicando trim() para evitar erros de espaços invisíveis
    const email = req.body.email ? req.body.email.trim() : "";
    const senha = req.body.senha ? req.body.senha.trim() : "";

    const sql = 'SELECT * FROM usuarios WHERE email = $1';
    const result = await pool.query(sql, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ erro: "Usuário não encontrado." });
    }

    const usuario = result.rows[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (senhaCorreta) {
      const token = jwt.sign({ id: usuario.id_usuario }, SECRET_KEY, { expiresIn: '24h' });
      res.json({ 
        auth: true, 
        token, 
        nome: usuario.nome 
      });
    } else {
      res.status(401).json({ erro: "Senha incorreta." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno no servidor." });
  }
});

// --- RESTANTE DAS ROTAS (CRUD) ---

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
    res.status(500).send("Erro ao cadastrar.");
  }
});

app.get('/listar-transacoes', async (req, res) => {
  try {
    const query = `
      SELECT t.id_transacao, t.valor, t.descricao, t.data_transacao, c.nome_categoria 
      FROM transacoes t 
      JOIN categorias c ON t.id_categoria = c.id_categoria
      ORDER BY t.data_transacao DESC LIMIT 10
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.post('/nova-transacao', async (req, res) => {
  const { id_categoria, valor, tipo_movimento, descricao } = req.body;
  try {
    const query = 'INSERT INTO transacoes (id_categoria, valor, tipo_movimento, descricao) VALUES ($1, $2, $3, $4) RETURNING *';
    const result = await pool.query(query, [id_categoria, valor, tipo_movimento, descricao]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.put('/editar-transacao/:id', async (req, res) => {
  const { id } = req.params;
  const { descricao, valor, id_categoria } = req.body;
  try {
    await pool.query(
      'UPDATE transacoes SET descricao = $1, valor = $2, id_categoria = $3 WHERE id_transacao = $4',
      [descricao, valor, id_categoria, id]
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

app.get('/testar-banco', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categorias');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ATUALIZAR USUÁRIO
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

// EXCLUIR CONTA
app.delete('/usuario/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Nota: Em um sistema real, você deletaria ou esconderia as transações do usuário também
    await pool.query('DELETE FROM usuarios WHERE id_usuario = $1', [id]);
    res.send("Conta excluída.");
  } catch (err) {
    res.status(500).send(err.message);
  }
});


app.listen(port, () => {
  console.log(`🚀 Financely online em http://localhost:${port}`);
});