'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function Registrar() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-white relative overflow-hidden">
      
      {/* 🖼️ FUNDO MARCA D'ÁGUA */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.2] pointer-events-none" 
        style={{ 
          backgroundImage: "url('/financely_fundo.png')", 
          backgroundSize: '800px', 
          backgroundRepeat: 'repeat',
          backgroundPosition: 'center'
        }}
      ></div>

      {/* ✨ BLURS DE COR */}
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-100/40 rounded-full blur-[120px] -z-10"></div>

      {/* ⬅️ BOTÃO VOLTAR */}
      <Link href="/" className="absolute top-10 left-10 flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-all z-20 group">
        <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span> Voltar
      </Link>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-10 rounded-[3rem] shadow-2xl shadow-purple-100 border border-purple-50 z-10">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Criar Conta<span className="text-purple-600">.</span></h2>
          <p className="text-slate-400 font-medium mt-2">Comece sua jornada financeira hoje.</p>
        </div>

        <form className="space-y-5">
          <input 
            type="text" 
            placeholder="Nome completo" 
            className="w-full p-5 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-purple-100 transition-all font-medium"
            onChange={(e) => setNome(e.target.value)}
          />
          <input 
            type="email" 
            placeholder="E-mail" 
            className="w-full p-5 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-purple-100 transition-all font-medium"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Crie uma senha" 
            className="w-full p-5 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-purple-100 transition-all font-medium"
            onChange={(e) => setSenha(e.target.value)}
          />
          <button className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-[2rem] font-bold shadow-xl shadow-purple-100 hover:scale-[1.02] transition-all">
            Finalizar Cadastro
          </button>
        </form>

        <p className="text-center mt-8 text-slate-400 font-medium">
          Já possui conta? <Link href="/login" className="text-purple-600 font-black hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  )
}