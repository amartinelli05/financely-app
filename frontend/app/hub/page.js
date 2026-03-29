'use client'
import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function HubPage() {
  const [transacoes, setTransacoes] = useState([])
  const [resumo, setResumo] = useState({ saldo: 0, entradas: 0, saidas: 0 })

  const carregarDados = async () => {
    try {
      const id = localStorage.getItem('usuarioId')
      if (!id) return
      
      const [resT, resR] = await Promise.all([
        fetch(`${API_URL}/listar-transacoes?id_usuario=${id}`),
        fetch(`${API_URL}/resumo-financeiro?id_usuario=${id}`)
      ])
      
      setTransacoes(await resT.json())
      setResumo(await resR.json())
    } catch (err) { console.error("Erro ao carregar Hub:", err) }
  }

  useEffect(() => { carregarDados() }, [])

  return (
    <div className="space-y-12 pb-20 text-black">
      {/* HEADER PESADO */}
      <div>
        <h2 className="text-4xl font-[900] text-slate-800 tracking-tighter italic uppercase">Hub <span className="text-indigo-600">Geral</span></h2>
        <p className="text-slate-400 font-bold italic">Seu controle financeiro em tempo real.</p>
      </div>

      {/* CARDS COM FONT 900 (ESTILO EXTRA BOLD) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl shadow-slate-200/40 border border-slate-50">
          <p className="text-[10px] font-[900] text-slate-400 uppercase tracking-[0.2em] mb-3 italic">Saldo Disponível</p>
          <h3 className="text-5xl font-[900] text-slate-800 tracking-tighter italic">
            R$ {parseFloat(resumo.saldo || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
          </h3>
        </div>

        <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl shadow-slate-200/40 border border-slate-50">
          <p className="text-[10px] font-[900] text-slate-400 uppercase tracking-[0.2em] mb-3 italic">Entradas</p>
          <h3 className="text-5xl font-[900] text-emerald-500 tracking-tighter italic">
            + R$ {parseFloat(resumo.entradas || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
          </h3>
        </div>

        <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl shadow-slate-200/40 border border-slate-50">
          <p className="text-[10px] font-[900] text-slate-400 uppercase tracking-[0.2em] mb-3 italic">Saídas</p>
          <h3 className="text-5xl font-[900] text-rose-500 tracking-tighter italic">
            - R$ {parseFloat(resumo.saidas || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
          </h3>
        </div>
      </div>

      {/* TABELA DE LANÇAMENTOS RESTAURADA */}
      <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <h3 className="text-xl font-[900] text-slate-800 italic uppercase tracking-tighter">Últimas Movimentações</h3>
          <button className="text-[11px] font-[900] text-indigo-600 uppercase tracking-widest hover:underline italic">Ver Histórico</button>
        </div>
        
        <table className="w-full text-left">
          <thead>
            <tr className="text-[11px] font-[900] text-slate-400 uppercase tracking-[0.15em] italic border-b border-slate-50">
              <th className="p-10">Descrição</th>
              <th className="p-10">Categoria</th>
              <th className="p-10 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {transacoes.slice(0, 10).map(t => (
              <tr key={t.id_transacao} className="group hover:bg-slate-50/60 transition-all font-[900] italic">
                <td className="p-10 text-slate-700 tracking-tight text-lg italic">{t.descricao}</td>
                <td className="p-10">
                  <span className="text-[10px] font-[900] px-5 py-2.5 bg-slate-100 rounded-full uppercase italic text-slate-500 tracking-tighter">
                    {t.nome_categoria}
                  </span>
                </td>
                <td className={`p-10 text-right text-2xl tracking-tighter ${t.tipo === 'entrada' || parseFloat(t.valor) > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {t.tipo === 'entrada' ? '+' : '-'} R$ {Math.abs(parseFloat(t.valor)).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}