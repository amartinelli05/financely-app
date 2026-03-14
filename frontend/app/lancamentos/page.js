'use client'
import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function Lancamentos() {
  const [tipo, setTipo] = useState('saida')
  const [mostrarNovaCat, setMostrarNovaCat] = useState(false)
  
  const [categorias, setCategorias] = useState([])
  const [valor, setValor] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [idCategoria, setIdCategoria] = useState('')
  const [novaCategoria, setNovaCategoria] = useState('')
  const [descricao, setDescricao] = useState('')

  const carregarCategorias = async () => {
    const idUsuario = localStorage.getItem('usuarioId');
    try {
      // AJUSTADO: URL Dinâmica
      const res = await fetch(`${API_URL}/listar-categorias?id_usuario=${idUsuario}`);
      const dados = await res.json();
      setCategorias(Array.isArray(dados) ? dados : []);
    } catch (err) { 
      console.error("Erro ao carregar categorias:", err) 
    }
  }

  useEffect(() => {
    carregarCategorias()
  }, [])

  const salvar = async (e) => {
    e.preventDefault()

    try {
      const idUsuario = localStorage.getItem('usuarioId')

      if (!idUsuario) {
        alert("Sessão expirada. Por favor, faça login novamente.")
        return
      }

      let categoriaParaSalvar = idCategoria

      if (mostrarNovaCat && novaCategoria) {
        // AJUSTADO: URL Dinâmica
        const resCat = await fetch(`${API_URL}/categorias`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            nome_categoria: novaCategoria,
            id_usuario: parseInt(idUsuario)
          })
        })
        const novaCatCriada = await resCat.json()
        categoriaParaSalvar = novaCatCriada.id_categoria
      }

      if (!categoriaParaSalvar && !mostrarNovaCat) {
        alert("Selecione uma categoria!")
        return
      }

      const dadosTransacao = {
        descricao,
        valor: parseFloat(valor),
        id_categoria: parseInt(categoriaParaSalvar),
        data_transacao: data,
        tipo: tipo,
        id_usuario: parseInt(idUsuario)
      }

      // AJUSTADO: URL Dinâmica
      const res = await fetch(`${API_URL}/nova-transacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosTransacao)
      })

      if (res.ok) {
        alert("🚀 Lançamento realizado com sucesso!")
        setDescricao('')
        setValor('')
        setNovaCategoria('')
        setMostrarNovaCat(false)
        carregarCategorias()
      } else {
        const erroJson = await res.json()
        alert("Erro ao salvar: " + (erroJson.erro || "Verifique os dados."))
      }
    } catch (err) {
      console.error("Erro na requisição:", err)
      alert("Servidor offline ou erro na rede.")
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 text-black">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Lançamentos</h2>
        <p className="text-slate-400 text-sm font-medium">Registre suas movimentações financeiras.</p>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8">
        <div className="flex bg-slate-50 p-2 rounded-[2rem] border border-slate-100">
          <button 
            type="button"
            onClick={() => setTipo('entrada')}
            className={`flex-1 py-4 rounded-[1.5rem] font-bold transition-all ${tipo === 'entrada' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            💰 Entrada
          </button>
          <button 
            type="button"
            onClick={() => setTipo('saida')}
            className={`flex-1 py-4 rounded-[1.5rem] font-bold transition-all ${tipo === 'saida' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            💸 Saída
          </button>
        </div>

        <form onSubmit={salvar} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Valor</label>
              <input 
                type="number" step="0.01" required value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00" 
                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all font-bold" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Data</label>
              <input 
                type="date" required value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all font-bold text-slate-600" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex justify-between">
              Categoria
              <button type="button" onClick={() => setMostrarNovaCat(!mostrarNovaCat)} className="text-indigo-600 hover:underline">
                {mostrarNovaCat ? '- Escolher Existente' : '+ Nova Categoria'}
              </button>
            </label>
            
            {mostrarNovaCat ? (
              <input 
                type="text" value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
                placeholder="Nome da nova categoria..." 
                className="w-full p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all font-bold" 
              />
            ) : (
              <select 
                required value={idCategoria}
                onChange={(e) => setIdCategoria(e.target.value)}
                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all font-bold text-slate-600 appearance-none"
              >
                <option value="">Selecione uma categoria...</option>
                {categorias.map(cat => (
                  <option key={cat.id_categoria} value={cat.id_categoria}>
                    {cat.nome_categoria}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Descrição</label>
            <input 
              type="text" required value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Compra no mercado..." 
              className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all font-bold" 
            />
          </div>

          <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[1.8rem] font-bold text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] transition-all">
            Salvar Lançamento
          </button>
        </form>
      </div>
    </div>
  )
}