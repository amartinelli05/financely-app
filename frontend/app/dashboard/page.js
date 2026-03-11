'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function Dashboard() {
  const router = useRouter()
  
  // Estados para Lançamentos
  const [categorias, setCategorias] = useState([])
  const [transacoes, setTransacoes] = useState([])
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('')
  const [mensagem, setMensagem] = useState('')

  // Estados para Gráficos
  const [dadosGrafico, setDadosGrafico] = useState([])

  const carregarDados = async () => {
    try {
      const resCat = await fetch('http://localhost:3000/testar-banco')
      const dataCat = await resCat.json()
      setCategorias(dataCat)

      const resTrans = await fetch('http://localhost:3000/listar-transacoes')
      const transacoesDB = await resTrans.json()
      setTransacoes(transacoesDB)

      const agrupado = transacoesDB.reduce((acc, t) => {
        acc[t.nome_categoria] = (acc[t.nome_categoria] || 0) + parseFloat(t.valor)
        return acc
      }, {})

      const formatado = Object.keys(agrupado).map(cat => ({
        name: cat,
        total: agrupado[cat]
      }))
      setDadosGrafico(formatado)

    } catch (err) { console.error("Erro ao carregar dados:", err) }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    } else {
      carregarDados()
    }
  }, [])

  const salvarGasto = async (e) => {
    e.preventDefault()
    const res = await fetch('http://localhost:3000/nova-transacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_categoria: parseInt(categoriaSelecionada),
        valor: parseFloat(valor),
        tipo_movimento: 'Saída',
        descricao: descricao
      })
    })
    if (res.ok) {
      setMensagem("Gasto registrado!");
      carregarDados();
      setValor(''); setDescricao(''); setCategoriaSelecionada('');
      setTimeout(() => setMensagem(''), 3000)
    }
  }

  // Definição de Cores com Gradientes (IDs definidos no SVG abaixo)
  const GRADIENT_COLORS = ['url(#indigoG)', 'url(#purpleG)', 'url(#pinkG)', 'url(#amberG)']
  
  const maiorGasto = dadosGrafico.length > 0 
    ? dadosGrafico.reduce((prev, current) => (prev.total > current.total) ? prev : current).name 
    : "..."
  const totalGeral = dadosGrafico.reduce((acc, d) => acc + d.total, 0)

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* HEADER */}
      <header>
        <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Dashboard</h2>
        <p className="text-slate-400 font-medium italic">Gestão e análise de categorias.</p>
      </header>

      {/* CARDS COM PROFUNDIDADE E COR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200">
          <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mb-2">Maior Categoria de Gasto</p>
          <h4 className="text-3xl font-black">{maiorGasto}</h4>
        </div>
        
        <div className="bg-white p-8 rounded-[2.5rem] border-l-8 border-indigo-500 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total de Saídas</p>
          <h4 className="text-3xl font-black text-slate-800">
            R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h4>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* COLUNA ESQUERDA: FORMULÁRIO COM FUNDO SUAVE */}
        <div className="lg:col-span-4">
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 h-full flex flex-col justify-center">
            <h3 className="text-sm font-black mb-8 text-slate-800 uppercase tracking-widest">Lançar Gasto</h3>
            <form onSubmit={salvarGasto} className="space-y-5">
              <input 
                type="text" 
                required 
                placeholder="Descrição" 
                className="w-full p-5 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium" 
                value={descricao} 
                onChange={e => setDescricao(e.target.value)} 
              />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  placeholder="Valor" 
                  className="w-full p-5 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium" 
                  value={valor} 
                  onChange={e => setValor(e.target.value)} 
                />
                <select 
                  required 
                  className="w-full p-5 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-slate-500" 
                  value={categoriaSelecionada} 
                  onChange={e => setCategoriaSelecionada(e.target.value)}
                >
                  <option value="">Categoria</option>
                  {categorias.map(cat => (
                    <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nome_categoria}</option>
                  ))}
                </select>
              </div>
              <button className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200">
                Registrar Gasto
              </button>
            </form>
            {mensagem && <p className="mt-4 text-center text-xs font-bold text-green-500 animate-bounce">{mensagem}</p>}
          </div>
        </div>

        {/* COLUNA DIREITA: GRÁFICO COM GRADIENTES INTERNOS */}
        <div className="lg:col-span-8">
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
            <h3 className="text-[10px] font-bold mb-10 text-slate-400 uppercase tracking-widest">Distribuição Mensal</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGrafico}>
                  <defs>
                    <linearGradient id="indigoG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#818cf8"/><stop offset="100%" stopColor="#4f46e5"/></linearGradient>
                    <linearGradient id="purpleG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#7c3aed"/></linearGradient>
                    <linearGradient id="pinkG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f472b6"/><stop offset="100%" stopColor="#db2777"/></linearGradient>
                    <linearGradient id="amberG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fbbf24"/><stop offset="100%" stopColor="#f59e0b"/></linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{fill: 'rgba(99, 102, 241, 0.05)'}} 
                    contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.05)', padding: '15px'}} 
                  />
                  <Bar dataKey="total" radius={[12, 12, 12, 12]} barSize={45}>
                    {dadosGrafico.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={GRADIENT_COLORS[index % GRADIENT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* TABELA DE HISTÓRICO */}
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
        <h3 className="text-sm font-black mb-8 text-slate-800 uppercase tracking-widest">Últimos Lançamentos</h3>
        <div className="space-y-4">
          {transacoes.map((t) => (
            <div key={t.id_transacao} className="flex justify-between items-center p-5 hover:bg-slate-50 rounded-[2rem] transition-all group">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  R$
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-lg">{t.descricao}</p>
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">{t.nome_categoria}</p>
                </div>
              </div>
              <div className="font-black text-slate-700 text-xl tracking-tighter">
                R$ {parseFloat(t.valor).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}