'use client'
import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function Relatorios() {
  const [transacoes, setTransacoes] = useState([])
  const [categorias, setCategorias] = useState([])
  const [contas, setContas] = useState([])
  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroConta, setFiltroConta] = useState('')
  const [dataInicio, setDataInicio] = useState('')
const [dataFim, setDataFim] = useState('')
  const [editando, setEditando] = useState(null)
  const [isClient, setIsClient] = useState(false) 

  const [formEdit, setFormEdit] = useState({ 
  descricao: '', 
  valor: '', 
  id_categoria: '', 
  id_conta: '', // <--- Adicionamos esse campo aqui
  data_transacao: '', 
  tipo_movimento: '' 
})

  useEffect(() => { setIsClient(true) }, [])

  const carregarDados = async () => {
    try {
      const idUsuario = localStorage.getItem('usuarioId')
      if (!idUsuario) return

      const [resT, resC, resContas] = await Promise.all([
        fetch(`${API_URL}/listar-transacoes?id_usuario=${idUsuario}`),
        fetch(`${API_URL}/listar-categorias?id_usuario=${idUsuario}`),
        fetch(`${API_URL}/listar-contas?id_usuario=${idUsuario}`)
      ])

      const [dadosT, dadosC, dadosContas] = await Promise.all([
        resT.json(), resC.json(), resContas.json()
      ])

      setTransacoes(Array.isArray(dadosT) ? dadosT : [])
      setCategorias(Array.isArray(dadosC) ? dadosC : [])
      setContas(Array.isArray(dadosContas) ? dadosContas : [])
    } catch (err) { console.error("Erro ao carregar dados:", err) }
  }

  useEffect(() => { carregarDados() }, [])

const transacoesFiltradas = transacoes.filter(t => {
  const matchesTexto = t.descricao.toLowerCase().includes(filtroTexto.toLowerCase())
  const matchesCategoria = filtroCategoria === '' || String(t.id_categoria) === String(filtroCategoria)
  const matchesConta = filtroConta === '' || String(t.id_conta) === String(filtroConta)
  
  // Lógica de filtro por data
  const dataTransacao = t.data_transacao.split('T')[0] // Pega apenas YYYY-MM-DD
  const matchesDataInicio = dataInicio === '' || dataTransacao >= dataInicio
  const matchesDataFim = dataFim === '' || dataTransacao <= dataFim

  return matchesTexto && matchesCategoria && matchesConta && matchesDataInicio && matchesDataFim
})

  const entradas = transacoesFiltradas.filter(t => t.valor >= 0).reduce((acc, t) => acc + parseFloat(t.valor), 0);
  const saidas = transacoesFiltradas.filter(t => t.valor < 0).reduce((acc, t) => acc + Math.abs(t.valor), 0);
  const saldoLiquido = entradas - saidas;

  // --- FUNÇÕES DE EXPORTAÇÃO ---
  const exportarPDF = async () => {
  try {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    
    if (!transacoesFiltradas || transacoesFiltradas.length === 0) {
      alert('Não há transações para gerar o relatório.');
      return;
    }

    const doc = new jsPDF();
    const nomeUsuario = localStorage.getItem('usuarioNome') || 'Usuário';

    // Definição de Cores (Arrays RGB puros para evitar o erro f3)
    const cIndigo = [99, 102, 241];
    const cEmerald = [16, 185, 129];
    const cRose = [244, 63, 94];
    const cSlate800 = [30, 41, 59];
    const cSlate500 = [100, 116, 139];
    const cSlate100 = [248, 250, 252];

    const formatCurrency = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const formatDate = (d) => new Date(d).toLocaleDateString('pt-BR');

    // 1. Cabeçalho Minimalista
    doc.setFillColor(...cIndigo).rect(14, 15, 2, 12, 'F');
    doc.setFont("helvetica", "bold").setFontSize(22).setTextColor(...cSlate800).text("Financely", 20, 24);
    doc.setFontSize(8).setTextColor(...cSlate500).setFont("helvetica", "normal")
       .text(`RELATÓRIO DE MOVIMENTAÇÕES • ${nomeUsuario.toUpperCase()}`, 20, 29);
    
    doc.setFontSize(8).text(`${formatDate(new Date())}`, 196, 24, { align: 'right' });

    // 2. Tabela com 5 Colunas Separadas
    autoTable(doc, {
      startY: 40,
      head: [["DESCRIÇÃO", "CATEGORIA", "CONTA", "DATA", "VALOR (R$)"]],
      body: transacoesFiltradas.map(t => [
        t.descricao,
        (t.nome_categoria || 'Geral').toUpperCase(),
        (t.nome_conta || 'N/A').toUpperCase(),
        formatDate(t.data_transacao),
        `${parseFloat(t.valor) >= 0 ? '+ ' : '- '} ${formatCurrency(Math.abs(t.valor))}`
      ]),
      theme: 'plain',
      headStyles: { textColor: cSlate500, fontSize: 7, fontStyle: 'bold', cellPadding: 4 },
      styles: { fontSize: 8, cellPadding: 5, textColor: cSlate800, valign: 'middle' },
      columnStyles: { 
        3: { halign: 'center' }, 
        4: { halign: 'right', fontStyle: 'bold' } 
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          data.cell.styles.textColor = data.cell.raw.includes('+') ? cEmerald : cRose;
        }
      },
      didDrawCell: (data) => {
        if (data.section === 'body') {
          doc.setDrawColor(241, 245, 249).setLineWidth(0.1).line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
        }
      }
    });

    // 3. Card de Resumo (Onde estava o erro)
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFillColor(...cSlate100).roundedRect(14, finalY, 182, 30, 4, 4, 'F');
    
    doc.setFontSize(7).setFont("helvetica", "bold").setTextColor(...cSlate500).text("RESUMO DO PERÍODO", 22, finalY + 10);

    // Entradas
    doc.setFontSize(7).setTextColor(...cSlate500).text("ENTRADAS", 22, finalY + 18);
    doc.setFontSize(10).setTextColor(...cEmerald).text(`R$ ${formatCurrency(entradas)}`, 22, finalY + 25);

    // Saídas
    doc.setFontSize(7).setTextColor(...cSlate500).text("SAÍDAS", 80, finalY + 18);
    doc.setFontSize(10).setTextColor(...cRose).text(`R$ ${formatCurrency(saidas)}`, 80, finalY + 25);

    // Saldo (Fix da cor dinâmica)
    const corSaldo = saldoLiquido >= 0 ? cIndigo : cRose;
    doc.setFontSize(7).setTextColor(...cSlate500).text("SALDO LÍQUIDO", 140, finalY + 18);
    doc.setFontSize(10).setTextColor(...corSaldo).text(`R$ ${formatCurrency(saldoLiquido)}`, 140, finalY + 25);

    doc.save(`Financely_Relatorio_${new Date().toISOString().slice(0,10)}.pdf`);
  } catch (error) { 
    console.error('Erro PDF:', error);
    alert("Erro ao gerar relatório.");
  }
};

  const exportarCSV = () => {
    const cabecalho = "Descricao;Categoria;Conta;Data;Valor;Tipo\n";
    const linhas = transacoesFiltradas.map(t => 
      `${t.descricao};${t.nome_categoria};${t.nome_conta};${new Date(t.data_transacao).toLocaleDateString()};${t.valor};${t.tipo_movimento}`
    ).join('\n');
    const blob = new Blob(["\ufeff" + cabecalho + linhas], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "relatorio_financely.csv";
    link.click();
  }

const deletarTransacao = async (id) => {
  if (window.confirm("⚠️ Deseja excluir esta transação?")) {
    try {
      const res = await fetch(`${API_URL}/deletar-transacao/${id}`, { 
        method: 'DELETE' 
      });

      if (res.ok) {
        // ESSENCIAL: Chame a função que carrega os dados novamente
        // para o item sumir da tela na hora
        carregarDados(); 
      } else {
        const errorData = await res.json();
        alert(`Erro: ${errorData.erro || "Não foi possível excluir."}`);
      }
    } catch (err) { 
      console.error(err);
      alert("Erro ao conectar com o servidor.");
    }
  }
};

  const iniciarEdicao = (t) => {
    setEditando(t.id_transacao)
    setFormEdit({ 
      descricao: t.descricao, valor: Math.abs(t.valor), id_categoria: t.id_categoria,
      data_transacao: t.data_transacao ? t.data_transacao.split('T')[0] : '',
      tipo_movimento: t.tipo_movimento 
    })
  }

  const salvarEdicao = async (e) => {
    e.preventDefault()
    try {
        const res = await fetch(`${API_URL}/editar-transacao/${editando}`, {        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formEdit)
      })
      if (res.ok) { setEditando(null); carregarDados(); }
    } catch (err) { alert("Erro ao editar.") }
  }

  return (
    <div className="space-y-8 text-black pb-20">
      {/* CABEÇALHO COM BOTÕES DE EXPORTAÇÃO */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Relatórios</h2>
          <p className="text-slate-500 font-medium">Controle detalhado das movimentações.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportarCSV} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all">CSV</button>
          <button onClick={exportarPDF} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 shadow-lg shadow-indigo-100">PDF</button>
        </div>
      </div>

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-xs font-bold uppercase">Entradas</p>
          <h3 className="text-2xl font-black text-emerald-500">R$ {entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-xs font-bold uppercase">Saídas</p>
          <h3 className="text-2xl font-black text-rose-500">R$ {saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-xs font-bold uppercase">Saldo Líquido</p>
          <h3 className={`text-2xl font-black ${saldoLiquido >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
            R$ {saldoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
        </div>
      </div>

     {/* SEÇÃO DE FILTROS UNIFICADA */}
<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 text-black">
  
  {/* 1. Busca por texto */}
  <div className="flex flex-col">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1">Descrição</label>
    <input 
      type="text"
      placeholder="Filtrar descrição..." 
      className="p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm"
      value={filtroTexto} 
      onChange={e => setFiltroTexto(e.target.value)} 
    />
  </div>

  {/* 2. Filtro de Categoria */}
  <div className="flex flex-col">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1">Categoria</label>
    <select 
      className="p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm appearance-none" 
      value={filtroCategoria} 
      onChange={e => setFiltroCategoria(e.target.value)}
    >
      <option value="">Todas as Categorias</option>
      {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nome_categoria}</option>)}
    </select>
  </div>

  {/* 3. Filtro de Conta */}
  <div className="flex flex-col">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1">Conta</label>
    <select 
      className="p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm appearance-none" 
      value={filtroConta} 
      onChange={e => setFiltroConta(e.target.value)}
    >
      <option value="">Todas as Contas</option>
      {contas.map(conta => <option key={conta.id_conta} value={conta.id_conta}>{conta.nome_conta}</option>)}
    </select>
  </div>

  {/* 4. Filtro Data Início */}
  <div className="flex flex-col">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1">Início</label>
    <input 
      type="date" 
      className="p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm text-slate-600"
      value={dataInicio} 
      onChange={e => setDataInicio(e.target.value)}
    />
  </div>

  {/* 5. Filtro Data Fim */}
  <div className="flex flex-col relative">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 flex justify-between">
      Fim
      {(dataInicio || dataFim) && (
        <button 
          onClick={() => { setDataInicio(''); setDataFim(''); }}
          className="text-[9px] text-rose-500 hover:underline"
        >
          Limpar
        </button>
      )}
    </label>
    <input 
      type="date" 
      className="p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm text-slate-600"
      value={dataFim} 
      onChange={e => setDataFim(e.target.value)}
    />
  </div>
</div>

      {/* TABELA COM 6 COLUNAS */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Descrição</th>
              <th className="p-6 text-xs font-bold text-slate-400 uppercase text-center">Categoria</th>
              <th className="p-6 text-xs font-bold text-slate-400 uppercase text-center">Conta</th>
              <th className="p-6 text-xs font-bold text-slate-400 uppercase text-center">Data</th>
              <th className="p-6 text-xs font-bold text-slate-400 uppercase text-right">Valor</th>
              <th className="p-6 text-xs font-bold text-slate-400 uppercase text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {transacoesFiltradas.map((t) => (
              <tr key={t.id_transacao} className="group hover:bg-slate-50/80 transition-all">
                <td className="p-6 font-bold text-slate-700">{t.descricao}</td>
                <td className="p-6 text-center">
                  <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full uppercase">{t.nome_categoria || 'Geral'}</span>
                </td>
                <td className="p-6 text-center">
                  <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase">{t.nome_conta || 'Sem Conta'}</span>
                </td>
                <td className="p-6 text-center text-xs text-slate-400">
                  {isClient && new Date(t.data_transacao).toLocaleDateString('pt-BR')}
                </td>
                <td className={`p-6 text-right font-black ${t.valor >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {t.valor >= 0 ? '+' : '-'} R$ {Math.abs(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-6 text-center">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => iniciarEdicao(t)} className="p-2 text-slate-300 hover:text-indigo-600">
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                    <button onClick={() => deletarTransacao(t.id_transacao)} className="p-2 text-slate-300 hover:text-rose-500">
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
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
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-black">
    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
      <h3 className="text-xl font-black mb-6 text-slate-800 uppercase tracking-tighter">Editar Registro</h3>
      <form onSubmit={salvarEdicao} className="space-y-4">
        
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Descrição</label>
          <input type="text" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-semibold" value={formEdit.descricao} onChange={e => setFormEdit({...formEdit, descricao: e.target.value})} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Valor</label>
            <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-semibold" value={formEdit.valor} onChange={e => setFormEdit({...formEdit, valor: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Data</label>
            <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-semibold text-slate-500" value={formEdit.data_transacao} onChange={e => setFormEdit({...formEdit, data_transacao: e.target.value})} />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Conta</label>
          <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-semibold appearance-none" value={formEdit.id_conta} onChange={e => setFormEdit({...formEdit, id_conta: e.target.value})}>
            {contas.map(conta => <option key={conta.id_conta} value={conta.id_conta}>{conta.nome_conta}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Categoria</label>
          <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-semibold appearance-none" value={formEdit.id_categoria} onChange={e => setFormEdit({...formEdit, id_categoria: e.target.value})}>
            {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nome_categoria}</option>)}
          </select>
        </div>

        <div className="flex gap-3 pt-6">
          <button type="button" onClick={() => setEditando(null)} className="flex-1 py-4 font-black text-slate-400 uppercase text-xs tracking-widest">Cancelar</button>
          <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-[1.5rem] uppercase text-xs tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700">Salvar Alterações</button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  )
}