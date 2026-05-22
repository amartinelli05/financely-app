'use client'
import Link from 'next/link'

export default function Privacidade() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-white relative overflow-hidden text-black">
      
      {/* Linhas de Fundo do Financely */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.2] pointer-events-none" 
        style={{ 
          backgroundImage: "url('/financely_fundo.png')", 
          backgroundSize: '800px', 
          backgroundRepeat: 'repeat',
          backgroundPosition: 'center'
        }}
      ></div>

      {/* Efeito de Blur Roxo/Índigo no Fundo */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-100/40 rounded-full blur-[120px] -z-10"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-100/30 rounded-full blur-[120px] -z-10"></div>

      {/* Botão Superior para Voltar */}
      <Link href="/registrar" className="absolute top-10 left-10 flex items-center gap-2 text-slate-400 hover:text-purple-600 font-bold transition-all z-20 group">
        <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span> Voltar para o Cadastro
      </Link>

      {/* Container Principal do Aviso */}
      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-xl p-10 md:p-12 rounded-[3rem] shadow-2xl shadow-purple-100 border border-purple-50 z-10 space-y-8 my-16">
        
        {/* Cabeçalho do Card */}
        <div className="text-center md:text-left">
          <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest bg-purple-50 px-3 py-1.5 rounded-md">
            Conformidade LGPD
          </span>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter mt-4">
            Aviso de Privacidade<span className="text-purple-600">.</span>
          </h2>
          <p className="text-slate-400 font-medium text-sm mt-1">
            Transparência e segurança sobre como cuidamos das suas informações pessoais e financeiras.
          </p>
        </div>

        <hr className="border-slate-100" />

        {/* Corpo do Conteúdo */}
        <div className="space-y-6 text-sm text-slate-600 leading-relaxed max-h-[50vh] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-purple-100 [&::-webkit-scrollbar-thumb]:rounded-full">
          
          <section className="space-y-2">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <span className="w-1.5 h-4 bg-purple-600 rounded-full" /> 1. Quais dados são coletados?
            </h3>
            <p className="pl-3.5 text-slate-500 font-medium text-xs">
              Para fornecer a experiência completa de controle de caixa e planejamento, coletamos apenas as seguintes informações fornecidas voluntariamente por você:
            </p>
            <ul className="list-disc pl-8 space-y-1 text-xs font-semibold text-slate-500">
              <li><span className="text-slate-700">Dados de Cadastro:</span> Nome completo e endereço de e-mail.</li>
              <li><span className="text-slate-700">Dados Financeiros:</span> Contas cadastradas, lançamentos de receitas e despesas, e as metas de objetivos declaradas na plataforma.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <span className="w-1.5 h-4 bg-indigo-600 rounded-full" /> 2. Qual a finalidade do tratamento de dados?
            </h3>
            <p className="pl-3.5 text-slate-500 font-medium text-xs">
              O tratamento dessas informações tem propósitos puramente operacionais e analíticos dentro da sua própria conta. Usamos esses dados exclusivamente para consolidar os gráficos do seu Dashboard, alimentar o histórico dos seus Relatórios e calcular de forma automatizada o cronograma de projeções futuras do seu Calendário Financeiro. Não compartilhamos nem vendemos dados a terceiros.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full" /> 3. Segurança e Proteção Criptográfica
            </h3>
            <p className="pl-3.5 text-slate-500 font-medium text-xs">
              Seguindo os critérios rigorosos de segurança da informação, dados críticos de autenticação (sua senha de acesso) **nunca** são guardados em texto limpo. Eles passam obrigatoriamente por um algoritmo de hashing criptográfico seguro (<span className="font-mono text-purple-600 bg-purple-50 px-1 rounded">bcrypt</span>) antes de serem armazenados no banco de dados, tornando impossível a sua reversão ou leitura direta.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <span className="w-1.5 h-4 bg-cyan-500 rounded-full" /> 4. Direitos e Controle do Usuário
            </h3>
            <p className="pl-3.5 text-slate-500 font-medium text-xs">
              Como titular dos dados sob a LGPD, você mantém total autonomia sobre o seu perfil. O acesso às suas transações é estritamente isolado por meio de tokens autenticados (<span className="font-mono text-indigo-600 bg-indigo-50 px-1 rounded">JWT</span>). Você tem o direito garantido de visualizar, editar, corrigir ou excluir definitivamente sua conta e todo o seu histórico financeiro do nosso banco de dados a qualquer momento.
            </p>
          </section>
        </div>

        <hr className="border-slate-100" />

        {/* Rodapé do Card */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-2">
          <p className="text-[10px] font-bold text-slate-400 text-center sm:text-left">
            Este aviso reflete o compromisso com a transparência e conformidade com a Lei nº 13.709/2018 (LGPD).
          </p>
          <Link 
            href="/registrar" 
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-xs shadow-md shadow-purple-100 hover:scale-[1.03] active:scale-[0.98] transition-all text-center whitespace-nowrap"
          >
            Entendi, ir para o Cadastro
          </Link>
        </div>

      </div>
    </div>
  )
}