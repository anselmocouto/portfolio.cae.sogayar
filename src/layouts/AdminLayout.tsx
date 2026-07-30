import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import '@/styles/admin.css'

const links = [
  { to: '/admin/projetos', label: 'Projetos', icon: '▤' },
  { to: '/admin/categorias', label: 'Categorias', icon: '◧' },
  { to: '/admin/mensagens', label: 'Mensagens', icon: '✉' },
  { to: '/admin/configuracoes', label: 'Configurações', icon: '⚙' },
]

export type AdminContext = {
  refreshNaoLidas: () => void
}

export default function AdminLayout() {
  const [email, setEmail] = useState<string | null>(null)
  const [naoLidas, setNaoLidas] = useState(0)
  const location = useLocation()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

  async function refreshNaoLidas() {
    const { count } = await supabase
      .from('contact_messages')
      .select('id', { count: 'exact', head: true })
      .eq('read', false)
    setNaoLidas(count ?? 0)
  }

  useEffect(() => {
    refreshNaoLidas()
  }, [location.pathname])

  return (
    <div className="ad-root">
      <aside className="ad-side">
        <div className="ad-brand">
          Portfólio
          <small>Painel do editor</small>
        </div>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => `ad-item${isActive ? ' is-active' : ''}`}
          >
            <span aria-hidden="true">{l.icon}</span>
            <span className="lbl">
              {l.label}
              {l.to === '/admin/mensagens' && naoLidas > 0 ? ` (${naoLidas})` : ''}
            </span>
          </NavLink>
        ))}
        <div className="ad-pdf-box">
          <span className="ad-pdf-titulo">Relatório PDF</span>
          <button
            type="button"
            className="ad-pdf"
            onClick={() => window.open('/relatorio', '_blank')}
            title="Versão oficial: apenas projetos publicados"
          >
            Gerar portfólio
          </button>
          <button
            type="button"
            className="ad-pdf ad-pdf-ghost"
            onClick={() => window.open('/relatorio?rascunhos=1', '_blank')}
            title="Versão de trabalho: inclui rascunhos marcados"
          >
            + rascunhos
          </button>
        </div>
        <div className="ad-side-foot">
          {email ?? '—'}
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="ad-mini"
            style={{ marginTop: 8, width: '100%' }}
          >
            Sair
          </button>
        </div>
      </aside>
      <main className="ad-main">
        <Outlet context={{ refreshNaoLidas } satisfies AdminContext} />
      </main>
    </div>
  )
}
