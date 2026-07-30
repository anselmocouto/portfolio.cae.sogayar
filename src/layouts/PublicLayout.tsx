import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { publicUrl } from '@/lib/uploads'
import '@/styles/public.css'

export type Category = {
  id: string
  name: string
  slug: string
  color: string
  sort_order: number
}

export type Perfil = {
  full_name: string
  headline: string
  bio: string
  personal_statement: string | null
  photo_path: string | null
  banner_path: string | null
  email: string | null
  city: string | null
  social_links: Record<string, string>
}

export type PublicContext = {
  categorias: Category[]
  perfil: Perfil | null
}

function navClass({ isActive }: { isActive: boolean }) {
  return `pc-link${isActive ? ' is-active' : ''}`
}

export default function PublicLayout() {
  const [categorias, setCategorias] = useState<Category[]>([])
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: cats }, { data: settings }] = await Promise.all([
        supabase.from('categories').select('id, name, slug, color, sort_order').order('sort_order'),
        supabase
          .from('site_settings')
          .select(
            'full_name, headline, bio, personal_statement, photo_path, banner_path, email, city, social_links'
          )
          .eq('id', 1)
          .single(),
      ])
      setCategorias(cats ?? [])
      setPerfil(settings ?? null)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (perfil?.full_name) document.title = `${perfil.full_name} — Portfólio`
  }, [perfil])

  if (loading) {
    return (
      <div className="pc-root" style={{ padding: 64, textAlign: 'center', color: 'var(--muted)' }}>
        Carregando…
      </div>
    )
  }

  return (
    <div className="pc-root">
      <nav className="pc-nav">
        <div className="pc-nav-inner">
          <NavLink to="/" end className="pc-logo">
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 11.5 12 4l9 7.5" />
              <path d="M5.5 10v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9" />
              <path d="M9.5 20v-6a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v6" />
            </svg>
            Portfólio
          </NavLink>
          <div className="pc-links">
            <NavLink to="/carta-de-apresentacao" className={navClass}>
              Carta de Apresentação
            </NavLink>
            {categorias.map((cat) => (
              <NavLink key={cat.id} to={`/categoria/${cat.slug}`} className={navClass}>
                {cat.name}
              </NavLink>
            ))}
            <NavLink to="/contato" className={navClass}>
              Contato
            </NavLink>
             <a href="/relatorio" target="_blank" rel="noopener" className="pc-link pc-link-pdf">
              Baixar PDF
            </a>
            </div>
        </div>
      </nav>

      <div className="pc-main">
        {perfil?.banner_path && (
          <img
            className="pc-banner"
            src={publicUrl('public-assets', perfil.banner_path) ?? undefined}
            alt=""
          />
        )}

        <Outlet context={{ categorias, perfil } satisfies PublicContext} />
      </div>

      <footer className="pc-footer">
        <span>
          © {new Date().getFullYear()} {perfil?.full_name ?? ''} · Portfólio de Jornalismo
        </span>
        <Link to="/admin/login" className="pc-admin-link" aria-label="Área administrativa">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="5" y="11" width="14" height="9" rx="1.5" />
            <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
          </svg>
        </Link>
      </footer>
    </div>
  )
}
