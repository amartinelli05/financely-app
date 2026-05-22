'use client'
import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Dashboard() {
  const [transacoes, setTransacoes] = useState([])
  const [transacoesFiltradas, setTransacoesFiltradas] = useState([])
  const [saldosContas, setSaldosContas] = useState([]) 
  const [loadingContas, setLoadingContas] = useState(true) 
  const [metas, setMetas] = useState([]) 
  const [loadingMetas, setLoadingMetas] = useState(true) 
  const [periodo, setPeriodo] = useState('tudo')

  const carregarDados = async () => {
    try {
      const idUsuario = localStorage.getItem('usuarioId')
      
      if (!idUsuario) {
        console.warn("Usuário não identificado no localStorage")
        return
      }

      const [resTrans, resSaldos, resMetas] = await Promise.all([
        fetch(`${API_URL}/listar-transacoes?id_usuario=${idUsuario}`),
        fetch(`${API_URL}/saldo-por-conta?id_usuario=${idUsuario}`),
        fetch(`${API_URL}/listar-metas?id_usuario=${idUsuario}`)
      ])

      const dadosTrans = await resTrans.json()
      const dadosSaldos = await resSaldos.json()
      const dadosMetas = await resMetas.json()
      
      const listaValida = Array.isArray(dadosTrans) ? dadosTrans : []
      setTransacoes(listaValida)
      setTransacoesFiltradas(listaValida)
      setSaldosContas(Array.isArray(dadosSaldos) ? dadosSaldos : [])
      setMetas(Array.isArray(dadosMetas) ? dadosMetas : [])
    } catch (err) { 
      console.error("Erro ao buscar dados:", err)
      setTransacoes([])
      setSaldosContas([])
      setMetas([])
    } finally {
      setLoadingContas(false)
      setLoadingMetas(false)
    }
  }

  useEffect(() => { carregarDados() }, [])

  // Lógica de Filtro por Período
  useEffect(() => {
    const hoje = new Date()
    const mesAtual = hoje.getMonth() 
    const anoAtual = hoje.getFullYear()

    let filtradas = transacoes.filter(t => {
      if (!t.data_transacao) return false

      try {
        const dataPura = String(t.data_transacao).split('T')[0]
        const [ano, mes, dia] = dataPura.split('-').map(Number)

        if (periodo === 'mes') {
          return (mes - 1) === mesAtual && ano === anoAtual
        } 
        
        if (periodo === 'semana') {
          const dataT = new Date(ano, mes - 1, dia)
          const seteDiasAtras = new Date()
          seteDiasAtras.setDate(hoje.getDate() - 7)
          return dataT >= seteDiasAtras
        }

        return true 
      } catch (e) { return false }
    })

    setTransacoesFiltradas(filtradas)
  }, [periodo, transacoes])

  // --- FUNÇÕES DE AGRUPAMENTO PARA OS GRÁFICOS ---
  const resumoGeral = [
    { name: 'Entradas', valor: transacoesFiltradas.filter(t => parseFloat(t.valor) > 0).reduce((acc, t) => acc + parseFloat(t.valor || 0), 0), cor: '#4f46e5' },
    { name: 'Saídas', valor: Math.abs(transacoesFiltradas.filter(t => parseFloat(t.valor) < 0).reduce((acc, t) => acc + parseFloat(t.valor || 0), 0)), cor: '#f43f5e' }
  ]

  const dadosEntradas = () => {
    const cats = {}
    transacoesFiltradas.filter(t => parseFloat(t.valor) > 0).forEach(t => {
      const nome = t.nome_categoria || 'Outros'
      cats[nome] = (cats[nome] || 0) + parseFloat(t.valor || 0)
    })
    return Object.entries(cats).map(([name, value]) => ({ name, value }))
  }

  const dadosSaidas = () => {
    const cats = {}
    transacoesFiltradas.filter(t => parseFloat(t.valor) < 0).forEach(t => {
      const nome = t.nome_categoria || 'Outros'
      cats[nome] = (cats[nome] || 0) + Math.abs(parseFloat(t.valor || 0))
    })
    return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value)
  }

  const dadosBalanco = () => {
    const cats = {}
    transacoesFiltradas.forEach(t => {
      const nome = t.nome_categoria || 'Outros'
      if(!cats[nome]) cats[nome] = { name: nome, entradas: 0, saidas: 0 }
      if(parseFloat(t.valor) > 0) cats[nome].entradas += parseFloat(t.valor || 0)
      else cats[nome].saidas += Math.abs(parseFloat(t.valor || 0))
    })
    return Object.values(cats)
  }

  const dadosMovimentacaoPorConta = () => {
    return saldosContas.map(conta => {
      const lancamentosDaConta = transacoesFiltradas.filter(t => 
        Number(t.id_conta) === Number(conta.id_conta)
      )
      
      const entradas = lancamentosDaConta
        .filter(t => parseFloat(t.valor) > 0)
        .reduce((acc, t) => acc + parseFloat(t.valor || 0), 0)
        
      const saidas = lancamentosDaConta
        .filter(t => parseFloat(t.valor) < 0)
        .reduce((acc, t) => acc + Math.abs(parseFloat(t.valor || 0)), 0)

      return {
        name: conta.nome_conta,
        entradas: entradas,
        saidas: saidas
      }
    })
  }

  return (
    <div className="space-y-8 p-2 bg-slate-50/30 min-h-screen text-black">
      {/* HEADER DO DASHBOARD */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-100/40 border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Financely Dashboard</h2>
          <p className="text-slate-400 text-xs font-medium mt-1">
            Resumo de <span className="font-bold text-indigo-600">{transacoesFiltradas.length}</span> registros encontrados
          </p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
          {['tudo', 'mes', 'semana'].map((p) => (
            <button 
              key={p} 
              onClick={() => setPeriodo(p)} 
              className={`px-8 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${periodo === p ? 'bg-white text-indigo-600 shadow-sm scale-105' : 'text-slate-400 hover:text-slate-500'}`}
            >
              {p === 'semana' ? '7 Dias' : p === 'mes' ? 'Mês' : 'Tudo'}
            </button>
          ))}
        </div>
      </div>

      {/* SEÇÃO PRINCIPAL DE GRÁFICOS: GRID DE DUAS COLUNAS PERFEITO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* --- LINHA 1: ANÁLISE DE CONTAS BANCÁRIAS --- */}
        
        {/* 1. CARD: SALDO POR CONTA */}
        <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-100/40 border border-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-8 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-600 rounded-full" /> Saldo por Conta
            </h3>
            {loadingContas ? (
              <div className="text-slate-400 animate-pulse font-bold text-sm italic h-48 flex items-center justify-center">
                Carregando gráfico de saldos...
              </div>
            ) : (
              <div className="h-48"> 
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={saldosContas.map(c => ({ name: c.nome_conta, valor: parseFloat(c.saldo_atual || 0) }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: '600', fontSize: 11}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: '600', fontSize: 11}} tickFormatter={(value) => `R$ ${value}`} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'}} formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Saldo Atual']} />
                    <Bar dataKey="valor" radius={[8, 8, 0, 0]} barSize={20}>
                      {saldosContas.map((entry, index) => (
                        <Cell key={index} fill={parseFloat(entry.saldo_atual || 0) >= 0 ? '#10b981' : '#f43f5e'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* 2. CARD: COMPARAÇÃO DE ENTRADAS E SAÍDAS POR CONTA */}
        <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-100/40 border border-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-8 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-cyan-500 rounded-full" /> Movimentação por Conta
            </h3>
            <div className="h-48"> 
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosMovimentacaoPorConta()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: '600'}} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'}} formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]} />
                  <Legend iconType="circle" wrapperStyle={{paddingTop: '5px', fontSize: '11px', fontWeight: '600'}} />
                  <Bar name="Entradas" dataKey="entradas" fill="#10b981" radius={[8, 8, 0, 0]} barSize={15} />
                  <Bar name="Saídas" dataKey="saidas" fill="#f43f5e" radius={[8, 8, 0, 0]} barSize={15} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* --- LINHA 2: VOLUMES GERAIS E OBJETIVOS --- */}

        {/* 3. CARD: VOLUME TOTAL */}
        <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-100/40 border border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 mb-10 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-indigo-600 rounded-full" /> Volume Total
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resumoGeral}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: '600'}} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'}} />
                <Bar dataKey="valor" radius={[12, 12, 12, 12]} barSize={45}>
                  {resumoGeral.map((entry, index) => <Cell key={index} fill={entry.cor} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. CARD: RESUMO DE METAS FINANCEIRAS */}
        <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-100/40 border border-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-10 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-emerald-500 rounded-full" /> Metas Financeiras
            </h3>

            {loadingMetas ? (
              <div className="text-slate-400 animate-pulse font-bold text-sm italic h-64 flex items-center justify-center">
                Carregando suas metas...
              </div>
            ) : metas.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3 text-xl">🎯</div>
                <p className="text-slate-400 font-semibold text-sm">Nenhuma meta cadastrada.</p>
                <p className="text-slate-300 text-xs mt-1">Defina objetivos no painel de metas.</p>
              </div>
            ) : (
              <div className="space-y-6 max-h-64 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                {metas.map((meta) => {
                  const valorAlvo = parseFloat(meta.valor_alvo || 0);
                  const valorPoupado = parseFloat(meta.valor_poupado || 0);
                  const percentual = valorAlvo > 0 ? Math.min(Math.round((valorPoupado / valorAlvo) * 100), 100) : 0;

                  return (
                    <div key={meta.id_meta} className="space-y-2 p-1 rounded-xl hover:bg-slate-50/50 transition-colors">
                      <div className="flex justify-between items-end">
                        <div className="min-w-0 flex-1 pr-2">
                          <h4 className="text-sm font-semibold text-slate-700 truncate">{meta.objetivo}</h4>
                          <p className="text-xs text-slate-400 font-semibold mt-0.5">
                            R$ {valorPoupado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                            <span className="text-slate-200 mx-1">|</span> 
                            R$ {valorAlvo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md whitespace-nowrap">
                          {percentual}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${percentual}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* --- LINHA 3: CATEGORIAS E CONSUMO --- */}

        {/* 5. CARD: ENTRADAS / CATEGORIA */}
        <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-100/40 border border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 mb-10 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full" /> Entradas / Categoria
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dadosEntradas()} innerRadius={65} outerRadius={85} paddingAngle={4} dataKey="value">
                  {dadosEntradas().map((entry, index) => <Cell key={index} fill={['#4f46e5', '#10b981', '#fbbf24', '#f43f5e'][index % 4]} />)}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'}} />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. CARD: GASTOS / CATEGORIA */}
        <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-100/40 border border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 mb-10 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-rose-500 rounded-full" /> Gastos / Categoria
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosSaidas()} layout="vertical" margin={{ left: 30 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: '600'}} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'}} />
                <Bar dataKey="value" fill="#f43f5e" radius={[0, 8, 8, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7. CARD: BALANÇO POR CATEGORIA */}
        <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-100/40 border border-slate-100 lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-800 mb-10 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-amber-500 rounded-full" /> Balanço por Categoria
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosBalanco()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: '600'}} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'}} />
                <Bar dataKey="entradas" fill="#10b981" radius={[6, 6, 0, 0]} barSize={16} />
                <Bar dataKey="saidas" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}