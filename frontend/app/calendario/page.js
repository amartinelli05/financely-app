'use client'
import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function CalendarioFinanceiro() {
  const [lancamentos, setLancamentos] = useState([])
  const [dataFoco, setDataFoco] = useState(new Date()) // Mês e ano atual exibido
  const [diaSelecionado, setDiaSelecionado] = useState(null)

  // Nomes auxiliares para renderização
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const carregarDadosCalendario = async () => {
    const idUsuario = localStorage.getItem('usuarioId');
    if (!idUsuario) return;
    try {
      const res = await fetch(`${API_URL}/api/calendario-previsto?id_usuario=${idUsuario}`)
      if (res.ok) {
        const dados = await res.json()
        setLancamentos(dados)
      }
    } catch (err) {
      console.error("Erro ao carregar calendário:", err)
    }
  }

  useEffect(() => {
    carregarDadosCalendario()
  }, [])

  // --- LÓGICA DE GERAÇÃO DO CALENDÁRIO ---
  const ano = dataFoco.getFullYear()
  const mes = dataFoco.getMonth()

  // Primeiro dia do mês (descobrir em qual dia da semana cai: 0 a 6)
  const primeiroDiaDoMes = new Date(ano, mes, 1).getDay()
  // Quantidade total de dias no mês atual
  const totalDiasNoMes = new Date(ano, mes + 1, 0).getDate()

  // Cria o array com os "cards" vazios antes do dia 1º e preenche com os dias reais
  const matrizCalendario = []
  for (let i = 0; i < primeiroDiaDoMes; i++) {
    matrizCalendario.push(null) // Espaços vazios no início do mês
  }
  for (let dia = 1; dia <= totalDiasNoMes; dia++) {
    matrizCalendario.push(dia)
  }

  // Navegação entre meses
  const alterarMes = (direcao) => {
    setDataFoco(new Date(ano, mes + direcao, 1))
    setDiaSelecionado(null)
  }

  // Filtra lançamentos de um dia específico do calendário
  const obterLancamentosDoDia = (dia) => {
    if (!dia) return []
    // Formata o dia atual do loop para bater com o padrão YYYY-MM-DD do backend
    const stringMes = String(mes + 1).padStart(2, '0')
    const stringDia = String(dia).padStart(2, '0')
    const dataChave = `${ano}-${stringMes}-${stringDia}`
    
    return lancamentos.filter(l => l.data_formatada === dataChave)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-black pb-20 p-4">
      
      {/* CABEÇALHO */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-100/40 border border-slate-100 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Fluxo de Calendário</h2>
          <p className="text-slate-400 text-sm font-medium">Previsão e planejamento de movimentações futuras.</p>
        </div>
        
        {/* CONTROLES DE NAVEGAÇÃO DO MÊS */}
        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <button onClick={() => alterarMes(-1)} className="p-3 hover:bg-white rounded-xl transition-all font-bold text-slate-600 shadow-sm shadow-transparent hover:shadow-slate-100">&lt;</button>
          <span className="font-black text-sm text-slate-700 min-w-[120px] text-center uppercase tracking-wider">
            {meses[mes]} {ano}
          </span>
          <button onClick={() => alterarMes(1)} className="p-3 hover:bg-white rounded-xl transition-all font-bold text-slate-600 shadow-sm shadow-transparent hover:shadow-slate-100">&gt;</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* GRID DO CALENDÁRIO */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
          
          {/* DIAS DA SEMANA */}
          <div className="grid grid-cols-7 text-center">
            {diasDaSemana.map(d => (
              <span key={d} className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">{d}</span>
            ))}
          </div>

          {/* MATRIZ DE DIAS */}
          <div className="grid grid-cols-7 gap-2">
            {matrizCalendario.map((dia, index) => {
              const itensDoDia = obterLancamentosDoDia(dia)
              const temEntrada = itensDoDia.some(i => i.tipo_movimento === 'Entrada')
              const temSaida = itensDoDia.some(i => i.tipo_movimento === 'Saída')
              
              if (!dia) {
                return <div key={`vazio-${index}`} className="aspect-square bg-slate-50/40 rounded-2xl border border-dashed border-slate-100/60" />
              }

              return (
                <button
                  key={`dia-${dia}`}
                  onClick={() => setDiaSelecionado(dia)}
                  className={`aspect-square p-3 rounded-2xl border flex flex-col justify-between transition-all relative ${
                    diaSelecionado === dia 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                      : 'bg-slate-50 hover:bg-slate-100/80 border-slate-100 text-slate-700'
                  }`}
                >
                  <span className="font-black text-sm">{String(dia).padStart(2, '0')}</span>
                  
                  {/* INDICADORES VISUAIS DE ENTRADA / SAÍDA */}
                  {itensDoDia.length > 0 && (
                    <div className="flex gap-1 items-center mt-auto w-full justify-end">
                      {temEntrada && (
                        <span className={`w-2 h-2 rounded-full ${diaSelecionado === dia ? 'bg-white' : 'bg-emerald-500'}`} />
                      )}
                      {temSaida && (
                        <span className={`w-2 h-2 rounded-full ${diaSelecionado === dia ? 'bg-white' : 'bg-rose-500'}`} />
                      )}
                      <span className={`text-[9px] font-bold hidden md:inline ml-1 ${diaSelecionado === dia ? 'text-indigo-200' : 'text-slate-400'}`}>
                        ({itensDoDia.length})
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* BARRA LATERAL: DETALHES DO DIA SELECIONADO */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-fit space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Lançamentos do Dia</h3>
            <p className="text-slate-400 text-xs font-medium">
              {diaSelecionado ? `${String(diaSelecionado).padStart(2, '0')} de ${meses[mes]} de ${ano}` : 'Selecione um dia para inspecionar'}
            </p>
          </div>

          <div className="space-y-3">
            {!diaSelecionado ? (
              <div className="text-center py-10 text-slate-300 font-semibold text-sm border border-dashed border-slate-100 rounded-2xl">
                🎯 Clique em um dia com movimentações para ver os detalhes.
              </div>
            ) : obterLancamentosDoDia(diaSelecionado).length === 0 ? (
              <div className="text-center py-10 text-slate-400 font-semibold text-xs bg-slate-50 rounded-2xl">
                🌴 Nenhum lançamento previsto para este dia.
              </div>
            ) : (
              obterLancamentosDoDia(diaSelecionado).map(item => (
                <div key={item.id_transacao} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center">
                  <div className="max-w-[65%]">
                    <h4 className="font-bold text-slate-800 text-sm truncate">{item.descricao}</h4>
                    <span className={`text-[9px] font-black uppercase tracking-wider ${item.tipo_movimento === 'Entrada' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {item.tipo_movimento}
                    </span>
                  </div>
                  <p className={`font-black text-sm whitespace-nowrap ${item.tipo_movimento === 'Entrada' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {item.tipo_movimento === 'Entrada' ? '+' : '-'} R$ {Math.abs(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}