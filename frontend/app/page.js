'use client'
import './globals.css';
import { useState, useEffect } from 'react'

export default function Home() {
  const [categorias, setCategorias] = useState([])
  const [transacoes, setTransacoes] = useState([])
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('')
  const [mensagem, setMensagem] = useState('')

  const carregarDados = async () => {
    try {
      const resCat = await fetch('http://localhost:3000/testar-banco')
      const dataCat = await resCat.json()
      setCategorias(dataCat)
      const resTrans = await fetch('http://localhost:3000/listar-transacoes')
      const dataTrans = await resTrans.json()
      setTransacoes(dataTrans)
    } catch (err) { console.error(err) }
  }

  useEffect(() => { carregarDados() }, [])

  const salvarGasto = async (e) => {
    e.preventDefault()
    const res = await fetch('http://localhost:3000/nova-transacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_categoria: parseInt(categoriaSelecionada),
        valor: parseFloat(valor),
        tipo_movimento: 'Saída',
        descricao: descricao
      })
    })
    if (res.ok) {
      setMensagem("Gasto registrado!"); carregarDados();
      setValor(''); setDescricao(''); setCategoriaSelecionada('');
      setTimeout(() => setMensagem(''), 3000)
    }
  }

  const totalGasto = transacoes.reduce((acc, t) => acc + parseFloat(t.valor), 0)

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-end border-b border-slate-200 pb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Resumo Financeiro</h2>
          <p className="text-slate-500">Controle seus gastos de forma simples.</p>
        </div>
        <div className="bg-white px-8 py-5 rounded-3xl border border-slate-200 shadow-sm text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Gasto</span>
          <p className="text-3xl font-black text-indigo-600 leading-none mt-1">
            R$ {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Card de Cadastro */}
        <div className="lg:col-span-4">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold mb-8 text-slate-800">Novo Registro</h3>
            <form onSubmit={salvarGasto} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Descrição</label>
                <input type="text" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all" 
                  placeholder="Ex: Almoço" value={descricao} onChange={e => setDescricao(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Valor</label>
                  <input type="number" step="0.01" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all" 
                    placeholder="0,00" value={valor} onChange={e => setValor(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Categoria</label>
                  <select required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all" 
                    value={categoriaSelecionada} onChange={e => setCategoriaSelecionada(e.target.value)}>
                    <option value="">...</option>
                    {categorias.map(cat => (
                      <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nome_categoria}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200">
                Registrar
              </button>
            </form>
            {mensagem && <p className="mt-4 text-center text-sm font-bold text-green-600">{mensagem}</p>}
          </div>
        </div>

        {/* Histórico */}
        <div className="lg:col-span-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 ml-2">Histórico Recente</h3>
            {transacoes.map((t) => (
              <div key={t.id_transacao} className="flex justify-between items-center p-6 bg-white border border-slate-100 rounded-[2rem] hover:shadow-md transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">💸</div>
                  <div>
                    <p className="font-bold text-slate-800 text-lg leading-tight">{t.descricao}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{t.nome_categoria}</p>
                  </div>
                </div>
                <div className="text-right text-lg font-black text-slate-900">
                  - R$ {parseFloat(t.valor).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}