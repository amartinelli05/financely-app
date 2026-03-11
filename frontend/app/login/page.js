'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setErro('')

    try {
      const res = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim(), 
          senha: senha.trim() 
        })
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('usuarioNome', data.nome)
        router.push('/dashboard')
      } else {
        setErro(data.erro || "E-mail ou senha incorretos.")
      }
    } catch (err) {
      setErro("Erro ao conectar com o servidor.")
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-white relative overflow-hidden">
      
      {/* 🖼️ MESMO FUNDO DA HOME */}
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
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-100/40 rounded-full blur-[120px] -z-10"></div>

      {/* ⬅️ BOTÃO VOLTAR */}
      <Link href="/" className="absolute top-10 left-10 flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-all z-20 group">
        <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span> Voltar
      </Link>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-10 rounded-[3rem] shadow-2xl shadow-indigo-100 border border-indigo-50 z-10">
        <div className="text-center mb-10">
<h2 className="text-4xl font-black text-slate-800 tracking-tighter">Login<span className="text-indigo-600">.</span></h2>          <p className="text-slate-400 font-medium mt-2 italic">Que bom ver você de volta!</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <input 
            type="email" 
            placeholder="Seu e-mail" 
            required
            className="w-full p-5 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Sua senha" 
            required
            className="w-full p-5 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          {erro && <p className="text-red-500 text-center text-xs font-bold">{erro}</p>}

          <button 
            type="submit"
            className="w-full py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[2rem] font-black tracking-widest shadow-xl shadow-indigo-100 hover:scale-[1.02] transition-all uppercase"
          >
            Entrar
          </button>
        </form>

        <p className="text-center mt-8 text-slate-400 font-medium">
          Ainda não tem conta? <Link href="/registrar" className="text-indigo-600 font-black hover:underline">Cadastre-se</Link>
        </p>
      </div>
    </div>
  )
}