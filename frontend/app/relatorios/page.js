'use client'
import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function Relatorios() {
  const [transacoes, setTransacoes] = useState([])
  const [categorias, setCategorias] = useState([])
  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [editando, setEditando] = useState(null)
  const [formEdit, setFormEdit] = useState({ 
    descricao: '', 
    valor: '', 
    id_categoria: '', 
    data_transacao: '',
    tipo_movimento: '' 
  })

  const carregarDados = async () => {
    try {
      const idUsuario = localStorage.getItem('usuarioId')
      if (!idUsuario) return

      const resT = await fetch(`${API_URL}/listar-transacoes?id_usuario=${idUsuario}`)
      const dadosT = await resT.json()
      setTransacoes(Array.isArray(dadosT) ? dadosT : [])
      
      const resC = await fetch(`${API_URL}/listar-categorias?id_usuario=${idUsuario}`)
      const dadosC = await resC.json()
      setCategorias(Array.isArray(dadosC) ? dadosC : [])
    } catch (err) { console.error("Erro ao carregar dados:", err) }
  }

  useEffect(() => { carregarDados() }, [])

  // --- FILTRAGEM COMBINADA (CRUCIAL) ---
  const transacoesFiltradas = transacoes.filter(t => {
    const descricaoMatch = t.descricao.toLowerCase().includes(filtroTexto.toLowerCase())
    const categoriaMatch = filtroCategoria === '' || String(t.id_categoria) === String(filtroCategoria)
    return descricaoMatch && categoriaMatch
  })

  // --- EXCLUSÃO ---
  const deletarTransacao = async (id) => {
    if (window.confirm("⚠️ Você tem certeza que deseja excluir esta transação?")) {
      try {
        const res = await fetch(`${API_URL}/deletar-transacao/${id}`, { method: 'DELETE' })
        if (res.ok) { carregarDados(); alert("Removido com sucesso!") }
      } catch (err) { alert("Erro ao deletar.") }
    }
  }

  // --- EDIÇÃO ---
  const iniciarEdicao = (t) => {
    setEditando(t.id_transacao)
    setFormEdit({ 
      descricao: t.descricao, 
      valor: Math.abs(t.valor), 
      id_categoria: t.id_categoria,
      data_transacao: t.data_transacao ? t.data_transacao.split('T')[0] : '',
      tipo_movimento: t.tipo_movimento 
    })
  }

  const salvarEdicao = async (e) => {
    e.preventDefault()
    if (!window.confirm("Deseja salvar as alterações?")) return;

    try {
      const res = await fetch(`${API_URL}/editar-transacao/${editando}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formEdit)
      })
      if (res.ok) { 
        setEditando(null); 
        carregarDados();
        alert("Atualizado com sucesso!");
      }
    } catch (err) { alert("Erro na conexão.") }
  }

  // --- EXPORTAÇÃO PDF (COMPLETA) ---
  const exportarPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')
      const doc = new jsPDF()
      
      doc.setFontSize(20);
      doc.text("Relatório Financely", 14, 20);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 14, 28);

      const colunas = ["Descrição", "Tipo", "Categoria", "Data", "Valor"];
      const linhas = transacoesFiltradas.map(t => [
        t.descricao,
        t.tipo_movimento,
        t.nome_categoria,
        new Date(t.data_transacao).toLocaleDateString('pt-BR'),
        `R$ ${Math.abs(t.valor).toFixed(2)}`
      ])

      autoTable(doc, {
        startY: 35,
        head: [colunas],
        body: linhas,
        headStyles: { fillColor: [79, 70, 229] }
      })

      doc.save(`relatorio_financely.pdf`)
    } catch (error) { alert("Erro ao gerar PDF") }
  }

  const exportarCSV = () => {
    const cabecalho = "Descricao;Categoria;Data;Valor;Tipo\n";
    const linhas = transacoesFiltradas.map(t => 
      `${t.descricao};${t.nome_categoria};${new Date(t.data_transacao).toLocaleDateString()};${t.valor};${t.tipo_movimento}`
    ).join('\n');
    const blob = new Blob(["\ufeff" + cabecalho + linhas], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "relatorio.csv";
    link.click();
  }

  return (
    <div className="space-y-8 text-black pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Relatórios</h2>
          <p className="text-slate-500 text-sm">Controle total dos seus dados.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportarCSV} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-xs hover:bg-slate-200">CSV</button>
          <button onClick={exportarPDF} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700">PDF</button>
        </div>
      </div>

      {/* FILTROS INTEGRADOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <input 
          type="text" 
          placeholder="Pesquisar descrição..." 
          className="p-4 bg-slate-50 rounded-2xl outline-none border border-slate-50 focus:border-indigo-300 transition-all"
          value={filtroTexto} 
          onChange={e => setFiltroTexto(e.target.value)} 
        />
        <select 
          className="p-4 bg-slate-50 rounded-2xl outline-none border border-slate-50"
          value={filtroCategoria} 
          onChange={e => setFiltroCategoria(e.target.value)}
        >
          <option value="">Todas as Categorias</option>
          {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nome_categoria}</option>)}
        </select>
      </div>

      {/* TABELA DE DADOS */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="p-6 text-xs font-bold text-slate-400 uppercase">Descrição</th>
              <th className="p-6 text-xs font-bold text-slate-400 uppercase text-center">Categoria</th>
              <th className="p-6 text-xs font-bold text-slate-400 uppercase text-right">Valor</th>
              <th className="p-6 text-xs font-bold text-slate-400 uppercase text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transacoesFiltradas.map((t) => (
              <tr key={t.id_transacao} className="group hover:bg-slate-50/80 transition-all">
                <td className="p-6 font-semibold text-slate-700">{t.descricao}</td>
                <td className="p-6 text-center"><span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded-md text-slate-500 uppercase">{t.nome_categoria}</span></td>
                <td className={`p-6 text-right font-bold ${t.valor >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  R$ {Math.abs(t.valor).toFixed(2)}
                </td>
                <td className="p-6 text-center">
                  <div className="flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => iniciarEdicao(t)} className="text-indigo-600 font-bold text-xs hover:underline">Editar</button>
                    <button onClick={() => deletarTransacao(t.id_transacao)} className="text-red-500 font-bold text-xs hover:underline">Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE EDIÇÃO */}
      {editando && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl">
            <h3 className="text-xl font-bold mb-6 text-slate-800">Editar Registro</h3>
            <form onSubmit={salvarEdicao} className="space-y-4">
              <input type="text" className="w-full p-4 bg-slate-50 rounded-xl outline-none font-semibold border border-slate-100" value={formEdit.descricao} onChange={e => setFormEdit({...formEdit, descricao: e.target.value})} />
              <input type="number" className="w-full p-4 bg-slate-50 rounded-xl outline-none font-semibold border border-slate-100" value={formEdit.valor} onChange={e => setFormEdit({...formEdit, valor: e.target.value})} />
              <select className="w-full p-4 bg-slate-50 rounded-xl outline-none font-semibold border border-slate-100" value={formEdit.id_categoria} onChange={e => setFormEdit({...formEdit, id_categoria: e.target.value})}>
                {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nome_categoria}</option>)}
              </select>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditando(null)} className="flex-1 py-4 font-bold text-slate-400">Cancelar</button>
                <button type="submit" className="flex-1 py-4 font-bold bg-indigo-600 text-white rounded-xl">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}