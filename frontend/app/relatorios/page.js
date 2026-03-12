'use client'
import { useState, useEffect } from 'react'

export default function Relatorios() {
  const [transacoes, setTransacoes] = useState([])
  const [categorias, setCategorias] = useState([])
  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [editando, setEditando] = useState(null)
  const [formEdit, setFormEdit] = useState({ descricao: '', valor: '', id_categoria: '', data: '' })

  const carregarDados = async () => {
    try {
      const resT = await fetch('http://localhost:3000/listar-transacoes')
      setTransacoes(await resT.json())
      const resC = await fetch('http://localhost:3000/testar-banco')
      setCategorias(await resC.json())
    } catch (err) { console.error(err) }
  }

  useEffect(() => { carregarDados() }, [])

  // FUNÇÃO PARA EXPORTAR CSV
  const exportarCSV = () => {
    const cabecalho = ["Descricao", "Categoria", "Data", "Valor (R$)", "Tipo\n"];
    
    const linhas = transacoesFiltradas.map(t => {
      const data = t.data ? new Date(t.data).toLocaleDateString('pt-BR') : '--/--';
      const valor = parseFloat(t.valor).toFixed(2).replace('.', ',');
      const tipo = parseFloat(t.valor) >= 0 ? 'Entrada' : 'Saída';
      
      return `${t.descricao};${t.nome_categoria};${data};${valor};${tipo}`;
    });

    const conteudoCSV = cabecalho + linhas.join('\n');
    const blob = new Blob(["\ufeff" + conteudoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_financely_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
    link.click();
  };

  const deletar = async (id) => {
    if (confirm("Deseja excluir este lançamento?")) {
      await fetch(`http://localhost:3000/deletar-transacao/${id}`, { method: 'DELETE' })
      carregarDados()
    }
  }

  const iniciarEdicao = (t) => {
    setEditando(t.id_transacao)
    setFormEdit({ 
      descricao: t.descricao, 
      valor: t.valor, 
      id_categoria: t.id_categoria,
      data: t.data ? t.data.split('T')[0] : '' 
    })
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
      {/* CABEÇALHO COM BOTÃO DE EXPORTAR */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Relatórios Detalhados</h2>
          <p className="text-slate-400 text-sm font-medium">Gerencie e exporte seu histórico financeiro.</p>
        </div>
        
        <button 
          onClick={exportarCSV}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all hover:scale-105 active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Exportar Planilha
        </button>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px] space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pesquisar</label>
          <input type="text" placeholder="Filtrar descrição..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 text-sm font-semibold transition-all"
            value={filtroTexto} onChange={e => setFiltroTexto(e.target.value)} />
        </div>
        <div className="w-48 space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
          <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 text-sm font-semibold transition-all appearance-none"
            value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
            <option value="">Todas</option>
            {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nome_categoria}</option>)}
          </select>
        </div>
      </div>

      {/* GRID / TABELA */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tipo</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Categoria</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Data</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transacoesFiltradas.map((t) => (
                <tr key={t.id_transacao} className="hover:bg-slate-50/50 transition-all group">
                  <td className="p-6">
                    <p className="font-bold text-slate-800">{t.descricao}</p>
                  </td>
                  <td className="p-6 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {parseFloat(t.valor) >= 0 ? 'Entrada' : 'Saída'}
                    </span>
                  </td>
                  <td className="p-6 text-center">
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider">
                      {t.nome_categoria}
                    </span>
                  </td>
                  <td className="p-6 text-center">
                    <span className="text-sm font-bold text-slate-400">
                      {t.data ? new Date(t.data).toLocaleDateString('pt-BR') : '--/--'}
                    </span>
                  </td>
                  <td className="p-6 text-right font-black text-slate-900">
                    R$ {Math.abs(parseFloat(t.valor)).toFixed(2)}
                  </td>
                  <td className="p-6 text-center">
                    <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => iniciarEdicao(t)} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button onClick={() => deletar(t.id_transacao)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO */}
      {editando && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl border border-slate-100">
            <h3 className="text-2xl font-bold mb-8 text-slate-800 tracking-tight">Editar Lançamento</h3>
            <form onSubmit={salvarEdicao} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Descrição</label>
                <input type="text" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600/20 font-bold"
                  value={formEdit.descricao} onChange={e => setFormEdit({...formEdit, descricao: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Valor</label>
                  <input type="number" step="0.01" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600/20 font-bold"
                    value={formEdit.valor} onChange={e => setFormEdit({...formEdit, valor: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Categoria</label>
                  <select className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600/20 font-bold text-sm"
                    value={formEdit.id_categoria} onChange={e => setFormEdit({...formEdit, id_categoria: e.target.value})}>
                    {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nome_categoria}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setEditando(null)} className="flex-1 py-4 font-bold text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-4 font-bold bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}