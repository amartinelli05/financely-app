import './globals.css'
import Link from 'next/link'

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body className="bg-slate-50 min-h-screen flex font-sans antialiased text-slate-900">
        
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen">
          <div className="p-8">
            <h1 className="text-2xl font-black text-indigo-600 tracking-tighter flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg shadow-lg"></div>
              FINANCELY.
            </h1>
          </div>
          
          <nav className="flex-1 px-4 space-y-1">
            <Link href="/" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all group">
              <svg className="w-5 h-5 opacity-60 group-hover:text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
              Início / Lançar
            </Link>
            
            <Link href="/dashboard" className="flex items-center gap-3 p-4 rounded-2xl font-semibold text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all group">
              <svg className="w-5 h-5 opacity-60 group-hover:text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              Dashboard
            </Link>
            
            <Link href="/relatorios" className="flex items-center gap-3 p-4 rounded-2xl font-semibold text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all group">
              <svg className="w-5 h-5 opacity-60 group-hover:text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              Relatórios
            </Link>
          </nav>

          <div className="p-6 text-center">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Chapecó - SC</p>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-8 md:p-12">
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}