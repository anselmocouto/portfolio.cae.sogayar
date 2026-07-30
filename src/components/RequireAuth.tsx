// src/components/RequireAuth.tsx
// Protege as rotas /admin/*: sem sessão → redireciona para /admin/login.
// Escuta onAuthStateChange para reagir a logout/expiração em tempo real.

import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export default function RequireAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCarregando(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (carregando) {
    return (
      <p style={{ fontFamily: "Inter, sans-serif", padding: 40, color: "#6B7280" }}>
        Verificando sessão…
      </p>
    );
  }

  if (!session) {
    // Guarda a rota de origem para voltar após o login
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}