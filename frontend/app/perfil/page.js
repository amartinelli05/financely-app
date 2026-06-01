'use client'
import { useState, useEffect, useRef } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Perfil() {
  const [usuario, setUsuario] = useState({ nome: '', email: '', foto: null })
  const [estatisticas, setEstatisticas] = useState({ totalTransacoes: 0, saldoAtual: 0 })
  const fileInputRef = useRef(null)

  useEffect(() => {
    const nomeSalvo = localStorage.getItem('usuarioNome') || 'Usuário'
    const emailSalvo = localStorage.getItem('usuarioEmail') || 'E-mail não cadastrado'
    const fotoSalva = localStorage.getItem('usuarioFoto') 
    const idUsuario = localStorage.getItem('usuarioId')
    
    setUsuario({ nome: nomeSalvo, email: emailSalvo, foto: fotoSalva })

    const carregarDadosFinanceiros = async () => {
      if (!idUsuario) return
      try {
        // 1. Busca Saldo Total Consolidado da tabela 'contas'
        // Certifique-se de que a rota no seu backend seja: app.get('/saldo-total-contas/:id_usuario', ...)
        const resSaldo = await fetch(`${API_URL}/saldo-total-contas/${idUsuario}`);
        const dadosSaldo = await resSaldo.json();

        // 2. Busca Total de Registros de transações
        const resTrans = await fetch(`${API_URL}/listar-transacoes?id_usuario=${idUsuario}&limite=999999`);
        const dadosTrans = await resTrans.json();
        const listaValida = dadosTrans && Array.isArray(dadosTrans.registros) ? dadosTrans.registros : [];
        
        setEstatisticas({ 
            totalTransacoes: listaValida.length, 
            saldoAtual: dadosSaldo.saldoTotal || 0 
        })
      } catch (err) { 
        console.error("Erro ao carregar dados do perfil:", err) 
      }
    }
    carregarDadosFinanceiros()
  }, [])

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        setUsuario(prev => ({ ...prev, foto: base64 }));
        localStorage.setItem('usuarioFoto', base64);
      };
      reader.readAsDataURL(file);
    }
  }

  const handleLogout = () => {
    localStorage.clear();
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict";
    window.location.href = '/login';
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-black animate-in fade-in duration-500">
      <div className="relative bg-white rounded-[3rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-50" />

        <div className="relative flex flex-col md:flex-row items-center gap-8">
          {/* FOTO DE PERFIL COM INTERAÇÃO */}
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
            <div className="w-32 h-32 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-indigo-200 overflow-hidden transition-all border-4 border-white hover:scale-105">
              {usuario.foto ? <img src={usuario.foto} className="w-full h-full object-cover" /> : usuario.nome.charAt(0).toUpperCase()}
            </div>
            <div className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-lg text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFotoChange} />
          </div>

          <div className="flex-1 text-center md:text-left space-y-2">
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">{usuario.nome}</h2>
            <p className="text-slate-400 font-bold text-sm bg-slate-50 inline-block px-4 py-2 rounded-xl">{usuario.email}</p>
          </div>

          <button onClick={handleLogout} className="px-8 py-4 bg-red-50 text-red-500 rounded-2xl font-bold hover:bg-red-100 transition-all text-sm">Sair</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
           <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
             <span className="w-2 h-8 bg-indigo-600 rounded-full" /> Perfil Financeiro
           </h3>
           <p className="text-slate-500 font-medium">Gerencie suas configurações de conta e preferências diretamente pelo painel do Financely.</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <span className="w-2 h-8 bg-emerald-500 rounded-full" /> Atividade no App
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-slate-50 rounded-3xl text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Registros</p>
              <p className="text-2xl font-black text-slate-800">{estatisticas.totalTransacoes}</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Total</p>
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