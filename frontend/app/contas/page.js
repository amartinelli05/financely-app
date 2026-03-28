'use client'
import { useState, useEffect } from 'react'

export default function ContasPage() {
  const [contas, setContas] = useState([])
  const [loading, setLoading] = useState(true)

  // Estados para o Modal
  const [modalAberto, setModalAberto] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [nome, setNome] = useState('')
  const [saldo, setSaldo] = useState('')
  const [tipo, setTipo] = useState('Corrente')
  const [agencia, setAgencia] = useState('')
  const [numero, setNumero] = useState('')

  useEffect(() => {
    buscarContas()
  }, [])

  const buscarContas = async () => {
    const idUsuario = localStorage.getItem('usuarioId')
    try {
      const res = await fetch(`http://localhost:3000/listar-contas?id_usuario=${idUsuario}`)
      const data = await res.json()
      setContas(data)
    } catch (err) {
      console.error("Erro ao carregar contas:", err)
    } finally {
      setLoading(false)
    }
  }

  const abrirEdicao = (conta) => {
  setEditandoId(conta.id_conta);
  setNome(conta.nome_conta);
  setSaldo(conta.saldo_inicial);   
  setTipo(conta.tipo_conta);
  setAgencia(conta.agencia || '');
  setNumero(conta.numero_conta || '');
  setModalAberto(true);
}

  const handleExcluir = async (id) => {
    if (confirm("Tem certeza que deseja excluir esta conta?")) {
      try {
        const res = await fetch(`http://localhost:3000/excluir-conta/${id}`, { method: 'DELETE' })
        if (res.ok) {
          buscarContas()
        } else {
          const data = await res.json()
          alert(data.error || "Erro ao excluir conta")
        }
      } catch (err) {
        alert("Erro ao conectar com o servidor")
      }
    }
  }
  
const handleSalvarConta = async (e) => {
  e.preventDefault();
  const idUsuario = localStorage.getItem('usuarioId');

  const dados = {
    id_usuario: parseInt(idUsuario),
    nome_conta: nome,
    tipo_conta: tipo,
    agencia: agencia,
    numero_conta: numero,
    // Enviamos SEMPRE como saldo_inicial para o Backend processar o ajuste
    saldo_inicial: parseFloat(saldo) || 0 
  };

    // Se estiver criando do zero, o valor vai para saldo_inicial
    // Se estiver editando, vai para saldo_atual para o Backend calcular o ajuste
    if (editandoId) {
      dados.saldo_atual = parseFloat(saldo) || 0
    } else {
      dados.saldo_inicial = parseFloat(saldo) || 0
    }

    const url = editandoId 
      ? `http://localhost:3000/editar-conta/${editandoId}` 
      : 'http://localhost:3000/cadastrar-conta'
    
    const metodo = editandoId ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      })

      if (res.ok) {
        setModalAberto(false)
        setEditandoId(null)
        limparCampos()
        buscarContas() 
      } else {
        const erroMsg = await res.json()
        alert("Erro ao salvar: " + erroMsg.error)
      }
    } catch (err) {
      alert("Erro ao salvar conta")
    }
  }

  const limparCampos = () => {
    setNome(''); setSaldo(''); setAgencia(''); setNumero(''); setTipo('Corrente'); setEditandoId(null)
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center text-black">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Minhas <span className="text-[#4f46e5]">Contas</span>
          </h1>
          <p className="text-slate-500 font-medium">Gerencie seus bancos e saldos disponíveis.</p>
        </div>
        <button 
          onClick={() => { limparCampos(); setModalAberto(true); }}
          className="bg-[#4f46e5] hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Nova Conta
        </button>
      </div>

      {/* Grid de Contas */}
      {loading ? (
        <p className="text-slate-400 font-medium">Carregando contas...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contas.map((conta) => (
            <div key={conta.id_conta} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 text-[#4f46e5] rounded-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => abrirEdicao(conta)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                  </button>
                  <button onClick={() => handleExcluir(conta.id_conta)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-slate-800">{conta.nome_conta}</h3>
              <p className="text-slate-400 text-sm font-medium mb-4">{conta.tipo_conta}</p>
              
              {/* IMPORTANTE: Aqui mostramos o saldo_atual para refletir as transações */}
              <div className="text-2xl font-black text-slate-900">
                R$ {parseFloat(conta.saldo_atual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-black">
          <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl">
            <h2 className="text-2xl font-black text-slate-900 mb-6">{editandoId ? 'Editar Conta' : 'Cadastrar Conta'}</h2>
            
            <form onSubmit={handleSalvarConta} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700 ml-1">Nome da Conta *</label>
                <input required className="w-full bg-slate-50 border-none rounded-2xl p-4 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
                  value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Nubank, Carteira..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
  <div>
    {/* Deixe apenas 'Saldo Inicial'. Assim o usuário sabe que está editando a base da conta */}
    <label className="text-sm font-bold text-slate-700 ml-1">Saldo Inicial</label>
    <input 
      type="number" 
      step="0.01" 
      className="w-full bg-slate-50 border-none rounded-2xl p-4 mt-1 outline-none text-slate-900"
      value={saldo} 
      onChange={(e) => setSaldo(e.target.value)} 
      placeholder="0,00" 
    />
  </div>
  <div>
    <label className="text-sm font-bold text-slate-700 ml-1">Tipo</label>
    <select 
      className="w-full bg-slate-50 border-none rounded-2xl p-4 mt-1 outline-none text-slate-900"
      value={tipo} 
      onChange={(e) => setTipo(e.target.value)}
    >
      <option value="Corrente">Corrente</option>
      <option value="Poupança">Poupança</option>
      <option value="Investimento">Investimento</option>
      <option value="Dinheiro">Dinheiro</option>
    </select>
  </div>
</div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 ml-1">Agência</label>
                  <input className="w-full bg-slate-50 border-none rounded-2xl p-4 mt-1 outline-none text-slate-900"
                    value={agencia} onChange={(e) => setAgencia(e.target.value)} placeholder="0000" />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 ml-1">Nº Conta</label>
                  <input className="w-full bg-slate-50 border-none rounded-2xl p-4 mt-1 outline-none text-slate-900"
                    value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="00000-0" />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => { setModalAberto(false); limparCampos(); }} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-[#4f46e5] text-white font-bold rounded-2xl hover:bg-indigo-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}