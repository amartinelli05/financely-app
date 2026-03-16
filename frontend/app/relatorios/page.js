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

const exportarPDF = async () => {
  try {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    
    // Configurações de Design
    const colors = {
      primary: [99, 102, 241],   // Indigo Moderno
      success: [34, 197, 94],    // Verde Esmeralda
      danger: [239, 68, 68],     // Vermelho Soft
      slate800: [30, 41, 59],    // Texto Principal
      slate500: [100, 116, 139], // Texto Secundário
      slate100: [241, 245, 249], // Fundos/Linhas
    };

    // 1. HEADER MINIMALISTA
    doc.setFillColor(...colors.primary).rect(14, 10, 2, 12, 'F'); // Detalhe vertical lateral
    doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(...colors.slate800);
    doc.text("Financely", 20, 19);
    
    doc.setFontSize(8).setTextColor(...colors.slate500).setFont("helvetica", "normal");
    doc.text("RELATÓRIO DE PERFORMANCE", 20, 24);
    doc.text(`${new Date().toLocaleDateString('pt-BR')} • ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`, 196, 19, { align: 'right' });

    // 2. TABELA COM ESTILO "INTERFACE"
    autoTable(doc, {
      startY: 40,
      head: [["DESCRIÇÃO", "CATEGORIA", "DATA", "VALOR"]],
      body: transacoesFiltradas.map(t => [
        t.descricao,
        t.nome_categoria.toUpperCase(),
        new Date(t.data_transacao).toLocaleDateString('pt-BR'),
        `${t.tipo_movimento === 'Entrada' ? '+ ' : '- '} R$ ${Math.abs(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ]),
      theme: 'plain',
      headStyles: { 
        fillColor: [255, 255, 255], 
        textColor: colors.slate500, 
        fontSize: 7, 
        fontStyle: 'bold',
        cellPadding: { bottom: 4 } 
      },
      styles: { 
        fontSize: 9, 
        cellPadding: 6, 
        textColor: colors.slate800,
        lineWidth: 0,
      },
      columnStyles: {
        1: { cellWidth: 40 },
        3: { halign: 'right', fontStyle: 'bold' }
      },
      // Efeito de Linha Minimalista
      didDrawCell: (data) => {
        if (data.section === 'body') {
          doc.setDrawColor(...colors.slate100).setLineWidth(0.2);
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          const isEntrada = data.cell.raw.includes('+');
          data.cell.styles.textColor = isEntrada ? colors.success : colors.danger;
        }
        // Badge style para Categoria
        if (data.section === 'body' && data.column.index === 1) {
          data.cell.styles.fontSize = 7;
          data.cell.styles.textColor = colors.slate500;
        }
      }
    });

    // 3. CARD DE RESUMO FLUTUANTE (Design Moderno)
    const finalY = doc.lastAutoTable.finalY + 15;
    const cardWidth = 182;
    
    // Sombra/Fundo do Card
    doc.setFillColor(250, 251, 253).roundedRect(14, finalY, cardWidth, 35, 3, 3, 'F');
    
    // Cálculos
    const entradas = transacoesFiltradas.filter(t => t.tipo_movimento === 'Entrada').reduce((a, b) => a + Math.abs(b.valor), 0);
    const saidas = transacoesFiltradas.filter(t => t.tipo_movimento === 'Saída').reduce((a, b) => a + Math.abs(b.valor), 0);
    const total = entradas - saidas;

    // Conteúdo do Card
    const drawStat = (label, value, x, color) => {
      doc.setFontSize(8).setTextColor(...colors.slate500).setFont("helvetica", "normal").text(label, x, finalY + 12);
      doc.setFontSize(12).setTextColor(...color).setFont("helvetica", "bold").text(value, x, finalY + 22);
    };

    drawStat("ENTRADAS", `R$ ${entradas.toLocaleString('pt-BR')}`, 25, colors.success);
    drawStat("SAÍDAS", `R$ ${saidas.toLocaleString('pt-BR')}`, 85, colors.danger);
    drawStat("SALDO LÍQUIDO", `R$ ${total.toLocaleString('pt-BR')}`, 145, total >= 0 ? colors.primary : colors.danger);

    // Rodapé final
    doc.setFontSize(7).setTextColor(...colors.slate500).text("Relatório gerado automaticamente pela plataforma Financely. Todos os direitos reservados.", 105, 285, { align: 'center' });

    doc.save(`Financely_Export.pdf`);
  } catch (error) { 
    console.error(error);
    alert("Erro ao gerar design moderno");
  }
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
                <td className="p-8">
  <div className="flex justify-center gap-4 transition-all">
    {/* ÍCONE DE LÁPIS (EDITAR) */}
    <button 
      onClick={() => iniciarEdicao(t)} 
      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
      </svg>
    </button>

    {/* ÍCONE DE LIXEIRA (EXCLUIR) */}
    <button 
      onClick={() => deletarTransacao(t.id_transacao)} 
      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>
      </svg>
    </button>
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