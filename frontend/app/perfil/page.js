'use client'
import { useState, useEffect } from 'react'

export default function Perfil() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    setNome(localStorage.getItem('usuarioNome') || '')
    // Aqui você poderia buscar os dados completos do backend se quiser
  }, [])

  const atualizarPerfil = async (e) => {
    e.preventDefault()
    // Lógica para enviar PUT /usuario/:id no backend
    alert('Dados salvos (funcionalidade em desenvolvimento!)')
  }

  const deletarConta = async () => {
    if (confirm("ATENÇÃO: Isso apagará permanentemente sua conta e todos os seus registros financeiros. Deseja continuar?")) {
      // Lógica para enviar DELETE /usuario/:id no backend
      localStorage.clear()
      window.location.href = '/login'
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-10">
      <div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Ajustes da Conta</h2>
        <p className="text-slate-400 mt-2 font-medium">Gerencie suas informações pessoais e segurança.</p>
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
        <form onSubmit={atualizarPerfil} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome de Exibição</label>
            <input type="text" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-bold text-slate-700" 
              value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">E-mail</label>
            <input type="email" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none text-slate-400" 
              value="email@exemplo.com" disabled />
            <p className="text-[10px] text-slate-300 ml-1 italic">* O e-mail não pode ser alterado por segurança.</p>
          </div>

          <button className="w-full py-5 bg-indigo-600 text-white font-bold rounded-3xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
            Salvar Alterações
          </button>
        </form>

        <div className="pt-6 border-t border-slate-50">
          <button onClick={deletarConta} className="w-full py-4 text-red-400 font-bold hover:bg-red-50 rounded-2xl transition-all text-sm">
            Excluir minha conta permanentemente
          </button>
        </div>
      </div>
    </div>
  )
}