import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import RequireAuth from '@/components/RequireAuth'
import { ConfirmDialogProvider } from '@/components/ConfirmDialogProvider'
import AdminLayout from '@/layouts/AdminLayout'
import PublicLayout from '@/layouts/PublicLayout'
import Home from '@/pages/Home'
import Categoria from '@/pages/Categoria'
import CartaApresentacao from '@/pages/CartaApresentacao'
import Contato from '@/pages/Contato'
import ProjectDetail from '@/pages/ProjectDetail'
import Login from '@/pages/admin/Login'
import Projetos from '@/pages/admin/Projetos'
import ProjetoForm from '@/pages/admin/ProjetoForm'
import Categorias from '@/pages/admin/Categorias'
import Mensagens from '@/pages/admin/Mensagens'
import Configuracoes from '@/pages/admin/Configuracoes'
import Relatorio from '@/pages/Relatorio'

export default function App() {
  return (
    <ConfirmDialogProvider>
      <BrowserRouter>
        <Routes>
          {/* públicas */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/categoria/:slug" element={<Categoria />} />
            <Route path="/carta-de-apresentacao" element={<CartaApresentacao />} />
            <Route path="/contato" element={<Contato />} />
            <Route path="/projeto/:id" element={<ProjectDetail />} />
          </Route>
          <Route path="/admin/login" element={<Login />} />
          <Route path="/relatorio" element={<Relatorio />} />

          {/* autenticadas */}
          <Route element={<RequireAuth />}>
            <Route path="/admin" element={<Navigate to="/admin/projetos" replace />} />
            <Route element={<AdminLayout />}>
              <Route path="/admin/projetos" element={<Projetos />} />
              <Route path="/admin/projetos/novo" element={<ProjetoForm />} />
              <Route path="/admin/projetos/:id" element={<ProjetoForm />} />
              <Route path="/admin/categorias" element={<Categorias />} />
              <Route path="/admin/mensagens" element={<Mensagens />} />
              <Route path="/admin/configuracoes" element={<Configuracoes />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfirmDialogProvider>
  )
}