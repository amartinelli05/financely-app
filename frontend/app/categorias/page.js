'use client'
import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState([])
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Estados para o Modal de Edição
  const [editandoCat, setEditandoCat] = useState(null)
  const [novoNomeEdit, setNovoNomeEdit] = useState('')

  const carregarCategorias = async () => {
    const idUsuario = localStorage.getItem('usuarioId')
    try {
      const res = await fetch(`${API_URL}/listar-categorias?id_usuario=${idUsuario}`)
      const data = await res.json()
      setCategorias(Array.isArray(data) ? data : [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { carregarCategorias() }, [])

  const handleAdicionar = async (e) => {
    e.preventDefault()
    const idUsuario = localStorage.getItem('usuarioId')
    try {
      const res = await fetch(`${API_URL}/categorias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome_categoria: nome, id_usuario: parseInt(idUsuario) })
      })
      if (res.ok) { setNome(''); carregarCategorias(); }
    } catch (err) { alert("Erro ao criar") }
  }

  const handleSalvarEdicao = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_URL}/editar-categoria/${editandoCat.id_categoria}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome_categoria: novoNomeEdit })
      })
      if (res.ok) {
        setEditandoCat(null)
        carregarCategorias()
      }
    } catch (err) { alert("Erro ao atualizar") }
  }

  const handleExcluir = async (id) => {
    if (!confirm("⚠️ Deseja excluir esta categoria?")) return
    try {
      const res = await fetch(`${API_URL}/excluir-categoria/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) carregarCategorias()
      else alert(data.erro)
    } catch (err) { alert("Erro na conexão") }
  }

  return (
    <div className="max-w-4xl space-y-8 text-black pb-20 relative">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Minhas <span className="text-indigo-600">Categorias</span>
        </h1>
        <p className="text-slate-500 font-medium">Cadastre e organize seus grupos de gastos.</p>
      </div>

      {/* Formulário de Adição Rápida */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
        <form onSubmit={handleAdicionar} className="flex gap-4">
          <input 
            value={nome} onChange={e => setNome(e.target.value)}
            placeholder="Nova categoria (ex: Viagens)" required
            className="flex-1 p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
          />
          <button type="submit" className="bg-indigo-600 text-white px-8 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
            Adicionar
          </button>
        </form>
      </div>

      {/* Lista de Categorias */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Nome</th>
              <th className="p-6 text-xs font-bold text-slate-400 uppercase text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-medium">
            {categorias.map(cat => (
              <tr key={cat.id_categoria} className="group hover:bg-slate-50/50 transition-all">
                <td className="p-6">
                  <span className="font-bold text-slate-700">{cat.nome_categoria}</span>
                  {cat.id_usuario === null && (
                    <span className="ml-3 text-[9px] font-black bg-slate-100 text-slate-400 px-2 py-1 rounded uppercase tracking-tighter">Padrão</span>
                  )}
                </td>
                <td className="p-6 text-right">
                  <div className="flex justify-end gap-2">
                    {/* Lógica de Proteção: Só mostra ações se NÃO for categoria do sistema */}
                    {cat.id_usuario !== null ? (
                      <>
                        <button 
                          onClick={() => { setEditandoCat(cat); setNovoNomeEdit(cat.nome_categoria); }}
                          className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="Editar Categoria"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        </button>
                        <button 
                          onClick={() => handleExcluir(cat.id_categoria)}
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          title="Excluir Categoria"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-300 font-bold italic pr-2 flex items-center gap-1 justify-end select-none">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        Sistema
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TELA DE EDIÇÃO (MODAL) */}
      {editandoCat && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] p-10 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-900">Editar Categoria</h2>
              <button onClick={() => setEditandoCat(null)} className="text-slate-400 hover:text-slate-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <form onSubmit={handleSalvarEdicao} className="space-y-6">
              <div>
                <label className="text-sm font-bold text-slate-700 ml-1">Novo nome da categoria</label>
                <input 
                  autoFocus
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 mt-2 focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-bold text-slate-800"
                  value={novoNomeEdit}
                  onChange={(e) => setNovoNomeEdit(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditandoCat(null)}
                  className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Desistir
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-4 bg-[#4f46e5] text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}