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
    // Importações dinâmicas com verificação
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    
    // Validação de dados
    if (!transacoesFiltradas || transacoesFiltradas.length === 0) {
      alert('Não há transações para gerar o relatório.');
      return;
    }

    const doc = new jsPDF();
    
    // Configurações de Design (Centralizadas)
    const config = {
      colors: {
        primary: [99, 102, 241],   // Indigo Moderno
        success: [34, 197, 94],    // Verde Esmeralda
        danger: [239, 68, 68],     // Vermelho Soft
        warning: [245, 158, 11],   // Laranja para alertas
        slate800: [30, 41, 59],    // Texto Principal
        slate600: [71, 85, 105],   // Texto Médio
        slate500: [100, 116, 139], // Texto Secundário
        slate300: [203, 213, 225], // Bordas
        slate100: [241, 245, 249], // Fundos/Linhas
        white: [255, 255, 255],
      },
      margins: {
        left: 14,
        right: 14,
        top: 10,
        bottom: 20,
      },
      pageWidth: 210, // Largura A4 em mm
    };

    // ========== FUNÇÕES AUXILIARES ==========
    const formatCurrency = (value, showSign = true) => {
      const formatted = Math.abs(value).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return showSign ? `R$ ${formatted}` : formatted;
    };

    const formatDate = (dateString) => {
      try {
        return new Date(dateString).toLocaleDateString('pt-BR');
      } catch {
        return dateString;
      }
    };

    const calculateTotals = (transacoes) => {
      return transacoes.reduce(
        (acc, t) => {
          const valor = Math.abs(t.valor || 0);
          if (t.tipo_movimento === 'Entrada') {
            acc.entradas += valor;
          } else if (t.tipo_movimento === 'Saída') {
            acc.saidas += valor;
          }
          return acc;
        },
        { entradas: 0, saidas: 0 }
      );
    };

    const drawHeader = (doc) => {
      // Detalhe vertical lateral
      doc.setFillColor(...config.colors.primary)
         .rect(config.margins.left, config.margins.top, 2, 12, 'F');
      
      // Título principal
      doc.setFont("helvetica", "bold")
         .setFontSize(18)
         .setTextColor(...config.colors.slate800)
         .text("Financely", config.margins.left + 6, 19);
      
      // Subtítulo
      doc.setFontSize(8)
         .setTextColor(...config.colors.slate600)
         .setFont("helvetica", "normal")
         .text("RELATÓRIO DE PERFORMANCE", config.margins.left + 6, 24);
      
      // Data e hora
      const now = new Date();
      const dateTimeStr = `${now.toLocaleDateString('pt-BR')} • ${now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })}`;
      
      doc.text(dateTimeStr, config.pageWidth - config.margins.right, 19, { align: 'right' });
    };

    const drawPeriod = (doc) => {
      if (!dataInicial || !dataFinal) return;
      
      doc.setFontSize(8)
         .setTextColor(...config.colors.slate500)
         .setFont("helvetica", "italic")
         .text(
           `Período: ${formatDate(dataInicial)} a ${formatDate(dataFinal)}`,
           config.margins.left,
           32
         );
    };

    const drawTable = (doc) => {
      const totals = calculateTotals(transacoesFiltradas);
      
      autoTable(doc, {
        startY: 40,
        head: [["DESCRIÇÃO", "CATEGORIA", "DATA", "VALOR (R$)"]],
        body: transacoesFiltradas.map(t => [
          t.descricao || '-',
          (t.nome_categoria || 'Outros').toUpperCase(),
          formatDate(t.data_transacao),
          `${t.tipo_movimento === 'Entrada' ? '+ ' : '- '} ${formatCurrency(Math.abs(t.valor), false)}`,
          t.id // ID oculto para referência
        ]),
        theme: 'plain',
        headStyles: { 
          fillColor: config.colors.white,
          textColor: config.colors.slate600,
          fontSize: 7,
          fontStyle: 'bold',
          cellPadding: { bottom: 4, top: 4, left: 6, right: 6 },
          halign: 'left',
        },
        styles: { 
          fontSize: 8.5,
          cellPadding: 6,
          textColor: config.colors.slate800,
          lineWidth: 0,
          font: 'helvetica',
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 35, fontStyle: 'bold' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
        },
        // Linhas separadoras minimalistas
        didDrawCell: (data) => {
          if (data.section === 'body' && data.row.index < transacoesFiltradas.length - 1) {
            doc.setDrawColor(...config.colors.slate300)
               .setLineWidth(0.3)
               .line(
                 data.cell.x,
                 data.cell.y + data.cell.height,
                 data.cell.x + data.cell.width,
                 data.cell.y + data.cell.height
               );
          }
        },
        // Estilização condicional
        didParseCell: (data) => {
          if (data.section === 'body') {
            // Cor do valor (entrada/saída)
            if (data.column.index === 3) {
              const isEntrada = data.cell.raw.includes('+');
              data.cell.styles.textColor = isEntrada ? config.colors.success : config.colors.danger;
            }
            
            // Estilo da categoria (tags)
            if (data.column.index === 1) {
              data.cell.styles.fontSize = 7;
              data.cell.styles.textColor = config.colors.slate600;
            }
          }
        },
        // Cabeçalho fixo
        didDrawPage: (data) => {
          // Adiciona cabeçalho em novas páginas
          if (data.pageCount > 1) {
            doc.setFontSize(7)
               .setTextColor(...config.colors.slate500)
               .text(
                 `Continuação... Página ${data.pageCount}`,
                 config.margins.left,
                 config.margins.top + 5
               );
          }
        },
      });
    };

    const drawSummaryCard = (doc, startY) => {
      const cardWidth = config.pageWidth - (config.margins.left * 2);
      const totals = calculateTotals(transacoesFiltradas);
      const saldo = totals.entradas - totals.saidas;
      const totalTransacoes = transacoesFiltradas.length;
      
      // Fundo do card com sombra
      doc.setFillColor(248, 250, 252)
         .roundedRect(config.margins.left, startY, cardWidth, 45, 4, 4, 'F');
      
      // Borda superior colorida
      doc.setFillColor(...config.colors.primary)
         .roundedRect(config.margins.left, startY, cardWidth, 3, 2, 2, 'F');
      
      // Título do card
      doc.setFontSize(9)
         .setFont("helvetica", "bold")
         .setTextColor(...config.colors.slate700)
         .text("RESUMO FINANCEIRO", config.margins.left + 10, startY + 12);
      
      // Estatísticas
      const stats = [
        { label: "TRANSAÇÕES", value: totalTransacoes, color: config.colors.slate600, x: 25, format: (v) => v },
        { label: "ENTRADAS", value: totals.entradas, color: config.colors.success, x: 70, format: (v) => formatCurrency(v) },
        { label: "SAÍDAS", value: totals.saidas, color: config.colors.danger, x: 115, format: (v) => formatCurrency(v) },
        { label: "SALDO", value: saldo, color: saldo >= 0 ? config.colors.primary : config.colors.danger, x: 160, format: (v) => formatCurrency(v) },
      ];
      
      stats.forEach(stat => {
        doc.setFontSize(7)
           .setFont("helvetica", "normal")
           .setTextColor(...config.colors.slate500)
           .text(stat.label, stat.x, startY + 25);
        
        doc.setFontSize(11)
           .setFont("helvetica", "bold")
           .setTextColor(...stat.color)
           .text(stat.format(stat.value), stat.x, startY + 35);
      });
    };

    const drawFooter = (doc) => {
      const pageCount = doc.internal.getNumberOfPages();
      
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Linha separadora
        doc.setDrawColor(...config.colors.slate300)
           .setLineWidth(0.5)
           .line(config.margins.left, 280, config.pageWidth - config.margins.right, 280);
        
        // Texto do rodapé
        doc.setFontSize(7)
           .setFont("helvetica", "normal")
           .setTextColor(...config.colors.slate500)
           .text(
             "Relatório gerado automaticamente pela plataforma Financely",
             config.pageWidth / 2,
             285,
             { align: 'center' }
           );
        
        // Número da página
        doc.text(
          `Página ${i} de ${pageCount}`,
          config.pageWidth - config.margins.right,
          285,
          { align: 'right' }
        );
      }
    };

    // ========== EXECUÇÃO PRINCIPAL ==========
    
    // 1. Cabeçalho
    drawHeader(doc);
    
    // 2. Período (se aplicável)
    drawPeriod(doc);
    
    // 3. Tabela de transações
    drawTable(doc);
    
    // 4. Card de resumo
    const finalY = doc.lastAutoTable.finalY + 15;
    drawSummaryCard(doc, finalY);
    
    // 5. Rodapé com numeração de páginas
    drawFooter(doc);
    
    // 6. Salvar PDF com nome personalizado
    const fileName = `Financely_${new Date().toISOString().slice(0, 10)}_${transacoesFiltradas.length}transacoes.pdf`;
    doc.save(fileName);
    
  } catch (error) { 
    console.error('Erro ao gerar PDF:', error);
    
    // Mensagem de erro mais amigável
    let errorMessage = "Erro ao gerar relatório. ";
    if (error.message?.includes('jspdf')) {
      errorMessage += "Problema ao carregar bibliotecas necessárias.";
    } else {
      errorMessage += "Tente novamente ou contate o suporte.";
    }
    
    alert(errorMessage);
  }
};
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