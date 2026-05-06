'use client'
import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function DespesasFixas() {
  const [categorias, setCategorias] = useState([])
  const [contas, setContas] = useState([])
  const [despesasFixas, setDespesasFixas] = useState([])
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
      
      const dadosCat = await resCat.json();
      const dadosContas = await resContas.json();
      const dadosFixas = await resFixas.json();
      
      setCategorias(Array.isArray(dadosCat) ? dadosCat : []);
      setContas(Array.isArray(dadosContas) ? dadosContas : []);
      setDespesasFixas(Array.isArray(dadosFixas) ? dadosFixas : []);
    } catch (err) { 
      console.error("Erro ao carregar dados:", err) 
    }
  }

  useEffect(() => { carregarDados() }, [])

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

  const salvarEdicao = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/editar-despesa-fixa/${editando}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) { setEditando(null); carregarDados(); }
    } catch (err) { alert("Erro na rede."); }
  };

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
        setForm({ ...form, valor: '', descricao: '', data_final: '' });
        carregarDados()
      }
    } catch (err) { alert("Erro na rede.") }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-black pb-20">
      <div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Despesas Fixas</h2>
        <p className="text-slate-400 text-sm font-medium">Gerencie seus contratos e assinaturas recorrentes.</p>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
        <h3 className="text-xl font-bold text-slate-700 text-center mb-8">Novo Contrato</h3>
        <form onSubmit={salvarNovo} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Descrição</label>
            <input type="text" required value={form.descricao} onChange={(e) => setForm({...form, descricao: e.target.value})} placeholder="Ex: Aluguel, Netflix..." className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Valor Mensal</label>
              <input type="number" step="0.01" required value={form.valor} onChange={(e) => setForm({...form, valor: e.target.value})} placeholder="0,00" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Dia Vencimento</label>
              <input type="number" min="1" max="31" required value={form.dia_vencimento} onChange={(e) => setForm({...form, dia_vencimento: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" />
            </div>
          </div>

          {/* CAMPOS DE RECORRÊNCIA E DATA REATIVADOS */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Frequência</label>
            <select value={form.frequencia} onChange={(e) => setForm({...form, frequencia: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm text-slate-600 appearance-none">
              <option value="mensal">Mensal</option>
              <option value="semanal">Semanal</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Início</label>
              <input type="date" required value={form.data_inicio} onChange={(e) => setForm({...form, data_inicio: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm text-slate-500" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Fim</label>
              <input type="date" required value={form.data_final} onChange={(e) => setForm({...form, data_final: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm text-slate-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Conta</label>
              <select required value={form.id_conta} onChange={(e) => setForm({...form, id_conta: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm text-slate-600 appearance-none">
                <option value="">Selecione...</option>
                {contas.map(c => <option key={c.id_conta} value={c.id_conta}>{c.nome_conta}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Categoria</label>
              <select required value={form.id_categoria} onChange={(e) => setForm({...form, id_categoria: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm text-slate-600 appearance-none">
                <option value="">Selecione...</option>
                {categorias.map(cat => <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nome_categoria}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[1.8rem] font-bold text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Salvar Lançamento</button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-700 text-center">Contratos Ativos</h3>
        <div className="grid grid-cols-1 gap-4">
          {despesasFixas.map(fixa => (
            <div key={fixa.id_fixa} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center hover:bg-slate-50 transition-all">
              <div>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{fixa.frequencia}</p>
                <h4 className="font-bold text-slate-800 text-lg">{fixa.descricao}</h4>
                <p className="text-slate-400 text-xs">Vence dia {fixa.dia_vencimento}</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-rose-500 font-black text-xl">- R$ {Math.abs(fixa.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => iniciarEdicao(fixa)} className="p-2 text-slate-300 hover:text-indigo-600 transition-all">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                  </button>
                  {/* EXCLUSÃO PELO UUID DO GRUPO */}
                  <button onClick={() => deletarDespesa(fixa.id_grupo_vinculo)} className="p-2 text-slate-300 hover:text-rose-500 transition-all">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editando && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-black">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold mb-6 text-slate-800 text-center">Editar Contrato</h3>
            <form onSubmit={salvarEdicao} className="space-y-4">
              <input type="text" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} />
                <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" value={form.dia_vencimento} onChange={e => setForm({...form, dia_vencimento: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditando(null)} className="flex-1 py-4 font-black text-slate-400 uppercase text-xs">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-xs shadow-lg shadow-indigo-100">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}