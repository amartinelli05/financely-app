'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// URL Dinâmica para Vercel/Local
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setErro('')
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim(), 
          senha: senha.trim() 
        })
      })

      const data = await res.json()

      if (res.ok) {
        // Gravação na Session/Local Storage original
        localStorage.setItem('token', data.token)
        localStorage.setItem('usuarioId', data.id_usuario)
        localStorage.setItem('usuarioNome', data.nome)
        localStorage.setItem('usuarioEmail', email.trim()) 
        
        // ADICIONADO: Salva o token nos Cookies (Exigência do Middleware do Next.js)
        // Definido para expirar em 24h (86400 segundos) combinando com o tempo do seu JWT
        document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Strict`;

        router.push('/dashboard')
      } else {
        setErro(data.erro || "E-mail ou senha incorretos.")
      }
    } catch (err) {
      setErro("Erro ao conectar com o servidor.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-white relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-[0.2] pointer-events-none" 
        style={{ backgroundImage: "url('/financely_fundo.png')", backgroundSize: '800px', backgroundRepeat: 'repeat', backgroundPosition: 'center' }}></div>
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-100/40 rounded-full blur-[120px] -z-10"></div>

      <Link href="/" className="absolute top-10 left-10 flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-all z-20 group">
        <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span> Voltar
      </Link>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-10 rounded-[3rem] shadow-2xl shadow-indigo-100 border border-indigo-50 z-10">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Login<span className="text-indigo-600">.</span></h2>
          <p className="text-slate-400 font-medium mt-2 italic">Que bom ver você de volta!</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <input 
            type="email" 
            placeholder="Seu e-mail" 
            required 
            className="w-full p-5 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-black"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <input 
            type="password" 
            placeholder="Sua senha" 
            required 
            className="w-full p-5 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-black"
            value={senha} 
            onChange={(e) => setSenha(e.target.value)} 
          />
          
          {erro && <p className="text-red-500 text-center text-xs font-bold animate-shake">{erro}</p>}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[2rem] font-black tracking-widest shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase disabled:opacity-50"
          >
            {loading ? 'Autenticando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center mt-8 text-slate-400 font-medium">
          Ainda não tem conta? <Link href="/registrar" className="text-indigo-600 font-black hover:underline">Cadastre-se</Link>
        </p>
      </div>
    </div>
  )
}