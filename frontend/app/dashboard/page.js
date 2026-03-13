'use client'
import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts'

export default function Dashboard() {
  const [transacoes, setTransacoes] = useState([])
  const [transacoesFiltradas, setTransacoesFiltradas] = useState([])
  const [periodo, setPeriodo] = useState('tudo')

  const carregarDados = async () => {
    try {
      const idUsuario = localStorage.getItem('usuarioId')
      
      if (!idUsuario) {
        console.warn("Usuário não identificado no localStorage")
        return
      }

      // Agora filtramos no banco pelo id do usuário logado
      const res = await fetch(`http://localhost:3000/listar-transacoes?id_usuario=${idUsuario}`)
      const dados = await res.json()
      
      const listaValida = Array.isArray(dados) ? dados : []
      setTransacoes(listaValida)
      setTransacoesFiltradas(listaValida)
    } catch (err) { 
      console.error("Erro ao buscar dados:", err)
      setTransacoes([])
    }
  }

  useEffect(() => { carregarDados() }, [])

  // Lógica de Filtro por Período
  useEffect(() => {
    const hoje = new Date()
    const mesAtual = hoje.getMonth() 
    const anoAtual = hoje.getFullYear()

    let filtradas = transacoes.filter(t => {
      if (!t.data_transacao) return false

      try {
        const dataPura = String(t.data_transacao).split('T')[0]
        const [ano, mes, dia] = dataPura.split('-').map(Number)

        if (periodo === 'mes') {
          return (mes - 1) === mesAtual && ano === anoAtual
        } 
        
        if (periodo === 'semana') {
          const dataT = new Date(ano, mes - 1, dia)
          const seteDiasAtras = new Date()
          seteDiasAtras.setDate(hoje.getDate() - 7)
          return dataT >= seteDiasAtras
        }

        return true 
      } catch (e) { return false }
    })

    setTransacoesFiltradas(filtradas)
  }, [periodo, transacoes])

  // --- FUNÇÕES DE AGRUPAMENTO PARA OS GRÁFICOS ---

  const resumoGeral = [
    { name: 'Entradas', valor: transacoesFiltradas.filter(t => parseFloat(t.valor) > 0).reduce((acc, t) => acc + parseFloat(t.valor || 0), 0), cor: '#4f46e5' },
    { name: 'Saídas', valor: Math.abs(transacoesFiltradas.filter(t => parseFloat(t.valor) < 0).reduce((acc, t) => acc + parseFloat(t.valor || 0), 0)), cor: '#f43f5e' }
  ]

  const dadosEntradas = () => {
    const cats = {}
    transacoesFiltradas.filter(t => parseFloat(t.valor) > 0).forEach(t => {
      const nome = t.nome_categoria || 'Outros'
      cats[nome] = (cats[nome] || 0) + parseFloat(t.valor || 0)
    })
    return Object.entries(cats).map(([name, value]) => ({ name, value }))
  }

  const dadosSaidas = () => {
    const cats = {}
    transacoesFiltradas.filter(t => parseFloat(t.valor) < 0).forEach(t => {
      const nome = t.nome_categoria || 'Outros'
      cats[nome] = (cats[nome] || 0) + Math.abs(parseFloat(t.valor || 0))
    })
    return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value)
  }

  const dadosBalanco = () => {
    const cats = {}
    transacoesFiltradas.forEach(t => {
      const nome = t.nome_categoria || 'Outros'
      if(!cats[nome]) cats[nome] = { name: nome, entradas: 0, saidas: 0 }
      if(parseFloat(t.valor) > 0) cats[nome].entradas += parseFloat(t.valor || 0)
      else cats[nome].saidas += Math.abs(parseFloat(t.valor || 0))
    })
    return Object.values(cats)
  }

  return (
    <div className="space-y-8">
      {/* HEADER DO DASHBOARD */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-100/50 border border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Financely Dashboard</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
            MOSTRANDO: {transacoesFiltradas.length} REGISTROS DO USUÁRIO
          </p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
          {['tudo', 'mes', 'semana'].map((p) => (
            <button key={p} onClick={() => setPeriodo(p)} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${periodo === p ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
              {p === 'semana' ? '7 Dias' : p === 'mes' ? 'Mês' : 'Tudo'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CARD 1: VOLUME TOTAL */}
        <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-100/50 border border-slate-50">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-2"><span className="w-1.5 h-6 bg-indigo-600 rounded-full" /> Volume Total</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resumoGeral}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold'}} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '20px', border: 'none'}} />
                <Bar dataKey="valor" radius={[15, 15, 15, 15]} barSize={50}>
                  {resumoGeral.map((entry, index) => <Cell key={index} fill={entry.cor} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CARD 2: ENTRADAS / CATEGORIA */}
        <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-100/50 border border-slate-50">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-2"><span className="w-1.5 h-6 bg-emerald-500 rounded-full" /> Entradas / Categoria</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dadosEntradas()} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                  {dadosEntradas().map((entry, index) => <Cell key={index} fill={['#4f46e5', '#10b981', '#fbbf24', '#f43f5e'][index % 4]} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CARD 3: GASTOS / CATEGORIA */}
        <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-100/50 border border-slate-50">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-2"><span className="w-1.5 h-6 bg-rose-500 rounded-full" /> Gastos / Categoria</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosSaidas()} layout="vertical" margin={{ left: 30 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 'bold'}} />
                <Tooltip contentStyle={{borderRadius: '15px', border: 'none'}} />
                <Bar dataKey="value" fill="#f43f5e" radius={[0, 10, 10, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CARD 4: BALANÇO POR CATEGORIA */}
        <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-100/50 border border-slate-50">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-2"><span className="w-1.5 h-6 bg-amber-500 rounded-full" /> Balanço por Categoria</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosBalanco()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                <Tooltip contentStyle={{borderRadius: '20px', border: 'none'}} />
                <Bar dataKey="entradas" fill="#10b981" radius={[8, 8, 0, 0]} barSize={20} />
                <Bar dataKey="saidas" fill="#f43f5e" radius={[8, 8, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}