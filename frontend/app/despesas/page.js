'use client'
import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function DespesasFixas() {
  const [categorias, setCategorias] = useState([])
  const [contas, setContas] = useState([])
  const [despesasFixas, setDespesasFixas] = useState([])
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false) // Estado para abrir/fechar modal de cadastro
  const [editando, setEditando] = useState(null) 

  const [form, setForm] = useState({
    valor: '',
    descricao: '',
    id_categoria: '',
    id_conta: '',
    frequencia: 'mensal',
    dia_vencimento: '10',
    data_inicio: new Date().toISOString().split('T')[0],
    data_final: ''
  })

  const carregarDados = async () => {
    const idUsuario = localStorage.getItem('usuarioId');
    if (!idUsuario) return;
    try {
      const [resCat, resContas, resFixas] = await Promise.all([
        fetch(`${API_URL}/listar-categorias?id_usuario=${idUsuario}`),
        fetch(`${API_URL}/listar-contas?id_usuario=${idUsuario}`),
        fetch(`${API_URL}/listar-despesas-fixas?id_usuario=${idUsuario}`)
      ]);
      
      const [dadosCat, dadosContas, dadosFixas] = await Promise.all([
        resCat.json(), resContas.json(), resFixas.json()
      ]);
      
      setCategorias(Array.isArray(dadosCat) ? dadosCat : []);
      setContas(Array.isArray(dadosContas) ? dadosContas : []);
      setDespesasFixas(Array.isArray(dadosFixas) ? dadosFixas : []);
    } catch (err) { 
      console.error("Erro ao carregar dados:", err) 
    }
  }

  useEffect(() => { carregarDados() }, [])

  const resetarForm = () => {
    setForm({
      valor: '',
      descricao: '',
      id_categoria: '',
      id_conta: '',
      frequencia: 'mensal',
      dia_vencimento: '10',
      data_inicio: new Date().toISOString().split('T')[0],
      data_final: ''
    })
  }

  const salvarNovo = async (e) => {
    e.preventDefault()
    try {
      const idUsuario = localStorage.getItem('usuarioId')
      const res = await fetch(`${API_URL}/cadastrar-despesa-fixa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id_usuario: parseInt(idUsuario) })
      })
      if (res.ok) {
        alert("🗓️ Lançamento realizado!")
        resetarForm()
        setModalCadastroAberto(false)
        carregarDados()
      }
    } catch (err) { alert("Erro na rede.") }
  }

  const salvarEdicao = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/editar-despesa-fixa/${editando}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) { setEditando(null); resetarForm(); carregarDados(); }
    } catch (err) { alert("Erro na rede."); }
  };

  const deletarDespesa = async (grupoId) => {
    if (window.confirm("⚠️ Deseja encerrar este contrato e remover parcelas futuras?")) {
      try {
        const res = await fetch(`${API_URL}/deletar-despesa-fixa/${grupoId}`, { method: 'DELETE' });
        if (res.ok) { carregarDados(); }
      } catch (err) { alert("Erro ao conectar com o servidor."); }
    }
  };

  const iniciarEdicao = (fixa) => {
    setEditando(fixa.id_grupo_vinculo);
    setForm({
      valor: Math.abs(fixa.valor),
      descricao: fixa.descricao,
      id_categoria: fixa.id_categoria,
      id_conta: fixa.id_conta,
      frequencia: fixa.frequencia,
      dia_vencimento: fixa.dia_vencimento,
      data_inicio: fixa.data_inicio.split('T')[0],
      data_final: fixa.data_final ? fixa.data_final.split('T')[0] : ''
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 text-black pb-20">
      
      {/* HEADER DO MÓDULO COM BOTÃO DE CADASTRO */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-100/40 border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Despesas Fixas</h2>
          <p className="text-slate-400 text-sm font-medium">Gerencie seus contratos e assinaturas recorrentes.</p>
        </div>
        <button 
          onClick={() => { resetarForm(); setModalCadastroAberto(true); }}
          className="px-6 py-4 bg-indigo-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2 whitespace-nowrap self-stretch sm:self-auto justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5v14"/></svg>
          Novo Contrato
        </button>
      </div>

      {/* LISTA DE CONTRATOS ATIVOS */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-700 pl-2">Contratos Ativos</h3>
        
        {despesasFixas.length === 0 ? (
          <div className="p-10 bg-white border border-slate-100 rounded-[2.5rem] text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3 mx-auto text-xl">📃</div>
            <p className="text-slate-400 font-semibold text-sm">Nenhum contrato ativo cadastrado.</p>
            <p className="text-slate-300 text-xs mt-1">Clique em "+ Novo Contrato" no topo para registrar sua primeira assinatura recorrente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {despesasFixas.map(fixa => (
              <div key={fixa.id_fixa} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center hover:bg-slate-50 transition-all">
                <div>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{fixa.frequencia}</p>
                  <h4 className="font-bold text-slate-800 text-lg">{fixa.descricao}</h4>
                  <p className="text-slate-400 text-xs">Vencimento: {fixa.frequencia === 'mensal' ? `Dia ${fixa.dia_vencimento}` : `Semanal`}</p>
                </div>
                <div className="flex items-center gap-6">
                  <p className="text-rose-500 font-black text-xl">- R$ {Math.abs(fixa.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <div className="flex gap-2">
                    <button onClick={() => iniciarEdicao(fixa)} className="p-2 text-slate-300 hover:text-indigo-600 transition-all">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                    <button onClick={() => deletarDespesa(fixa.id_grupo_vinculo)} className="p-2 text-slate-300 hover:text-rose-500 transition-all">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- MODAL DE CADASTRO COMPLETO --- */}
      {modalCadastroAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-black">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh] border border-slate-100">
            <h3 className="text-xl font-bold mb-6 text-slate-800 text-center">Novo Contrato Recorrente</h3>
            <form onSubmit={salvarNovo} className="space-y-5">
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Descrição</label>
                <input type="text" required value={form.descricao} onChange={(e) => setForm({...form, descricao: e.target.value})} placeholder="Ex: Aluguel, Netflix..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Frequência</label>
                  <select value={form.frequencia} onChange={(e) => setForm({...form, frequencia: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm text-slate-600 appearance-none">
                    <option value="mensal">Mensal</option>
                    <option value="semanal">Semanal</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                    {form.frequencia === 'mensal' ? 'Dia do Vencimento' : 'Dia da Semana'}
                  </label>
                  {form.frequencia === 'mensal' ? (
                    <input type="number" min="1" max="31" required value={form.dia_vencimento} onChange={(e) => setForm({...form, dia_vencimento: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" />
                  ) : (
                    <select value={form.dia_vencimento} onChange={(e) => setForm({...form, dia_vencimento: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm text-slate-600 appearance-none">
                      <option value="1">Segunda-feira</option>
                      <option value="2">Terça-feira</option>
                      <option value="3">Quarta-feira</option>
                      <option value="4">Quinta-feira</option>
                      <option value="5">Sexta-feira</option>
                      <option value="6">Sábado</option>
                      <option value="0">Domingo</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Valor</label>
                  <input type="number" step="0.01" required value={form.valor} onChange={(e) => setForm({...form, valor: e.target.value})} placeholder="0,00" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Conta Vinculada</label>
                  <select required value={form.id_conta} onChange={(e) => setForm({...form, id_conta: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm text-slate-600 appearance-none">
                    <option value="">Selecione uma conta...</option>
                    {contas.map(c => <option key={c.id_conta} value={c.id_conta}>{c.nome_conta}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Data Início</label>
                  <input type="date" required value={form.data_inicio} onChange={(e) => setForm({...form, data_inicio: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm text-slate-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Data Final</label>
                  <input type="date" required value={form.data_final} onChange={(e) => setForm({...form, data_final: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm text-slate-500" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Categoria</label>
                <select required value={form.id_categoria} onChange={(e) => setForm({...form, id_categoria: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm text-slate-600 appearance-none">
                  <option value="">Selecione uma categoria...</option>
                  {categorias.map(cat => <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nome_categoria}</option>)}
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setModalCadastroAberto(false)} className="flex-1 py-4 font-black text-slate-400 uppercase text-xs tracking-wider">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-xs tracking-wider shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors">Salvar Lançamento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO COMPLETO */}
      {editando && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-black">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh] border border-slate-100">
            <h3 className="text-xl font-bold mb-6 text-slate-800 text-center">Editar Contrato</h3>
            <form onSubmit={salvarEdicao} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Descrição</label>
                  <input type="text" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Valor</label>
                  <input type="number" step="0.01" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Frequência</label>
                  <select value={form.frequencia} onChange={(e) => setForm({...form, frequencia: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold">
                    <option value="mensal">Mensal</option>
                    <option value="semanal">Semanal</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Vencimento</label>
                  {form.frequencia === 'mensal' ? (
                    <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={form.dia_vencimento} onChange={e => setForm({...form, dia_vencimento: e.target.value})} />
                  ) : (
                    <select value={form.dia_vencimento} onChange={(e) => setForm({...form, dia_vencimento: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold">
                      <option value="1">Segunda</option><option value="2">Terça</option><option value="3">Quarta</option>
                      <option value="4">Quinta</option><option value="5">Sexta</option><option value="6">Sábado</option><option value="0">Domingo</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Início</label>
                   <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={form.data_inicio} onChange={e => setForm({...form, data_inicio: e.target.value})} />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Fim</label>
                   <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={form.data_final} onChange={e => setForm({...form, data_final: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <select className="p-4 bg-slate-50 rounded-2xl outline-none font-bold shadow-sm" value={form.id_conta} onChange={e => setForm({...form, id_conta: e.target.value})}>
                   {contas.map(c => <option key={c.id_conta} value={c.id_conta}>{c.nome_conta}</option>)}
                </select>
                <select className="p-4 bg-slate-50 rounded-2xl outline-none font-bold shadow-sm" value={form.id_categoria} onChange={e => setForm({...form, id_categoria: e.target.value})}>
                   {categorias.map(cat => <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nome_categoria}</option>)}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditando(null)} className="flex-1 py-4 font-black text-slate-400 uppercase text-xs">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-xs shadow-lg shadow-indigo-100">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}