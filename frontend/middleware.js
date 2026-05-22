import { NextResponse } from 'next/server'

export function middleware(request) {
  // Coleta o token dos cookies (é a forma que o Middleware do Next.js consegue ler no lado do servidor)
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  // Rotas que qualquer pessoa pode acessar sem estar logada
  const rotasPublicas = ['/', '/login', '/registrar', '/privacidade']

  // 1. Se o usuário NÃO tem token e está tentando acessar uma rota protegida (dashboard, despesas, etc.)
  if (!token && !rotasPublicas.includes(pathname)) {
    // Redireciona imediatamente para a tela de login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. Se o usuário JÁ está logado e tenta ir para login, registrar ou a landing page, manda direto pro Dashboard
  if (token && (pathname === '/login' || pathname === '/registrar' || pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// Configura em quais rotas o Middleware vai rodar
export const config = {
  matcher: [
    /*
     * Ignora:
     * - api: rotas internas de API (se houver)
     * - _next/static e _next/image: arquivos internos de compilação do Next.js
     * - favicon.ico, sitemap.xml, robots.txt: arquivos de indexação
     * - Qualquer arquivo com extensão estática na pasta public (png, svg, jpg, jpeg, gif, webp)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.+\\.(?:png|svg|jpg|jpeg|gif|webp)$).*)',
  ],
}