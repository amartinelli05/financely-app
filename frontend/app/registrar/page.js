'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// URL Dinâmica para Vercel/Local
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Registrar() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [aceitouTermos, setAceitouTermos] = useState(false) // ADICIONADO: Estado para consentimento LGPD
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e) => {
    e.preventDefault();

    // ADICIONADO: Bloqueio de segurança caso o checkbox não esteja marcado
    if (!aceitouTermos) {
      alert('⚠️ Você precisa declarar ciência sobre o tratamento de dados para continuar.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/registrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha }),
      });

      if (response.ok) {
        alert("Conta criada com sucesso! 🚀");
        router.push('/login');
      } else {
        const erro = await response.json();
        alert("Erro: " + (erro.erro || "Falha ao cadastrar"));
      }
    } catch (error) {
      console.error("Erro na conexão:", error);
      alert("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-white relative overflow-hidden">
      
      <div 
        className="absolute inset-0 z-0 opacity-[0.2] pointer-events-none" 
        style={{ 
          backgroundImage: "url('/financely_fundo.png')", 
          backgroundSize: '800px', 
          backgroundRepeat: 'repeat',
          backgroundPosition: 'center'
        }}
      ></div>

      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-100/40 rounded-full blur-[120px] -z-10"></div>

      <Link href="/" className="absolute top-10 left-10 flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-all z-20 group">
        <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span> Voltar
      </Link>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-10 rounded-[3rem] shadow-2xl shadow-purple-100 border border-purple-50 z-10">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Criar Conta<span className="text-purple-600">.</span></h2>
          <p className="text-slate-400 font-medium mt-2">Comece sua jornada financeira hoje.</p>
        </div>

        <form className="space-y-5" onSubmit={handleRegister}>
          <input 
            type="text" 
            required
            placeholder="Nome completo" 
            className="w-full p-5 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-purple-100 transition-all font-medium text-black"
            onChange={(e) => setNome(e.target.value)}
          />
          <input 
            type="email" 
            required
            placeholder="E-mail" 
            className="w-full p-5 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-purple-100 transition-all font-medium text-black"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            required
            placeholder="Crie uma senha" 
            className="w-full p-5 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-purple-100 transition-all font-medium text-black"
            onChange={(e) => setSenha(e.target.value)}
          />

          {/* ADICIONADO: COMPONENTE DE CHECKBOX DA LGPD INTEGRADO AO VISUAL */}
          <div className="flex items-start gap-3 p-4 bg-slate-50/60 rounded-2xl border border-slate-100/80 mt-2">
            <input 
              type="checkbox" 
              id="lgpd"
              checked={aceitouTermos}
              onChange={(e) => setAceitouTermos(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-purple-600 border-slate-300 focus:ring-purple-500 cursor-pointer accent-purple-600"
              required
            />
            <label htmlFor="lgpd" className="text-[11px] font-semibold text-slate-500 leading-tight cursor-pointer select-none">
              Estou ciente e concordo com a coleta e tratamento dos meus dados cadastrais e movimentações financeiras conforme estabelecido no{' '}
              <Link href="/privacidade" className="text-purple-600 underline font-black hover:text-purple-700">
                Aviso de privacidade
              </Link>.
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-[2rem] font-bold shadow-xl shadow-purple-100 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Processando...' : 'Finalizar Cadastro'}
          </button>
        </form>

        <p className="text-center mt-8 text-slate-400 font-medium">
          Já possui conta? <Link href="/login" className="text-purple-600 font-black hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  )
}