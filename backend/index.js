const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express(); // Criamos o app apenas UMA vez
const port = 3000;

// Configurações (Middlewares)
app.use(cors()); // Permite que o Front-end acesse o Back-end
app.use(express.json()); // Permite que o Back-end entenda os dados enviados (JSON)

// Configuração da conexão com o PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Rota de teste (Leitura)
app.get('/testar-banco', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categorias');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Erro ao conectar ao banco: ' + err.message);
  }
});

// Rota para cadastrar transação (Escrita)
app.post('/nova-transacao', async (req, res) => {
  const { id_categoria, valor, tipo_movimento, descricao } = req.body;
  try {
    const query = `
      INSERT INTO transacoes (id_categoria, valor, tipo_movimento, descricao)
      VALUES ($1, $2, $3, $4) RETURNING *
    `;
    const values = [id_categoria, valor, tipo_movimento, descricao];
    const result = await pool.query(query, values);
    res.status(201).json({ mensagem: "Gasto registrado!", gasto: result.rows[0] });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao salvar: " + err.message });
  }
});

app.listen(port, () => {
  console.log(`Servidor do Financely rodando em http://localhost:${port}`);
});