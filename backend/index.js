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
    const result = await pool.query(
      'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id_usuario', 
      [nome, email.trim().toLowerCase(), senhaCripto]
    );
    res.status(201).json({ mensagem: "Usuário criado!", id: result.rows[0].id_usuario });
  } catch (err) {
    console.error(err); // Isso vai aparecer no log do Render
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

// ROTA PARA DELETAR META
app.delete('/deletar-meta/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM metas WHERE id_meta = $1', [id]);
    res.json({ mensagem: "Meta excluída com sucesso!" });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ROTA PARA ATUALIZAR O VALOR POUPADO DA META
app.put('/atualizar-meta/:id', async (req, res) => {
  const { id } = req.params;
  // Alteração aqui: pega o valor e garante que é um número
  const valor_adicional = parseFloat(req.body.valor_adicional); 

  if (isNaN(valor_adicional)) {
    return res.status(400).json({ erro: "Valor inválido" });
  }

  try {
    const query = `
      UPDATE metas 
      SET valor_poupado = COALESCE(valor_poupado, 0) + $1 
      WHERE id_meta = $2 
      RETURNING *
    `;
    const result = await pool.query(query, [valor_adicional, id]);
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ erro: "Meta não encontrada." });
    }
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ROTA DE ADMIN COM TRAVA DE SEGURANÇA
app.get('/admin-stats', async (req, res) => {
  const { senha } = req.query;
  
  // Trava de segurança
  if (senha !== 'financely-2026') {
    return res.status(403).send(`
      <div style="font-family:sans-serif; text-align:center; margin-top:100px;">
        <h1 style="color:#ef4444;">🚫 Acesso Negado</h1>
        <p style="color:#64748b;">Chave de administrador inválida.</p>
      </div>
    `);
  }

  try {
    // Busca os dados reais no seu Neon
    const totalU = await pool.query('SELECT COUNT(*) FROM usuarios');
    const totalT = await pool.query('SELECT COUNT(*) FROM transacoes');
    const totalM = await pool.query('SELECT COUNT(*) FROM metas');
    const recentes = await pool.query('SELECT nome, email FROM usuarios ORDER BY id_usuario DESC LIMIT 5');

    // Retorna o HTML formatado
    res.send(`
      <!DOCTYPE html>
      <html lang="pt-br">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Admin Hub | Financely</title>
      </head>
      <body style="font-family: -apple-system, system-ui, sans-serif; padding: 40px; background: #f8fafc; color: #1e293b; margin: 0;">
        <div style="max-width: 900px; margin: 0 auto;">
          <header style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 800;">📊 Financely <span style="color:#6366f1">Admin Hub</span></h1>
            <span style="background: #dcfce7; color: #166534; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">● Sistema Online</span>
          </header>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
            <div style="background: white; padding: 25px; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-top: 4px solid #6366f1;">
              <p style="color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase; margin: 0 0 10px 0;">Total Usuários</p>
              <h2 style="font-size: 36px; margin: 0;">${totalU.rows[0].count}</h2>
            </div>
            <div style="background: white; padding: 25px; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-top: 4px solid #10b981;">
              <p style="color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase; margin: 0 0 10px 0;">Total Lançamentos</p>
              <h2 style="font-size: 36px; margin: 0;">${totalT.rows[0].count}</h2>
            </div>
            <div style="background: white; padding: 25px; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-top: 4px solid #f59e0b;">
              <p style="color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase; margin: 0 0 10px 0;">Metas Criadas</p>
              <h2 style="font-size: 36px; margin: 0;">${totalM.rows[0].count}</h2>
            </div>
          </div>

          <h3 style="margin: 40px 0 20px 0; font-size: 18px;">👤 Últimos Usuários Cadastrados</h3>
          <div style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="padding: 15px 20px; font-size: 13px; color: #475569;">NOME</th>
                  <th style="padding: 15px 20px; font-size: 13px; color: #475569;">E-MAIL</th>
                </tr>
              </thead>
              <tbody>
                ${recentes.rows.map(u => `
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 15px 20px; font-weight: 600; font-size: 14px;">${u.nome}</td>
                    <td style="padding: 15px 20px; color: #64748b; font-size: 14px;">${u.email}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <footer style="margin-top: 30px; text-align: center;">
            <p style="font-size: 12px; color: #94a3b8;">Dashboard Gerado em ${new Date().toLocaleString('pt-BR')} (Horário de Brasília)</p>
          </footer>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send("Erro ao carregar os dados do banco.");
  }
});

app.listen(port, () => {
  console.log(`🚀 Financely online na porta ${port}`);
});