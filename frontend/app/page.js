'use client'
import { useState, useEffect } from 'react'

export default function Home() {
  const [categorias, setCategorias] = useState([])
  const [transacoes, setTransacoes] = useState([])
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('')
  const [mensagem, setMensagem] = useState('')

  // Função para carregar tudo do Back-end
  const carregarDados = async () => {
    try {
      // Busca categorias para o Select
      const resCat = await fetch('http://localhost:3000/testar-banco')
      const dataCat = await resCat.json()
      setCategorias(dataCat)

      // Busca as últimas transações para a Lista
      const resTrans = await fetch('http://localhost:3000/listar-transacoes')
      const dataTrans = await resTrans.json()
      setTransacoes(dataTrans)
    } catch (err) {
      console.error("Erro ao carregar dados:", err)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const salvarGasto = async (e) => {
    e.preventDefault()
    const novoGasto = {
      id_categoria: parseInt(categoriaSelecionada),
      valor: parseFloat(valor),
      tipo_movimento: 'Saída',
      descricao: descricao
    }

    const res = await fetch('http://localhost:3000/nova-transacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoGasto)
    })

    if (res.ok) {
      setMensagem("✅ Gasto salvo!")
      setValor(''); setDescricao(''); setCategoriaSelecionada('');
      carregarDados() // Atualiza a lista e o saldo na hora!
      setTimeout(() => setMensagem(''), 3000)
    }
  }

  // Cálculo do total gasto
  const totalGasto = transacoes.reduce((acc, t) => acc + parseFloat(t.valor), 0)

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-10 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto">
        
        {/* Header e Card de Saldo */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-black text-indigo-600 tracking-tighter">FINANCELY.</h1>
            <p className="text-slate-500 font-medium">Controle de Gastos Universitários</p>
          </div>
          <div className="bg-white border-2 border-indigo-100 p-6 rounded-3xl shadow-sm flex flex-col items-end">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Gasto</span>
            <span className="text-3xl font-black text-indigo-600">R$ {totalGasto.toFixed(2)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Formulário */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
                Novo Registro
              </h2>
              <form onSubmit={salvarGasto} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 ml-1">O QUE FOI?</label>
                  <input type="text" required className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-400 outline-none transition-all" 
                    placeholder="Ex: Almoço RU" value={descricao} onChange={e => setDescricao(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 ml-1">VALOR</label>
                  <input type="number" step="0.01" required className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-400 outline-none transition-all" 
                    placeholder="R$ 0,00" value={valor} onChange={e => setValor(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 ml-1">CATEGORIA</label>
                  <select required className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-400 outline-none transition-all appearance-none" 
                    value={categoriaSelecionada} onChange={e => setCategoriaSelecionada(e.target.value)}>
                    <option value="">Selecione...</option>
                    {categorias.map(cat => (
                      <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nome_categoria}</option>
                    ))}
                  </select>
                </div>
                <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95">
                  Salvar Lançamento
                </button>
              </form>
              {mensagem && <p className="mt-4 text-center font-bold text-green-500 animate-bounce">{mensagem}</p>}
            </div>
          </div>

          {/* Lista de Transações (Extrato) */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[450px]">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="w-2 h-6 bg-emerald-400 rounded-full"></span>
                Últimos Gastos
              </h2>
              <div className="space-y-4">
                {transacoes.length === 0 ? (
                  <div className="text-center py-20 text-slate-300 italic">Nenhum gasto registrado ainda.</div>
                ) : (
                  transacoes.map((t) => (
                    <div key={t.id_transacao} className="group flex justify-between items-center p-5 bg-slate-50 hover:bg-white hover:shadow-md hover:border-indigo-100 border border-transparent rounded-2xl transition-all">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{t.descricao}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter bg-slate-200 px-2 py-0.5 rounded-md w-fit mt-1">
                          {t.nome_categoria}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-rose-500">- R$ {parseFloat(t.valor).toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(t.data_transacao).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}