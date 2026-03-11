'use client'
import './globals.css'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function RootLayout({ children }) {
  const pathname = usePathname()
  const [estaLogado, setEstaLogado] = useState(false)

  // Páginas que NÃO devem ter a sidebar lateral
  const semSidebar = ['/', '/login', '/registrar'].includes(pathname)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setEstaLogado(!!token)
  }, [pathname])

  return (
    <html lang="pt-br">
      <body className="bg-slate-100/80 min-h-screen flex font-sans antialiased text-slate-900">
        
        {/* Sidebar: Só aparece se NÃO for página de auth e se estiver logado */}
        {!semSidebar && (
          <aside className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen shadow-sm">
            <div className="p-8">
              <h1 className="text-2xl font-black text-indigo-600 tracking-tighter italic">FINANCELY.</h1>
            </div>
            
            <nav className="flex-1 px-4 space-y-2">
              <Link href="/dashboard" className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${pathname === '/dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                📊 Relatórios
              </Link>
              <Link href="/lancamentos" className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${pathname === '/lancamentos' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                💸 Lançamentos
              </Link>
              <Link href="/perfil" className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${pathname === '/perfil' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                👤 Meu Perfil
              </Link>
            </nav>

            <div className="p-6">
               <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} 
                 className="w-full p-4 text-[10px] font-black text-red-400 hover:bg-red-50 rounded-2xl transition-all tracking-widest uppercase">
                 Sair do App
               </button>
            </div>
          </aside>
        )}

        <main className="flex-1 overflow-y-auto">
          {/* Se estiver no dashboard ou lançamentos, usa o padding. Se for login, ocupa tudo. */}
          <div className={semSidebar ? "w-full min-h-screen" : "max-w-7xl mx-auto p-8 md:p-12"}>
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}