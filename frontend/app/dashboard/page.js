'use client'
import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'

export default function Dashboard() {
  const [dados, setDados] = useState({ entradas: 0, saidas: 0, saldo: 0 })
  const [catEntradas, setCatEntradas] = useState([])
  const [catSaidas, setCatSaidas] = useState([])

  const carregarDashboard = async () => {
    try {
      const resTotais = await fetch('http://localhost:3000/totais')
      const totais = await resTotais.json()
      setDados(totais)

      const resTrans = await fetch('http://localhost:3000/listar-transacoes')
      const trans = await resTrans.json()
      
      // Agrupar Entradas por Categoria
      const entradasAgrupadas = trans
        .filter(t => parseFloat(t.valor) > 0)
        .reduce((acc, curr) => {
          const nome = curr.nome_categoria || 'Outros'
          acc[nome] = (acc[nome] || 0) + Math.abs(parseFloat(curr.valor))
          return acc
        }, {})

      // Agrupar Saídas por Categoria
      const saidasAgrupadas = trans
        .filter(t => parseFloat(t.valor) < 0)
        .reduce((acc, curr) => {
          const nome = curr.nome_categoria || 'Outros'
          acc[nome] = (acc[nome] || 0) + Math.abs(parseFloat(curr.valor))
          return acc
        }, {})
      
      setCatEntradas(Object.entries(entradasAgrupadas).map(([name, total]) => ({ name, total })))
      setCatSaidas(Object.entries(saidasAgrupadas).map(([name, total]) => ({ name, total })))

    } catch (err) {
      console.error("Erro ao carregar dados:", err)
    }
  }

  useEffect(() => { carregarDashboard() }, [])

  // Definição de Cores para Entradas (Verdes/Esmeralda)
  const COLORS_ENTRADAS = ['#10b981', '#34d399', '#6ee7b7', '#059669']
  // Definição de Cores para Saídas (Rosas/Vermelhos)
  const COLORS_SAIDAS = ['#f43f5e', '#fb7185', '#fda4af', '#e11d48']

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Dashboard</h2>
        <p className="text-slate-400 font-medium italic">Análise detalhada de movimentações.</p>
      </div>

      {/* Cards de Totais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200">
          <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mb-2">Saldo Atual</p>
          <h3 className="text-3xl font-black">R$ {parseFloat(dados.saldo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Entradas Totais</p>
          <h3 className="text-3xl font-black text-slate-800 text-emerald-500">R$ {parseFloat(dados.entradas || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-2">Saídas Totais</p>
          <h3 className="text-3xl font-black text-slate-800 text-rose-500">R$ {parseFloat(dados.saidas || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
      </div>

      {/* Grid de Gráficos usando Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* GRÁFICO DE ENTRADAS */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
          <h3 className="text-[10px] font-bold mb-10 text-emerald-500 uppercase tracking-widest">Ganhos por Categoria</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catEntradas}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  cursor={{fill: 'rgba(16, 185, 129, 0.05)'}}
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.05)'}}
                />
                <Bar dataKey="total" radius={[10, 10, 10, 10]} barSize={40}>
                  {catEntradas.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_ENTRADAS[index % COLORS_ENTRADAS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO DE SAÍDAS */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
          <h3 className="text-[10px] font-bold mb-10 text-rose-500 uppercase tracking-widest">Gastos por Categoria</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catSaidas}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  cursor={{fill: 'rgba(244, 63, 94, 0.05)'}}
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.05)'}}
                />
                <Bar dataKey="total" radius={[10, 10, 10, 10]} barSize={40}>
                  {catSaidas.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_SAIDAS[index % COLORS_SAIDAS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}