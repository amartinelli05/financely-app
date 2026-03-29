'use client'
import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function Metas() {
  const [metas, setMetas] = useState([])
  const [novaMeta, setNovaMeta] = useState({ objetivo: '', valor_alvo: '', prazo: '' })
  const [valorInput, setValorInput] = useState({})
  const [editandoMeta, setEditandoMeta] = useState(null)
  const [dadosEdit, setDadosEdit] = useState({ objetivo: '', valor_alvo: '', prazo: '' })

  const carregarMetas = async () => {
    const id = localStorage.getItem('usuarioId')
    const res = await fetch(`${API_URL}/listar-metas?id_usuario=${id}`)
    const dados = await res.json()
    setMetas(Array.isArray(dados) ? dados : [])
  }

  useEffect(() => { carregarMetas() }, [])

  const handleSalvar = async (e) => {
    e.preventDefault()
    await fetch(`${API_URL}/cadastrar-meta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...novaMeta, id_usuario: localStorage.getItem('usuarioId') })
    })
    setNovaMeta({ objetivo: '', valor_alvo: '', prazo: '' })
    carregarMetas()
  }

  const movimentarMeta = async (id, tipo) => {
    const valorRaw = valorInput[id]
    if (!valorRaw || valorRaw <= 0) return
    const valorFinal = tipo === 'remover' ? -Math.abs(valorRaw) : Math.abs(valorRaw)
    await fetch(`${API_URL}/atualizar-meta/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valor_adicional: parseFloat(valorFinal) })
    })
    setValorInput({ ...valorInput, [id]: '' })
    carregarMetas()
  }

  return (
    <div className="space-y-10 text-black">
      <div>
        <h2 className="text-4xl font-[900] text-slate-800 tracking-tighter italic">Metas</h2>
        <p className="text-slate-400 font-bold">Transforme seus sonhos em números.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-50 h-fit">
          <h3 className="text-xl font-[900] text-slate-800 mb-6 flex items-center gap-2 italic uppercase">
            <span className="w-1.5 h-6 bg-indigo-600 rounded-full" /> Criar Meta
          </h3>
          <form onSubmit={handleSalvar} className="space-y-4">
            <input placeholder="Ex: Viagem para Europa" className="w-full p-4 bg-slate-50 rounded-2xl font-[900] outline-none text-black" 
              value={novaMeta.objetivo} onChange={e => setNovaMeta({...novaMeta, objetivo: e.target.value})} required />
            <input type="number" placeholder="Valor Alvo" className="w-full p-4 bg-slate-50 rounded-2xl font-[900] outline-none text-black" 
              value={novaMeta.valor_alvo} onChange={e => setNovaMeta({...novaMeta, valor_alvo: e.target.value})} required />
            <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl font-[900] outline-none text-slate-400 uppercase" 
              value={novaMeta.prazo} onChange={e => setNovaMeta({...novaMeta, prazo: e.target.value})} required />
            <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-[900] uppercase text-xs tracking-widest shadow-lg">Salvar Objetivo</button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {metas.map(meta => {
            const porcentagem = Math.min((meta.valor_poupado / meta.valor_alvo) * 100, 100).toFixed(0)
            return (
              <div key={meta.id_meta} className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-50 group">
                <div className="flex justify-between items-start mb-6 font-[900] italic">
                  <div>
                    <h4 className="text-2xl text-slate-800 tracking-tighter">{meta.objetivo}</h4>
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-1">Vence em: {new Date(meta.prazo).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl text-indigo-600">{porcentagem}%</span>
                    <button onClick={() => setEditandoMeta(meta)} className="p-2 text-slate-300 hover:text-indigo-600 transition-all"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button>
                  </div>
                </div>

                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden mb-8 shadow-inner">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400" style={{ width: `${porcentagem}%` }} />
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex gap-8">
                    <div>
                      <p className="text-[10px] font-[900] text-slate-400 uppercase tracking-widest mb-1">Poupado</p>
                      <p className="text-xl font-[900] text-emerald-500 italic">R$ {parseFloat(meta.valor_poupado || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-[900] text-slate-400 uppercase tracking-widest mb-1">Objetivo</p>
                      <p className="text-xl font-[900] text-slate-800 italic">R$ {parseFloat(meta.valor_alvo).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                    </div>
                  </div>

                  {/* ADICIONAR / REMOVER VALOR */}
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-[2rem] border border-slate-100">
                    <input type="number" placeholder="Valor" className="w-20 bg-transparent outline-none px-2 font-[900] text-slate-700"
                      value={valorInput[meta.id_meta] || ''}
                      onChange={e => setValorInput({ ...valorInput, [meta.id_meta]: e.target.value })}
                    />
                    <button onClick={() => movimentarMeta(meta.id_meta, 'remover')} className="px-4 py-2 bg-rose-100 text-rose-600 rounded-xl font-[900] text-[9px] uppercase hover:bg-rose-200 transition-all">
                      Retirar
                    </button>
                    <button onClick={() => movimentarMeta(meta.id_meta, 'adicionar')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-[900] text-[9px] uppercase hover:bg-indigo-700 transition-all">
                      Poupar
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* MODAL DE EDIÇÃO */}
      {editandoMeta && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] p-10 shadow-2xl">
            <h2 className="text-2xl font-[900] italic mb-6 uppercase tracking-tighter">Editar Meta</h2>
            <form onSubmit={(e) => { e.preventDefault(); /* ... lógica salvar ... */ }} className="space-y-4">
              <input className="w-full bg-slate-50 p-4 rounded-2xl font-[900] outline-none" value={editandoMeta.objetivo} required />
              <input type="number" className="w-full bg-slate-50 p-4 rounded-2xl font-[900] outline-none" value={editandoMeta.valor_alvo} required />
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setEditandoMeta(null)} className="flex-1 py-4 font-[900] text-slate-400 uppercase text-xs">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-[900] rounded-2xl uppercase text-xs">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}