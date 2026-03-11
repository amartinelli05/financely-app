'use client'
import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function Dashboard() {
  const [dadosGrafico, setDadosGrafico] = useState([])

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const res = await fetch('http://localhost:3000/listar-transacoes')
        const transacoes = await res.json()
        
        // Agrupar gastos por categoria
        const agrupado = transacoes.reduce((acc, t) => {
          acc[t.nome_categoria] = (acc[t.nome_categoria] || 0) + parseFloat(t.valor)
          return acc
        }, {})

        const formatado = Object.keys(agrupado).map(cat => ({
          name: cat,
          total: agrupado[cat]
        }))

        setDadosGrafico(formatado)
      } catch (err) { console.error(err) }
    }
    buscarDados()
  }, [])

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b']

  // Lógica para os cards de resumo
  const maiorGasto = dadosGrafico.length > 0 
    ? dadosGrafico.reduce((prev, current) => (prev.total > current.total) ? prev : current).name 
    : "..."

  const totalGeral = dadosGrafico.reduce((acc, d) => acc + d.total, 0)

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-slate-800">Análise de Gastos</h2>

      {/* --- NOVOS CARDS DE RESUMO --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100">
          <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mb-2">Maior Categoria</p>
          <h4 className="text-2xl font-black">{maiorGasto}</h4>
        </div>
        
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Acumulado</p>
          <h4 className="text-2xl font-black text-slate-800">
            R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h4>
        </div>
      </div>
      {/* ---------------------------- */}
      
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold mb-6 text-slate-600 uppercase text-[10px] tracking-widest">Gastos por Categoria (R$)</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosGrafico}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <YAxis hide />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
              <Bar dataKey="total" radius={[10, 10, 10, 10]} barSize={40}>
                {dadosGrafico.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}