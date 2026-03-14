'use client'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center text-center p-6 bg-white relative overflow-hidden">
      
      {/* 🖼️ FUNDO COM MARCA D'ÁGUA */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.25] pointer-events-none"
        style={{ 
          backgroundImage: "url('/financely_fundo.png')", 
          backgroundSize: '1000px',
          backgroundRepeat: 'repeat',
          backgroundPosition: 'center'
        }}
      ></div>

      {/* ✨ EFEITOS VISUAIS DE FUNDO */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-200/30 rounded-full blur-[120px] -z-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-100/30 rounded-full blur-[100px] -z-10"></div>
      
      <div className="max-w-3xl space-y-10 z-10">
        <div className="inline-block bg-white/90 backdrop-blur-md text-indigo-700 px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-widest shadow-md border border-indigo-100">
          Gerenciamento Inteligente para {new Date().getFullYear()}
        </div>
        
        <h1 className="text-7xl md:text-9xl font-black text-slate-800 tracking-tighter leading-none drop-shadow-sm">
          Financely<span className="text-indigo-600">.</span>
        </h1>
        
        <p className="text-slate-600 text-xl font-semibold max-w-lg mx-auto leading-relaxed">
          Simplicidade na gestão, clareza nos resultados.
          O controle total do seu dinheiro com design minimalista.
        </p>
        
        <div className="flex flex-col md:flex-row gap-5 justify-center pt-4">
          <Link href="/registrar" className="px-12 py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[2.5rem] font-bold shadow-2xl shadow-indigo-200 hover:scale-105 transition-all text-lg">
            Começar Agora
          </Link>
          <Link href="/login" className="px-12 py-6 bg-white text-slate-700 rounded-[2.5rem] font-bold border-2 border-slate-100 shadow-lg hover:bg-slate-50 transition-all text-lg">
            Acessar Minha Conta
          </Link>
        </div>
      </div>

      {/* Rodapé Simples */}
      <footer className="absolute bottom-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
        Desenvolvido por Amanda Martinelli e Michelli Riffel
      </footer>
    </div>
  )
}