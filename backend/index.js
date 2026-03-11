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
app.put('/editar-transacao/:id', (req, res) => {
  const { id } = req.params;
  const { descricao, valor, id_categoria } = req.body;
  const sql = 'UPDATE transacoes SET descricao = ?, valor = ?, id_categoria = ? WHERE id_transacao = ?';

  db.query(sql, [descricao, valor, id_categoria, id], (err, result) => {
    if (err) {
      console.error('Erro ao editar:', err);
      return res.status(500).send('Erro ao atualizar registro');
    }
    res.status(200).send('Registro atualizado com sucesso');
  });
});
// Rota para deletar uma transação
app.delete('/deletar-transacao/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM transacoes WHERE id_transacao = ?';

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Erro ao deletar:', err);
      return res.status(500).send('Erro ao excluir registro');
    }
    res.status(200).send('Registro excluído com sucesso');
  });
});
// Rota para listar as transações (Extrato)
app.get('/listar-transacoes', async (req, res) => {
  try {
    const query = `
      SELECT t.id_transacao, t.valor, t.descricao, t.data_transacao, c.nome_categoria 
      FROM transacoes t 
      JOIN categorias c ON t.id_categoria = c.id_categoria
      ORDER BY t.data_transacao DESC 
      LIMIT 10
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao buscar transações: " + err.message });
  }
});

app.listen(port, () => {
  console.log(`Servidor do Financely rodando em http://localhost:${port}`);
});