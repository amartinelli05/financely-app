'use client'
import { useState, useEffect } from 'react'

export default function Lancamentos() {
  const [categorias, setCategorias] = useState([])
  const [transacoes, setTransacoes] = useState([])
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [categoria, setCategoria] = useState('')

  const carregar = async () => {
    const resCat = await fetch('http://localhost:3000/testar-banco'); setCategorias(await resCat.json())
    const resTrans = await fetch('http://localhost:3000/listar-transacoes'); setTransacoes(await resTrans.json())
  }

  useEffect(() => { carregar() }, [])

  const salvar = async (e) => {
    e.preventDefault()
    await fetch('http://localhost:3000/nova-transacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_categoria: parseInt(categoria), valor: parseFloat(valor), tipo_movimento: 'Saída', descricao })
    })
    setDescricao(''); setValor(''); setCategoria(''); carregar()
  }

  return (
    <div className="space-y-10">
      <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic">Lançamentos.</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
          <form onSubmit={salvar} className="space-y-6">
            <input type="text" placeholder="Descrição" required className="w-full p-5 bg-slate-50 rounded-2xl outline-none" value={descricao} onChange={e => setDescricao(e.target.value)} />
            <input type="number" step="0.01" placeholder="Valor" required className="w-full p-5 bg-slate-50 rounded-2xl outline-none" value={valor} onChange={e => setValor(e.target.value)} />
            <select required className="w-full p-5 bg-slate-50 rounded-2xl outline-none" value={categoria} onChange={e => setCategoria(e.target.value)}>
              <option value="">Selecione a categoria</option>
              {categorias.map(cat => <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nome_categoria}</option>)}
            </select>
            <button className="w-full py-5 bg-slate-900 text-white font-bold rounded-3xl hover:bg-indigo-600 transition-all">Registrar gasto</button>
          </form>
        </div>

        <div className="lg:col-span-8 bg-white p-10 rounded-[3rem] border border-slate-100">
          <div className="space-y-4">
            {transacoes.map((t) => (
              <div key={t.id_transacao} className="flex justify-between items-center p-5 hover:bg-slate-50 rounded-[2rem] transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xs">R$</div>
                  <div>
                    <p className="font-bold text-slate-800 text-lg">{t.descricao}</p>
                    <p className="text-[10px] font-bold text-slate-300 uppercase">{t.nome_categoria}</p>
                  </div>
                </div>
                <div className="font-black text-slate-700">R$ {parseFloat(t.valor).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}