'use client'
import './globals.css'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function RootLayout({ children }) {
  const pathname = usePathname()
  const [estaLogado, setEstaLogado] = useState(false)

  // Páginas que não devem mostrar a barra lateral
  const semSidebar = ['/', '/login', '/registrar'].includes(pathname)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setEstaLogado(!!token)
  }, [pathname])

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/'; 
  }

  return (
    <html lang="pt-br">
      <body className="bg-[#F8F9FA] min-h-screen flex font-sans antialiased text-slate-900 relative">
        
        {/* Fundo com marca d'água */}
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
            
            {/* TÍTULO COM SÍMBOLO DE GRÁFICO */}
            <div className="p-8 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm border border-indigo-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                    <polyline points="16 7 22 7 22 13"/>
                  </svg>
                </div>
                <h1 className="text-2xl font-black text-[#4f46e5] tracking-tight">
                  Financely<span className="text-indigo-400">.</span>
                </h1>
              </div>
            </div>
            
            <nav className="flex-1 px-6 space-y-2 flex flex-col">
              <Link href="/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${pathname === '/dashboard' ? 'bg-[#4f46e5] text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-[#4f46e5] hover:bg-slate-50'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="15" rx="1"/></svg>
                Dashboard
              </Link>
              
              <Link href="/lancamentos" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${pathname === '/lancamentos' ? 'bg-[#4f46e5] text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-[#4f46e5] hover:bg-slate-50'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5V6.5"/></svg>
                Lançamentos
              </Link>

              <Link href="/relatorios" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${pathname === '/relatorios' ? 'bg-[#4f46e5] text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-[#4f46e5] hover:bg-slate-50'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
                Relatórios
              </Link>
              
              <Link href="/metas" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${pathname === '/metas' ? 'bg-[#4f46e5] text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-[#4f46e5] hover:bg-slate-50'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                Metas
              </Link>

              <Link href="/perfil" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${pathname === '/perfil' ? 'bg-[#4f46e5] text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-[#4f46e5] hover:bg-slate-50'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Meu Perfil
              </Link>
              <Link href="/contas" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${pathname === '/contas' ? 'bg-[#4f46e5] text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-[#4f46e5] hover:bg-slate-50'}`}>
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="5" rx="2"/>
    <line x1="2" x2="22" y1="10" y2="10"/>
  </svg>
  Minhas Contas
</Link>

              {/* AVALIAR SISTEMA */}
              <a 
                href="https://forms.gle/A9uGyFpScvTkCpfu5" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 mt-4 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-semibold"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/></svg>
                Avaliar Sistema
              </a>
            </nav>

            <div className="p-6 border-t border-slate-50">
               <button onClick={handleLogout} 
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