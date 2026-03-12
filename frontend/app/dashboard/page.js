'use client'
import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function Dashboard() {
  const [transacoes, setTransacoes] = useState([])
  const [transacoesFiltradas, setTransacoesFiltradas] = useState([])
  const [periodo, setPeriodo] = useState('tudo') // 'tudo', 'mes', 'semana'

  const carregarDados = async () => {
    try {
      const res = await fetch('http://localhost:3000/listar-transacoes')
      const dados = await res.json()
      setTransacoes(dados)
      setTransacoesFiltradas(dados)
    } catch (err) { console.error(err) }
  }

  useEffect(() => { carregarDados() }, [])

  // Lógica de Filtragem por Período
  useEffect(() => {
    const hoje = new Date()
    let filtradas = [...transacoes]

    if (periodo === 'mes') {
      filtradas = transacoes.filter(t => {
        const dataT = new Date(t.data)
        return dataT.getMonth() === hoje.getMonth() && dataT.getFullYear() === hoje.getFullYear()
      })
    } else if (periodo === 'semana') {
      const seteDiasAtras = new Date()
      seteDiasAtras.setDate(hoje.getDate() - 7)
      filtradas = transacoes.filter(t => new Date(t.data) >= seteDiasAtras)
    }

    setTransacoesFiltradas(filtradas)
  }, [periodo, transacoes])

  // Cálculos baseados no filtro atual
  const resumo = {
    entradas: transacoesFiltradas.filter(t => parseFloat(t.valor) > 0).reduce((acc, t) => acc + parseFloat(t.valor), 0),
    saidas: Math.abs(transacoesFiltradas.filter(t => parseFloat(t.valor) < 0).reduce((acc, t) => acc + parseFloat(t.valor), 0)),
    get saldo() { return this.entradas - this.saidas }
  }

  const dadosGrafico = [
    { name: 'Entradas', valor: resumo.entradas, cor: '#10b981' },
    { name: 'Saídas', valor: resumo.saidas, cor: '#f43f5e' }
  ]

  return (
    <div className="space-y-10">
      {/* HEADER COM FILTROS DE PERÍODO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Dashboard</h2>
          <p className="text-slate-400 font-medium">Análise de rendimentos e gastos.</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
          <button 
            onClick={() => setPeriodo('tudo')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${periodo === 'tudo' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Tudo
          </button>
          <button 
            onClick={() => setPeriodo('mes')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${periodo === 'mes' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Este Mês
          </button>
          <button 
            onClick={() => setPeriodo('semana')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${periodo === 'semana' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            7 Dias
          </button>
        </div>
      </div>

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Saldo no Período</p>
          <h3 className={`text-3xl font-black ${resumo.saldo >= 0 ? 'text-indigo-600' : 'text-rose-500'}`}>
            R$ {resumo.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Entradas</p>
          <h3 className="text-3xl font-black text-slate-800">R$ {resumo.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50">
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">Saídas</p>
          <h3 className="text-3xl font-black text-slate-800">R$ {resumo.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
      </div>

      {/* GRÁFICO DINÂMICO */}
      <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-50">
        <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2">
          <span className="w-2 h-6 bg-indigo-600 rounded-full" /> Comparativo
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 'bold', fontSize: 12 }} dy={10} />
              <YAxis hide />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="valor" radius={[15, 15, 15, 15]} barSize={60}>
                {dadosGrafico.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.cor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}