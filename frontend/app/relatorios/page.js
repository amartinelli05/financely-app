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
  // Exibe um feedback visual de carregamento (Opcional, mas recomendado)
  // p.ex.: setCarregando(true);

  try {
    // 1. Cálculos de Resumo (Igual ao anterior, essencial para o relatório)
    const totais = transacoesFiltradas.reduce((acc, t) => {
      const valor = Math.abs(t.valor);
      if (t.tipo_movimento === 'Entrada') acc.entradas += valor;
      else acc.saidas += valor;
      return acc;
    }, { entradas: 0, saidas: 0 });
    
    const saldoFinal = totais.entradas - totais.saidas;

    // 2. Importação Dinâmica
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    
    // 3. PALETA DE CORES SINCRONIZADA COM O DASHBOARD (Ajustado)
    const colors = {
      // O azul principal do seu menu e botões
      primary: [84, 86, 230],     
      // O cinza claro do fundo do dashboard
      dashboardBg: [248, 250, 252], 
      // Cinza escuro para texto principal e ícones (lixeira/lápis)
      textMain: [100, 116, 139],    
      // Cinza médio para subtítulos e texto secundário
      textMuted: [148, 163, 184], 
      // Cores para os valores de Entrada/Saída (mantidas, pois são semânticas)
      success: [16, 185, 129],    // Verde
      danger: [239, 68, 68]       // Vermelho
    };

    // --- CABEÇALHO ---
    doc.setFont("helvetica", "bold").setFontSize(26).setTextColor(...colors.primary);
    doc.text("Financely", 14, 25);
    
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...colors.textMuted);
    doc.text(`RELATÓRIO DETALHADO DE LANÇAMENTOS`, 14, 34);
    doc.text(`Emitido em: ${new Date().toLocaleString('pt-BR')}`, 14, 39);

    // --- TABELA DE LANÇAMENTOS (Estilo "Clean") ---
    const colunas = ["Descrição", "Tipo", "Categoria", "Data", "Valor"];
    const linhas = transacoesFiltradas.map(t => [
      // Faz o texto da descrição ficar em caixa baixa com a primeira maiúscula,
      // para um visual mais elegante que tudo em maiúsculas
      t.descricao.charAt(0).toUpperCase() + t.descricao.slice(1).toLowerCase(),
      t.tipo_movimento,
      t.nome_categoria.toUpperCase(),
      new Date(t.data_transacao).toLocaleDateString('pt-BR'),
      `R$ ${Math.abs(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ]);

    autoTable(doc, {
      startY: 48,
      head: [colunas],
      body: linhas,
      theme: 'plain', // Estilo "clean", mais próximo da estética de cartões da interface
      headStyles: { 
        fillColor: [255, 255, 255], // Fundo branco no cabeçalho
        textColor: colors.primary, // Texto azul no cabeçalho
        fontSize: 10, 
        fontStyle: 'bold',
        halign: 'center' 
      },
      styles: { 
        fontSize: 9, 
        cellPadding: { top: 4, right: 3, bottom: 4, left: 3 }, // Espaçamento maior, como na interface
        textColor: colors.textMain // Texto cinza escuro para o corpo
      },
      // Linha separadora sutil abaixo de cada linha do corpo, imitando a lista
      didDrawCell: (data) => {
        if (data.section === 'body') {
          doc.setDrawColor(226, 232, 240); // Cinza muito claro para a linha
          doc.setLineWidth(0.1);
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        }
      },
      columnStyles: { 
        1: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'right', fontStyle: 'bold' } 
      },
      didParseCell: (data) => {
        // Cor condicional para o Tipo (Entrada/Saída)
        if (data.section === 'body' && data.column.index === 1) {
          data.cell.styles.textColor = data.cell.raw === 'Entrada' ? colors.success : colors.danger;
        }
        // Aplica o cinza escuro do dashboard ao texto da descrição e categoria
        if (data.section === 'body' && (data.column.index === 0 || data.column.index === 2)) {
          data.cell.styles.textColor = colors.textMain;
        }
      }
    });

    // --- RODAPÉ DE RESUMO (Estilo "Card") ---
    const finalY = doc.lastAutoTable.finalY + 15;
    const pageWidth = doc.internal.pageSize.getWidth();

    // Box de Resumo (Simulando um card com fundo claro)
    doc.setFillColor(...colors.dashboardBg).rect(14, finalY, pageWidth - 28, 25, 'F');
    doc.setDrawColor(226, 232, 240).rect(14, finalY, pageWidth - 28, 25, 'D'); // Borda sutil
    
    doc.setFontSize(11).setTextColor(...colors.primary).setFont("helvetica", "bold");
    doc.text("Resumo do Período", 18, finalY + 9);

    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...colors.textMain);
    doc.text(`Total Entradas: R$ ${totais.entradas.toLocaleString('pt-BR')}`, 18, finalY + 17);
    doc.text(`Total Saídas: R$ ${totais.saidas.toLocaleString('pt-BR')}`, 80, finalY + 17);
    
    // Saldo com cor condicional
    const corSaldo = saldoFinal >= 0 ? colors.success : colors.danger;
    doc.setTextColor(...corSaldo).setFont("helvetica", "bold");
    doc.text(`SALDO FINAL: R$ ${saldoFinal.toLocaleString('pt-BR')}`, 145, finalY + 17);

    // --- NUMERAÇÃO DE PÁGINAS ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      // Rodapé da página, fora do card de resumo
      doc.setFontSize(8).setTextColor(...colors.textMuted);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 30, 285);
      doc.text("financely.com.br", 14, 285); // Uma pequena marca d'água no rodapé
    }

    doc.save(`Financely_Relatorio_${Date.now()}.pdf`);
  } catch (error) {
    console.error(error);
    alert("Não foi possível gerar o PDF. Verifique os dados.");
  } finally {
    // Finaliza o feedback visual de carregamento
    // p.ex.: setCarregando(false);
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