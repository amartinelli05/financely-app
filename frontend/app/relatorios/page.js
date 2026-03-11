'use client'
import { useState, useEffect } from 'react'

export default function Relatorios() {
  const [transacoes, setTransacoes] = useState([])
  const [categorias, setCategorias] = useState([])
  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [editando, setEditando] = useState(null)
  const [formEdit, setFormEdit] = useState({ descricao: '', valor: '', id_categoria: '' })

  const carregarDados = async () => {
    try {
      const resT = await fetch('http://localhost:3000/listar-transacoes')
      setTransacoes(await resT.json())
      const resC = await fetch('http://localhost:3000/testar-banco')
      setCategorias(await resC.json())
    } catch (err) { console.error(err) }
  }

  useEffect(() => { carregarDados() }, [])

  const deletar = async (id) => {
    if (confirm("Deseja excluir este lançamento?")) {
      await fetch(`http://localhost:3000/deletar-transacao/${id}`, { method: 'DELETE' })
      carregarDados()
    }
  }

  const iniciarEdicao = (t) => {
    setEditando(t.id_transacao)
    setFormEdit({ descricao: t.descricao, valor: t.valor, id_categoria: t.id_categoria })
  }

  const salvarEdicao = async (e) => {
    e.preventDefault()
    const res = await fetch(`http://localhost:3000/editar-transacao/${editando}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formEdit)
    })
    if (res.ok) { setEditando(null); carregarDados(); }
  }

  const transacoesFiltradas = transacoes.filter(t => {
    const buscaOK = t.descricao.toLowerCase().includes(filtroTexto.toLowerCase())
    const categoriaOK = filtroCategoria === '' || t.id_categoria === parseInt(filtroCategoria)
    return buscaOK && categoriaOK
  })

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Gerenciar Lançamentos</h2>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px] space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Pesquisar</label>
          <input type="text" placeholder="Filtrar descrição..." className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 text-sm"
            value={filtroTexto} onChange={e => setFiltroTexto(e.target.value)} />
        </div>
        <div className="w-48 space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Categoria</label>
          <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 text-sm"
            value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
            <option value="">Todas</option>
            {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nome_categoria}</option>)}
          </select>
        </div>
      </div>

      {/* GRID */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="p-6 text-[10px] font-bold text-slate-400 uppercase">Descrição</th>
              <th className="p-6 text-[10px] font-bold text-slate-400 uppercase">Categoria</th>
              <th className="p-6 text-[10px] font-bold text-slate-400 uppercase text-right">Valor</th>
              <th className="p-6 text-[10px] font-bold text-slate-400 uppercase text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transacoesFiltradas.map((t) => (
              <tr key={t.id_transacao} className="hover:bg-slate-50/50 transition-all group">
                <td className="p-6 font-bold text-slate-700">{t.descricao}</td>
                <td className="p-6">
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter">
                    {t.nome_categoria}
                  </span>
                </td>
                <td className="p-6 text-right font-black text-slate-900">R$ {parseFloat(t.valor).toFixed(2)}</td>
                <td className="p-6 text-center">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => iniciarEdicao(t)} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button onClick={() => deletar(t.id_transacao)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {editando && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl">
            <h3 className="text-xl font-bold mb-6 text-slate-800">Editar</h3>
            <form onSubmit={salvarEdicao} className="space-y-4">
              <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
                value={formEdit.descricao} onChange={e => setFormEdit({...formEdit, descricao: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" step="0.01" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
                  value={formEdit.valor} onChange={e => setFormEdit({...formEdit, valor: e.target.value})} />
                <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm"
                  value={formEdit.id_categoria} onChange={e => setFormEdit({...formEdit, id_categoria: e.target.value})}>
                  {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nome_categoria}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditando(null)} className="flex-1 py-4 font-bold text-slate-400">Cancelar</button>
                <button type="submit" className="flex-1 py-4 font-bold bg-indigo-600 text-white rounded-2xl shadow-lg hover:bg-indigo-700 transition-all">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}