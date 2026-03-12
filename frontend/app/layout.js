'use client'
import './globals.css'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function RootLayout({ children }) {
  const pathname = usePathname()
  const [estaLogado, setEstaLogado] = useState(false)

  const semSidebar = ['/', '/login', '/registrar'].includes(pathname)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setEstaLogado(!!token)
  }, [pathname])

  return (
    <html lang="pt-br">
      <body className="bg-[#F8F9FA] min-h-screen flex font-sans antialiased text-slate-900 relative">
        
        {!semSidebar && (
          <div 
            className="fixed inset-0 z-[-1] pointer-events-none opacity-[0.2] grayscale"
            style={{ 
              backgroundImage: "url('/financely_fundo.png')",
              backgroundRepeat: 'repeat',
              backgroundPosition: 'center',
            }}
          />
        )}
        
        {!semSidebar && (
          <aside className="w-72 bg-white border-r border-slate-100 hidden md:flex flex-col sticky top-0 h-screen z-10">
            <div className="p-8 mb-4">
              <h1 className="text-2xl font-bold text-[#4f46e5] tracking-tight">
                Financely<span className="text-indigo-400">.</span>
              </h1>
            </div>
            
            <nav className="flex-1 px-6 space-y-2">
              <Link href="/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${pathname === '/dashboard' ? 'bg-[#4f46e5] text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-[#4f46e5] hover:bg-slate-50'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="15" rx="1"/></svg>
                Dashboard
              </Link>
              
              <Link href="/lancamentos" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${pathname === '/lancamentos' ? 'bg-[#4f46e5] text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-[#4f46e5] hover:bg-slate-50'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5V6.5"/></svg>
                Lançamentos
              </Link>

              {/* AJUSTE AQUI: Mudamos a condição para verificar '/relatorios' e trocamos o ícone */}
              <Link href="/relatorios" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${pathname === '/relatorios' ? 'bg-[#4f46e5] text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-[#4f46e5] hover:bg-slate-50'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
                Relatórios
              </Link>
              
              <Link href="/perfil" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${pathname === '/perfil' ? 'bg-[#4f46e5] text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-[#4f46e5] hover:bg-slate-50'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Meu Perfil
              </Link>
            </nav>

            <div className="p-6 border-t border-slate-50">
               <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} 
                 className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all">
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                 Sair do App
               </button>
            </div>
          </aside>
        )}

        <main className="flex-1 overflow-y-auto z-10">
          <div className={semSidebar ? "w-full min-h-screen" : "max-w-7xl mx-auto p-8 md:p-12"}>
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}