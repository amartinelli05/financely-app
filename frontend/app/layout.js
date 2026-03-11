import './globals.css'
import Link from 'next/link' // Importando a navegação veloz do Next

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
            {/* Trocamos <a> por <Link> para navegação profissional */}
            <Link href="/" className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
              🏠 Início / Lançar
            </Link>
            
            <Link href="/dashboard" className="flex items-center gap-3 p-4 rounded-2xl font-semibold text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all">
              📊 Dashboard
            </Link>
            
            <Link href="/relatorios" className="flex items-center gap-3 p-4 rounded-2xl font-semibold text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all">
              📄 Relatórios
            </Link>
          </nav>

          <div className="p-6">
            <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-100">
              <p className="text-[10px] font-bold opacity-70 mb-1 uppercase">Dica ABEX</p>
              <p className="text-sm font-medium">Economize hoje para viajar no fim do semestre! ✈️</p>
            </div>
          </div>
        </aside>

        {/* Área do Conteúdo */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-8 md:p-12">
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}