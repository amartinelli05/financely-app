'use client'
import { useState, useEffect } from 'react'

export default function Relatorios() {
  const [transacoes, setTransacoes] = useState([])

  useEffect(() => {
    fetch('http://localhost:3000/listar-transacoes')
      .then(res => res.json())
      .then(data => setTransacoes(data))
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-800">Relatório Detalhado</h2>
        <button onClick={() => window.print()} className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
          🖨️ Imprimir
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="p-6 text-[10px] font-bold text-slate-400 uppercase">Data</th>
              <th className="p-6 text-[10px] font-bold text-slate-400 uppercase">Descrição</th>
              <th className="p-6 text-[10px] font-bold text-slate-400 uppercase">Categoria</th>
              <th className="p-6 text-[10px] font-bold text-slate-400 uppercase text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transacoes.map((t) => (
              <tr key={t.id_transacao} className="hover:bg-slate-50/50 transition-all">
                <td className="p-6 text-sm text-slate-500">
                  {new Date().toLocaleDateString('pt-BR')} 
                </td>
                <td className="p-6 font-bold text-slate-700">{t.descricao}</td>
                <td className="p-6">
                  <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                    {t.nome_categoria}
                  </span>
                </td>
                <td className="p-6 text-right font-black text-slate-900">
                  R$ {parseFloat(t.valor).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}