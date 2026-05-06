'use client'
import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Metas() {
  const [metas, setMetas] = useState([])
  const [novaMeta, setNovaMeta] = useState({ objetivo: '', valor_alvo: '', prazo: '' })
  const [valorInput, setValorInput] = useState({})
  const [editandoMeta, setEditandoMeta] = useState(null)
  const [dadosEdit, setDadosEdit] = useState({ objetivo: '', valor_alvo: '', prazo: '' })

  const carregarMetas = async () => {
    try {
      const idUsuario = localStorage.getItem('usuarioId')
      if (!idUsuario) return
      const res = await fetch(`${API_URL}/listar-metas?id_usuario=${idUsuario}`)
      const dados = await res.json()
      setMetas(Array.isArray(dados) ? dados : [])
    } catch (err) { console.error("Erro ao carregar metas:", err) }
  }

  useEffect(() => { carregarMetas() }, [])

  const handleSalvar = async (e) => {
    e.preventDefault()
    const idUsuario = localStorage.getItem('usuarioId')
    try {
      await fetch(`${API_URL}/cadastrar-meta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...novaMeta, id_usuario: parseInt(idUsuario) })
      })
      setNovaMeta({ objetivo: '', valor_alvo: '', prazo: '' })
      carregarMetas()
    } catch (err) { console.error(err) }
  }

  const movimentarValor = async (id, tipo) => {
    const valor = valorInput[id]
    if (!valor || valor <= 0) return
    const valorFinal = tipo === 'remover' ? -Math.abs(valor) : Math.abs(valor)
    try {
      await fetch(`${API_URL}/atualizar-meta/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor_adicional: parseFloat(valorFinal) })
      })
      setValorInput({ ...valorInput, [id]: '' })
      carregarMetas()
    } catch (err) { console.error(err) }
  }

  const handleSalvarEdicao = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_URL}/editar-meta/${editandoMeta.id_meta}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosEdit)
      })
      if (res.ok) { setEditandoMeta(null); carregarMetas(); }
    } catch (err) { console.error(err) }
  }

  const deletarMeta = async (id) => {
    if (confirm("Deseja excluir este objetivo?")) {
      try {
        await fetch(`${API_URL}/deletar-meta/${id}`, { method: 'DELETE' })
        carregarMetas()
      } catch (err) { console.error(err) }
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tight">Metas</h2>
        <p className="text-slate-400 font-medium">Transforme seus sonhos em números.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-black">
        {/* FORMULÁRIO DE CADASTRO */}
        <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-50 h-fit">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-indigo-600 rounded-full" /> Criar Meta
          </h3>
          <form onSubmit={handleSalvar} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Objetivo</label>
              <input type="text" placeholder="Ex: Viagem para Europa" className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 font-semibold"
                 value={novaMeta.objetivo} onChange={e => setNovaMeta({...novaMeta, objetivo: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor Alvo</label>
              <input type="number" placeholder="R$ 0,00" className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 font-semibold"
                 value={novaMeta.valor_alvo} onChange={e => setNovaMeta({...novaMeta, valor_alvo: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Final</label>
              <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 font-semibold text-slate-400"
                 value={novaMeta.prazo} onChange={e => setNovaMeta({...novaMeta, prazo: e.target.value})} required />
            </div>
            <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs">
              Salvar Objetivo
            </button>
          </form>
        </div>

        {/* LISTAGEM DE METAS */}
        <div className="lg:col-span-2 space-y-6">
          {metas.map(meta => {
            const porcentagem = Math.min((meta.valor_poupado / meta.valor_alvo) * 100, 100).toFixed(0)
            return (
              <div key={meta.id_meta} className="bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-50 group">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-2xl font-black text-slate-800 tracking-tight">{meta.objetivo}</h4>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Vence em: {new Date(meta.prazo).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-black text-indigo-600">{porcentagem}%</span>
                    <button onClick={() => { setEditandoMeta(meta); setDadosEdit({ objetivo: meta.objetivo, valor_alvo: meta.valor_alvo, prazo: meta.prazo.split('T')[0] }); }} 
                            className="p-2 text-slate-300 hover:text-indigo-600 transition-all">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                    </button>
                    <button onClick={() => deletarMeta(meta.id_meta)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>

                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden mb-8 shadow-inner">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-1000 ease-out" style={{ width: `${porcentagem}%` }} />
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="grid grid-cols-2 gap-8 w-full md:w-auto">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Poupado</p>
                      {/* FONT-SEMIBOLD PARA IGUALAR AOS INPUTS DE CADASTRO */}
                      <p className="text-xl font-semibold text-emerald-500 tracking-tight">
                        R$ {parseFloat(meta.valor_poupado || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Objetivo</p>
                      <p className="text-xl font-semibold text-slate-800 tracking-tight">
                        R$ {parseFloat(meta.valor_alvo).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 w-full md:w-auto bg-slate-50 p-2 rounded-3xl border border-slate-100 shadow-inner">
                    <input type="number" placeholder="Valor" className="w-24 bg-transparent outline-none px-3 font-bold text-slate-700"
                      value={valorInput[meta.id_meta] || ''} onChange={e => setValorInput({ ...valorInput, [meta.id_meta]: e.target.value })} />
                    <button onClick={() => movimentarValor(meta.id_meta, 'remover')} className="px-4 py-3 bg-rose-100 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-200 transition-all">Retirar</button>
                    <button onClick={() => movimentarValor(meta.id_meta, 'adicionar')} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all">Poupar</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* MODAL DE EDIÇÃO */}
      {editandoMeta && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-black">
          <div className="bg-white w-full max-w-md rounded-[32px] p-10 shadow-2xl">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Editar Meta</h2>
            <form onSubmit={handleSalvarEdicao} className="space-y-5">
              <input className="w-full bg-slate-50 p-4 rounded-2xl font-semibold outline-none" value={dadosEdit.objetivo} onChange={e => setDadosEdit({...dadosEdit, objetivo: e.target.value})} required />
              <input type="number" className="w-full bg-slate-50 p-4 rounded-2xl font-semibold outline-none" value={dadosEdit.valor_alvo} onChange={e => setDadosEdit({...dadosEdit, valor_alvo: e.target.value})} required />
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditandoMeta(null)} className="flex-1 py-4 font-black text-slate-400 uppercase text-xs tracking-widest">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-xs tracking-widest shadow-lg">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}