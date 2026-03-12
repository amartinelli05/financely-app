'use client'
import { useState, useEffect } from 'react'

export default function Perfil() {
  const [usuario, setUsuario] = useState({ nome: '', email: '' })
  const [estatisticas, setEstatisticas] = useState({ totalTransacoes: 0, saldoAtual: 0 })

  useEffect(() => {
    const nomeSalvo = localStorage.getItem('usuarioNome') || 'Usuário'
    const emailSalvo = localStorage.getItem('usuarioEmail') || 'E-mail não cadastrado'
    
    setUsuario({ nome: nomeSalvo, email: emailSalvo })

    const carregarDadosFinanceiros = async () => {
      try {
        const res = await fetch('http://localhost:3000/listar-transacoes')
        const dados = await res.json()
        const saldo = dados.reduce((acc, t) => acc + parseFloat(t.valor), 0)
        setEstatisticas({ totalTransacoes: dados.length, saldoAtual: saldo })
      } catch (err) { console.error("Erro ao carregar dados:", err) }
    }
    carregarDadosFinanceiros()
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* HEADER DINÂMICO */}
      <div className="relative bg-white rounded-[3rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-50" />

        <div className="relative flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-indigo-200">
            {usuario.nome ? usuario.nome.charAt(0).toUpperCase() : 'U'}
          </div>

          <div className="flex-1 text-center md:text-left space-y-2">
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">{usuario.nome}</h2>
            <p className="text-slate-400 font-bold text-sm bg-slate-50 inline-block px-4 py-2 rounded-xl">{usuario.email}</p>
          </div>

          <button onClick={() => { localStorage.clear(); window.location.href = '/'; }}
            className="px-8 py-4 bg-red-50 text-red-500 rounded-2xl font-bold hover:bg-red-100 transition-all text-sm">
            Sair da Conta
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* INFO DA CONTA */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <span className="w-2 h-8 bg-indigo-600 rounded-full" /> Dados da Conta
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Status</span>
              <span className="text-emerald-500 font-bold flex items-center gap-2">Ativo</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Plano</span>
              <span className="text-slate-800 font-bold">Gratuito</span>
            </div>
          </div>
        </div>

        {/* RESUMO FINANCEIRO */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <span className="w-2 h-8 bg-emerald-500 rounded-full" /> Atividade no App
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-slate-50 rounded-3xl text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Registros</p>
              <p className="text-2xl font-black text-slate-800">{estatisticas.totalTransacoes}</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Atual</p>
              <p className={`text-xl font-black ${estatisticas.saldoAtual >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                R$ {Math.abs(estatisticas.saldoAtual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}