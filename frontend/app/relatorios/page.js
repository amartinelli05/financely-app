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

  // FUNÇÃO DO PDF (Corrigida e no lugar certo)
  const exportarPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF()
      
      // CONFIGURAÇÕES GERAIS DE DESIGN
      const cinzaEscuro = [30, 41, 59]   // Slate-800
      const cinzaClaro = [148, 163, 184] // Slate-400
      const indigo = [79, 70, 229]      // Indigo-600
      const esmeralda = [16, 185, 129]   // Emerald-500
      const rose = [244, 63, 94]        // Rose-500
      const branco = [255, 255, 255]

      const formatarData = (data) => data ? new Date(data).toLocaleDateString('pt-BR') : '--/--';
      const formatarMoeda = (valor) => 
        `R$ ${Math.abs(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

      // --- CABEÇALHO ELEGANTE ---
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(...cinzaEscuro);
      doc.text("Financely", 14, 22);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...cinzaClaro);
      doc.text("Relatório Detalhado de Lançamentos", 14, 30);
      
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(...cinzaClaro);
      doc.text(`Gerado em: ${formatarData(new Date())} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 38);

      // --- CÁLCULOS ---
      const entradas = transacoesFiltradas
        .filter(t => parseFloat(t.valor) > 0)
        .reduce((acc, t) => acc + parseFloat(t.valor), 0);
      
      const saidas = transacoesFiltradas
        .filter(t => parseFloat(t.valor) < 0)
        .reduce((acc, t) => acc + parseFloat(t.valor), 0);

      const liquido = entradas + saidas;

      // --- TABELA MINIMALISTA ---
      const colunas = ["Descrição", "Tipo", "Categoria", "Data", "Valor"];
      const linhas = transacoesFiltradas.map(t => [
        { content: t.descricao, styles: { fontStyle: 'bold', textColor: cinzaEscuro } },
        { content: parseFloat(t.valor) >= 0 ? 'Entrada' : 'Saída', styles: { textColor: parseFloat(t.valor) >= 0 ? esmeralda : rose, fontStyle: 'bold' } },
        t.nome_categoria,
        { content: formatarData(t.data), styles: { textColor: cinzaClaro } },
        { content: formatarMoeda(t.valor), styles: { fontStyle: 'bold', halign: 'right', textColor: cinzaEscuro } }
      ])

      autoTable(doc, {
        startY: 45,
        head: [colunas],
        body: linhas,
        theme: 'plain', // Mais limpo, sem faixas cinzas nas linhas
        headStyles: { 
          fillColor: indigo, 
          textColor: branco,
          fontStyle: 'bold', 
          fontSize: 10,
          cellPadding: 4,
          halign: 'center'
        },
        styles: { 
          fontSize: 9, 
          cellPadding: 4, 
          lineColor: [226, 232, 240], // Borda suave entre as linhas
          lineWidth: 0.1, 
          textColor: [71, 85, 105] 
        },
        columnStyles: { 
          1: { halign: 'center' }, // Tipo
          2: { halign: 'center' }, // Categoria
          3: { halign: 'center' }  // Data
        }
      })

      // --- RESUMO FINAL PREMIUM ---
      let finalY = doc.lastAutoTable.finalY + 15;

      // Card de Resumo (Bloco Cinza)
      doc.setFillColor(248, 250, 252); // Fundo Slate-50
      doc.roundedRect(120, finalY - 5, 80, 45, 10, 10, 'F'); // Retângulo arredondado

      doc.setFontSize(11);
      doc.setTextColor(...cinzaEscuro);
      doc.setFont('helvetica', 'bold');
      doc.text("Resumo Financeiro:", 125, finalY);

      // Linhas de Resumo
      const desenharLinhaResumo = (doc, texto, valor, cor, y, size = 10, negrito = false) => {
        doc.setFontSize(size);
        doc.setFont('helvetica', negrito ? 'bold' : 'normal');
        doc.setTextColor(...cinzaEscuro);
        doc.text(texto, 125, y);
        doc.setTextColor(...cor);
        doc.text(valor, 195, y, { align: 'right' });
      }

      finalY += 10;
      desenharLinhaResumo(doc, "(+) Entradas", formatarMoeda(entradas), esmeralda, finalY);
      
      finalY += 8;
      desenharLinhaResumo(doc, "(-) Saídas", formatarMoeda(saidas), rose, finalY);
      
      // Linha separadora suave
      doc.setDrawColor(226, 232, 240);
      doc.line(125, finalY + 5, 195, finalY + 5);

      finalY += 13;
      // Saldo Líquido com fundo colorido e bordas arredondadas
      doc.setFillColor(...indigo); 
      doc.roundedRect(120, finalY - 7, 80, 12, 6, 6, 'F'); 

      desenharLinhaResumo(doc, "SALDO LÍQUIDO", formatarMoeda(liquido), branco, finalY + 1, 12, true);

      doc.save(`relatorio_financely_premium.pdf`)
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
    }
  }

  const exportarCSV = () => {
    const cabecalho = ["Descricao", "Categoria", "Data", "Valor (R$)", "Tipo\n"]
    const linhas = transacoesFiltradas.map(t => {
      const data = t.data ? new Date(t.data).toLocaleDateString('pt-BR') : '--/--'
      const valor = parseFloat(t.valor).toFixed(2).replace('.', ',')
      const tipo = parseFloat(t.valor) >= 0 ? 'Entrada' : 'Saida'
      return `${t.descricao};${t.nome_categoria};${data};${valor};${tipo}`
    })
    const conteudoCSV = cabecalho + linhas.join('\n')
    const blob = new Blob(["\ufeff" + conteudoCSV], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "relatorio_financely.csv")
    link.click()
  }

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
    if (res.ok) { setEditando(null); carregarDados() }
  }

  const transacoesFiltradas = transacoes.filter(t => {
    const buscaOK = t.descricao.toLowerCase().includes(filtroTexto.toLowerCase())
    const categoriaOK = filtroCategoria === '' || t.id_categoria === parseInt(filtroCategoria)
    return buscaOK && categoriaOK
  })

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Relatórios</h2>
          <p className="text-slate-400 text-sm font-medium">Gerencie e exporte seu histórico.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportarCSV} className="px-5 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all text-sm">CSV</button>
          <button onClick={exportarPDF} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all hover:scale-105">
            Gerar PDF
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px] space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pesquisar</label>
          <input type="text" placeholder="Filtrar descrição..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 text-sm font-semibold transition-all" value={filtroTexto} onChange={e => setFiltroTexto(e.target.value)} />
        </div>
        <div className="w-48 space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
          <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 text-sm font-semibold appearance-none" value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
            <option value="">Todas</option>
            {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nome_categoria}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
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
                  <td className="p-6 font-bold text-slate-800">{t.descricao}</td>
                  <td className="p-6 text-center text-[10px] font-bold text-slate-400 uppercase">{parseFloat(t.valor) >= 0 ? 'Entrada' : 'Saída'}</td>
                  <td className="p-6 text-center"><span className="bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1 rounded-lg uppercase">{t.nome_categoria}</span></td>
                  <td className="p-6 text-center text-sm font-bold text-slate-400">{t.data ? new Date(t.data).toLocaleDateString('pt-BR') : '--/--'}</td>
                  <td className="p-6 text-right font-black text-slate-900">R$ {Math.abs(parseFloat(t.valor)).toFixed(2)}</td>
                  <td className="p-6 text-center">
                    <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => iniciarEdicao(t)} className="p-2 text-slate-300 hover:text-indigo-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button onClick={() => deletar(t.id_transacao)} className="p-2 text-slate-300 hover:text-red-500">
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

      {editando && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl">
            <h3 className="text-2xl font-bold mb-8 text-slate-800">Editar Lançamento</h3>
            <form onSubmit={salvarEdicao} className="space-y-5">
              <input type="text" className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold" value={formEdit.descricao} onChange={e => setFormEdit({...formEdit, descricao: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" step="0.01" className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold" value={formEdit.valor} onChange={e => setFormEdit({...formEdit, valor: e.target.value})} />
                <select className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold" value={formEdit.id_categoria} onChange={e => setFormEdit({...formEdit, id_categoria: e.target.value})}>
                  {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nome_categoria}</option>)}
                </select>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setEditando(null)} className="flex-1 font-bold text-slate-400">Cancelar</button>
                <button type="submit" className="flex-1 py-4 font-bold bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}