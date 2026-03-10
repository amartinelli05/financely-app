'use client'
import { useState, useEffect } from 'react'

export default function Home() {
  const [categorias, setCategorias] = useState([])
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('')
  const [mensagem, setMensagem] = useState('')

  // 1. Busca as categorias do seu Back-end ao carregar a página
  useEffect(() => {
    fetch('http://localhost:3000/testar-banco')
      .then(res => res.json())
      .then(data => setCategorias(data))
      .catch(err => {
        console.error("Erro ao buscar categorias:", err)
        setMensagem("⚠️ Erro ao conectar com o Back-end. Verifique se ele está ligado!")
      })
  }, [])

  // 2. Função para enviar o gasto para o banco (POST)
  const salvarGasto = async (e) => {
    e.preventDefault()
    setMensagem("Salvando...")
    
    const novoGasto = {
      id_categoria: parseInt(categoriaSelecionada),
      valor: parseFloat(valor),
      tipo_movimento: 'Saída', // Gasto padrão do Lucas
      descricao: descricao
    }

    try {
      const res = await fetch('http://localhost:3000/nova-transacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoGasto)
      })

      if (res.ok) {
        setMensagem("✅ Gasto registrado com sucesso!")
        setValor('')
        setDescricao('')
        setCategoriaSelecionada('')
      } else {
        setMensagem("❌ Erro ao salvar no banco de dados.")
      }
    } catch (err) {
      setMensagem("❌ Ocorreu um erro de conexão.")
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
      <h1 className="text-4xl font-extrabold text-blue-700 mb-2">Financely</h1>
      <p className="text-gray-600 mb-8 italic">Gestão Financeira para Estudantes</p>

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
        <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">Registrar Novo Gasto</h2>
        
        <form onSubmit={salvarGasto} className="space-y-5">
          {/* Campo de Descrição */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">O que você comprou?</label>
            <input 
              type="text" required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={descricao} onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Almoço no RU ou Xerox"
            />
          </div>

          {/* Campo de Valor */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Valor (R$)</label>
            <input 
              type="number" step="0.01" required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={valor} onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
            />
          </div>

          {/* Campo de Categoria vindo do Banco */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Categoria</label>
            <select 
              required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
              value={categoriaSelecionada} onChange={(e) => setCategoriaSelecionada(e.target.value)}
            >
              <option value="">Selecione uma categoria...</option>
              {categorias.map(cat => (
                <option key={cat.id_categoria} value={cat.id_categoria}>
                  {cat.nome_categoria} ({cat.tipo_categoria})
                </option>
              ))}
            </select>
          </div>

          {/* Botão de Enviar */}
          <button 
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700 active:scale-95 transition-all shadow-lg"
          >
            Salvar no Financely
          </button>
        </form>
        {/* Mensagem de Feedback */}
        {mensagem && (
          <div className={`mt-6 p-3 rounded-lg text-center font-medium ${mensagem.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {mensagem}
          </div>
        )}
      </div>

      <footer className="mt-12 text-gray-400 text-sm">
        Projeto ABEX - Sistemas de Informação
      </footer>
    </main>
  )
}