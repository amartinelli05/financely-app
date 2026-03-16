'use client'
import { useState, useEffect } from 'react'

// URL Dinâmica para Vercel/Local
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function Relatorios() {
  const [transacoes, setTransacoes] = useState([])
  const [categorias, setCategorias] = useState([])
  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [editando, setEditando] = useState(null)
  const [formEdit, setFormEdit] = useState({ descricao: '', valor: '', id_categoria: '', data: '' })

  const carregarDados = async () => {
    try {
      const idUsuario = localStorage.getItem('usuarioId')
      if (!idUsuario) return

      const resT = await fetch(`${API_URL}/listar-transacoes?id_usuario=${idUsuario}`)
      setTransacoes(await resT.json())
      
      const resC = await fetch(`${API_URL}/listar-categorias?id_usuario=${idUsuario}`)
      setCategorias(await resC.json())
    } catch (err) { 
      console.error("Erro ao carregar dados:", err) 
    }
  }

  useEffect(() => { carregarDados() }, [])

  // --- FUNÇÃO DE EXCLUIR COM POP-UP ---
  const deletarTransacao = async (id) => {
    const confirmou = window.confirm("⚠️ Você tem certeza que deseja excluir esta transação? Essa ação não pode ser desfeita.")
    
    if (confirmou) {
      try {
        const res = await fetch(`${API_URL}/deletar-transacao/${id}`, {
          method: 'DELETE',
        })
        
        if (res.ok) {
          carregarDados() 
          alert("Sucesso! Transação removida.")
        } else {
          alert("Erro ao tentar excluir no servidor.")
        }
      } catch (err) {
        console.error("Erro ao deletar:", err)
        alert("Houve um erro na conexão.")
      }
    }
  }

  // --- FUNÇÕES DE EXPORTAÇÃO ---
  const exportarPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')
      const doc = new jsPDF()
      
      const cinzaEscuro = [30, 41, 59], cinzaClaro = [148, 163, 184], indigo = [79, 70, 229]
      const esmeralda = [16, 185, 129], rose = [244, 63, 94], branco = [255, 255, 255]

      const formatarData = (data) => data ? new Date(data).toLocaleDateString('pt-BR') : '--/--';
      const formatarMoeda = (valor) => `R$ ${Math.abs(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

      doc.setFont('helvetica', 'bold').setFontSize(22).setTextColor(...cinzaEscuro).text("Financely", 14, 22);
      doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...cinzaClaro).text(`Relatório de Lançamentos`, 14, 30);

      const colunas = ["Descrição", "Tipo", "Categoria", "Data", "Valor"];
      const linhas = transacoesFiltradas.map(t => [
        t.descricao,
        parseFloat(t.valor) >= 0 ? 'Entrada' : 'Saída',
        t.nome_categoria,
        formatarData(t.data_transacao),
        formatarMoeda(t.valor)
      ])

      autoTable(doc, {
        startY: 45,
        head: [colunas],
        body: linhas,
        headStyles: { fillColor: indigo, textColor: branco },
        styles: { fontSize: 9 }
      })

      doc.save(`relatorio_financely.pdf`)
    } catch (error) { console.error("Erro PDF:", error) }
  }

  const exportarCSV = () => {
    const cabecalho = ["Descricao", "Categoria", "Data", "Valor (R$)", "Tipo\n"]
    const linhas = transacoesFiltradas.map(t => {
      const data = t.data_transacao ? new Date(t.data_transacao).toLocaleDateString('pt-BR') : '--/--'
      const valor = parseFloat(t.valor).toFixed(2).replace('.', ',')
      const tipo = parseFloat(t.valor) >= 0 ? 'Entrada' : 'Saida'
      return `${t.descricao};${t.nome_categoria};${data};${valor};${tipo}`
    })
    const blob = new Blob(["\ufeff" + (cabecalho + linhas.join('\n'))], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "relatorio_financely.csv"
    link.click()
  }

  // --- FUNÇÕES DE EDIÇÃO ---
  const iniciarEdicao = (t) => {
    setEditando(t.id_transacao)
    setFormEdit({ 
      descricao: t.descricao, 
      valor: t.valor, 
      id_categoria: t.id_categoria,
      data: t.data_transacao ? t.data_transacao.split('T')[0] : '' 
    })
  }

  const salvarEdicao = async (e) => {
    e.preventDefault()
    if (!window.confirm("Deseja salvar as alterações?")) return;

    const res = await fetch(`${API_URL}/editar-transacao/${editando}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formEdit)
    })
    if (res.ok) { 
      setEditando(null); 
      carregarDados();
      alert("Alterado com sucesso!");
    }
  }

  const transacoesFiltradas = transacoes.filter(t => {
    const buscaOK = t.descricao.toLowerCase().includes(filtroTexto.toLowerCase())
    const categoriaOK = filtroCategoria === '' || t.id_categoria === parseInt(filtroCategoria)
    return buscaOK && categoriaOK
  })

  return (
    <div className="space-y-8 text-black">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Relatórios</h2>
          <p className="text-slate-500 text-sm font-medium">Gerencie e exporte seu histórico financeiro.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportarCSV} className="px-5 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all text-sm">CSV</button>
          <button onClick={exportarPDF} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
            Gerar PDF
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px] space-y-2">
          <label className="text-xs font-bold text-slate-400 ml-1">Pesquisar</label>
          <input type="text" placeholder="Filtrar descrição..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 text-sm font-semibold" value={filtroTexto} onChange={e => setFiltroTexto(e.target.value)} />
        </div>
        <div className="w-48 space-y-2">
          <label className="text-xs font-bold text-slate-400 ml-1">Categoria</label>
          <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 text-sm font-semibold" value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
            <option value="">Todas</option>
            {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nome_categoria}</option>)}
          </select>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-6 text-xs font-bold text-slate-400">Descrição</th>
                <th className="p-6 text-xs font-bold text-slate-400 text-center">Tipo</th>
                <th className="p-6 text-xs font-bold text-slate-400 text-center">Categoria</th>
                <th className="p-6 text-xs font-bold text-slate-400 text-center">Data</th>
                <th className="p-6 text-xs font-bold text-slate-400 text-right">Valor</th>
                <th className="p-6 text-xs font-bold text-slate-400 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transacoesFiltradas.map((t) => (
                <tr key={t.id_transacao} className="hover:bg-slate-50/50 transition-all group">
                  <td className="p-6 font-semibold text-slate-800">{t.descricao}</td>
                  <td className="p-6 text-center text-xs font-medium text-slate-500">{parseFloat(t.valor) >= 0 ? 'Entrada' : 'Saída'}</td>
                  <td className="p-6 text-center"><span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-3 py-1 rounded-lg">{t.nome_categoria}</span></td>
                  <td className="p-6 text-center text-sm text-slate-500">{new Date(t.data_transacao).toLocaleDateString('pt-BR')}</td>
                  <td className={`p-6 text-right font-bold ${parseFloat(t.valor) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>R$ {Math.abs(parseFloat(t.valor)).toFixed(2)}</td>
                  <td className="p-6 text-center">
                    <div className="flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => iniciarEdicao(t)} className="text-indigo-600 font-bold text-xs hover:underline">Editar</button>
                      <button onClick={() => deletarTransacao(t.id_transacao)} className="text-red-500 font-bold text-xs hover:underline">Excluir</button>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl">
            <h3 className="text-xl font-bold mb-6 text-slate-800">Editar Lançamento</h3>
            <form onSubmit={salvarEdicao} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Descrição</label>
                <input type="text" className="w-full p-4 bg-slate-50 rounded-xl outline-none font-semibold border border-slate-100" value={formEdit.descricao} onChange={e => setFormEdit({...formEdit, descricao: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Valor (R$)</label>
                <input type="number" className="w-full p-4 bg-slate-50 rounded-xl outline-none font-semibold border border-slate-100" value={formEdit.valor} onChange={e => setFormEdit({...formEdit, valor: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditando(null)} className="flex-1 py-4 font-bold text-slate-400 hover:text-slate-600">Cancelar</button>
                <button type="submit" className="flex-1 py-4 font-bold bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}