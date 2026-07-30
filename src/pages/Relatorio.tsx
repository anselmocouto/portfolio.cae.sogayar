// src/pages/Relatorio.tsx
// Rota: /relatorio  (abrir em nova aba; dispara o diálogo de impressão → Salvar como PDF)
// Padrão window.print() , com CSS @media print dedicado.

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Settings = {
  full_name: string;
  headline: string;
  bio: string;
  city: string | null;
  email: string | null;
  photo_path: string | null;
  personal_statement: string | null;
};

type Categoria = { id: string; name: string; color: string; sort_order: number };

type Projeto = {
  id: string;
  title: string;
  summary: string | null;
  outlet: string | null;
  external_url: string | null;
  published_at: string | null;
  featured: boolean;
  status: "draft" | "published";
  cover_path: string | null;
  category_id: string | null;
};

const fmtData = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
        new Date(iso + "T12:00:00") // meio-dia evita shift de timezone em date puro
      )
    : "";

export default function Relatorio() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [comRascunhos, setComRascunhos] = useState(false);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    (async () => {
      // ?rascunhos=1 só surte efeito com sessão ativa.
      // (Mesmo sem essa checagem, a RLS bloquearia rascunhos para anon —
      // aqui é só para o relatório se comportar de forma previsível.)
      const querRascunhos =
        new URLSearchParams(window.location.search).get("rascunhos") === "1";
      const { data: auth } = await supabase.auth.getSession();
      const incluirRascunhos = querRascunhos && !!auth.session;
      setComRascunhos(incluirRascunhos);

      let qProjetos = supabase
        .from("projects")
        .select("*")
        .order("featured", { ascending: false })
        .order("published_at", { ascending: false });
      if (!incluirRascunhos) qProjetos = qProjetos.eq("status", "published");

      const [s, c, p] = await Promise.all([
        supabase.from("site_settings").select("*").eq("id", 1).single(),
        supabase.from("categories").select("*").order("sort_order"),
        qProjetos,
      ]);
      if (s.data) setSettings(s.data as Settings);
      setCategorias((c.data as Categoria[]) ?? []);
      setProjetos((p.data as Projeto[]) ?? []);
      setPronto(true);
    })();
  }, []);

  // Dispara a impressão depois que dados E todas as imagens carregaram
  useEffect(() => {
    if (!pronto) return;
    let cancelado = false;

    const esperarImagens = async () => {
      const imgs = Array.from(document.images);
      await Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((res) => {
                img.onload = () => res();
                img.onerror = () => res(); // imagem quebrada não trava o PDF
              })
        )
      );
      if (!cancelado) window.print();
    };

    // Fallback: imprime mesmo se alguma imagem demorar demais
    const limite = setTimeout(() => !cancelado && window.print(), 8000);
    esperarImagens().then(() => clearTimeout(limite));

    return () => {
      cancelado = true;
      clearTimeout(limite);
    };
  }, [pronto]);

  if (!pronto || !settings) {
    return <p style={{ fontFamily: "Inter, sans-serif", padding: 40 }}>Preparando relatório…</p>;
  }

  const fotoUrl = settings.photo_path
    ? supabase.storage.from("public-assets").getPublicUrl(settings.photo_path).data.publicUrl
    : null;

  const capaUrl = (p: Projeto) =>
    p.cover_path
      ? supabase.storage.from("public-assets").getPublicUrl(p.cover_path).data.publicUrl
      : null;

  const porCategoria = categorias
    .map((cat) => ({ cat, itens: projetos.filter((p) => p.category_id === cat.id) }))
    .filter((g) => g.itens.length > 0);

  const semCategoria = projetos.filter((p) => !p.category_id);
  const hoje = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date());

  return (
    <div className="rel-root" lang="pt-BR">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .rel-root { font-family:'Inter',system-ui,sans-serif; color:#1F2937; background:#fff;
          -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .rel-nao-imprime { padding:14px 24px; background:#F5F6F8; border-bottom:1px solid #E5E7EB;
          display:flex; justify-content:space-between; align-items:center; font-size:14px; color:#4B5563; }
        .rel-btn { background:#3F4A5C; color:#fff; border:none; border-radius:8px;
          font:600 13.5px 'Inter',sans-serif; padding:10px 18px; cursor:pointer; }

        .rel-pagina { max-width:760px; margin:0 auto; padding:48px 40px; }

        /* ── Capa ── */
        .rel-capa { display:flex; flex-direction:column; align-items:center; text-align:center;
          justify-content:center; min-height:80vh; }
        .rel-foto { width:190px; height:190px; border-radius:50%; object-fit:cover;
          border:4px solid #3F4A5C; margin-bottom:28px; }
        .rel-foto-fallback { width:190px; height:190px; border-radius:50%; background:#3F4A5C; color:#fff;
          display:flex; align-items:center; justify-content:center; font-size:64px; font-weight:700; margin-bottom:28px; }
        .rel-nome { font-size:38px; font-weight:700; letter-spacing:-.02em; margin:0 0 6px; }
        .rel-headline { font-size:19px; font-weight:500; color:#34405A; margin:0 0 22px; }
        .rel-bio { font-size:14.5px; line-height:1.7; color:#4B5563; max-width:56ch; margin:0 0 26px; }
        .rel-contato { font-size:13px; color:#6B7280; }
        .rel-contato span { margin:0 10px; }
        .rel-data-capa { margin-top:40px; font-size:12px; color:#9CA3AF; }

        /* ── Sumário ── */
        .rel-sumario h2 { font-size:22px; font-weight:700; margin:0 0 18px; }
        .rel-sumario-linha { display:flex; justify-content:space-between; align-items:baseline;
          font-size:14.5px; padding:9px 0; border-bottom:1px dotted #D1D5DB; }
        .rel-sumario-linha b { font-weight:600; }
        .rel-sumario-linha span { color:#6B7280; font-size:13px; }

        /* ── Carta ── */
        .rel-carta p { font-size:14px; line-height:1.85; color:#374151; margin:0 0 16px;
          text-align:justify; hyphens:auto; -webkit-hyphens:auto; }

        /* ── Seções por categoria ── */
        .rel-cat-titulo { display:flex; align-items:center; gap:10px; font-size:20px; font-weight:700;
          margin:0 0 20px; padding-bottom:10px; border-bottom:2px solid #1F2937; }
        .rel-cat-cor { width:14px; height:14px; border-radius:4px; display:inline-block; }
        .rel-proj { margin-bottom:22px; }
        .rel-proj-com-capa { display:grid; grid-template-columns:130px 1fr; gap:16px; align-items:start; }
        .rel-capa-proj { width:130px; height:92px; object-fit:cover; border-radius:8px;
          border:1px solid #E5E7EB; }
        .rel-proj h3 { font-size:15.5px; font-weight:600; margin:0 0 4px; line-height:1.4; }
        .rel-proj-meta { font-size:12px; color:#6B7280; margin:0 0 6px; }
        .rel-proj-meta .rel-destaque { color:#B45309; font-weight:600; }
        .rel-rascunho { background:#FEF6E7; color:#B45309; font-weight:600; font-size:10.5px;
          padding:2px 8px; border-radius:999px; margin-right:6px; vertical-align:1px; }
        .rel-proj p { font-size:13.5px; line-height:1.65; color:#4B5563; margin:0 0 4px;
          text-align:justify; hyphens:auto; -webkit-hyphens:auto; }
        .rel-proj p.rel-proj-meta { text-align:left; }
        .rel-proj a { font-size:12.5px; color:#3F4A5C; word-break:break-all; }

        .rel-rodape { font-size:11px; color:#9CA3AF; text-align:center; margin-top:36px; }

        /* ── Impressão ── */
        @page { size: A4; margin: 18mm 16mm; }
        @media print {
          .rel-nao-imprime { display:none; }
          .rel-pagina { max-width:none; padding:0; }
          .rel-capa { min-height:90vh; page-break-after: always; }
          .rel-sumario, .rel-carta { page-break-after: always; }
          .rel-secao { page-break-before: always; }
          .rel-secao:first-of-type { page-break-before: auto; }
          .rel-proj { page-break-inside: avoid; }
          a { text-decoration:none; }
        }
      `}</style>

      {/* Barra visível só na tela (some na impressão) */}
      <div className="rel-nao-imprime">
        <span>Pré-visualização do relatório — use "Salvar como PDF" no diálogo de impressão.</span>
        <button className="rel-btn" onClick={() => window.print()}>Imprimir / Salvar PDF</button>
      </div>

      <div className="rel-pagina">
        {/* ── CAPA ── */}
        <section className="rel-capa">
          {fotoUrl ? (
            <img className="rel-foto" src={fotoUrl} alt={`Foto de ${settings.full_name}`} />
          ) : (
            <div className="rel-foto-fallback">
              {settings.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
          )}
          <h1 className="rel-nome">{settings.full_name}</h1>
          <p className="rel-headline">{settings.headline}</p>
          {settings.bio && <p className="rel-bio">{settings.bio}</p>}
          <p className="rel-contato">
            {settings.email && <span>✉ {settings.email}</span>}
            {settings.city && <span>📍 {settings.city}</span>}
          </p>
          <p className="rel-data-capa">Portfólio gerado em {hoje}</p>
        </section>

        {/* ── SUMÁRIO ── */}
        <section className="rel-sumario">
          <h2>Resumo do portfólio</h2>
          {porCategoria.map(({ cat, itens }) => (
            <div key={cat.id} className="rel-sumario-linha">
              <b>{cat.name}</b>
              <span>{itens.length} projeto{itens.length !== 1 ? "s" : ""}</span>
            </div>
          ))}
          <div className="rel-sumario-linha">
            <b>Total</b>
            <span>
              {projetos.length} projeto{projetos.length !== 1 ? "s" : ""}
              {comRascunhos ? " (inclui rascunhos)" : " publicados"}
            </span>
          </div>
        </section>

        {/* ── CARTA DE APRESENTAÇÃO ── */}
        {settings.personal_statement && (
          <section className="rel-carta">
            <h2 className="rel-cat-titulo">Carta de Apresentação</h2>
            {settings.personal_statement.split("\n\n").map((par, i) => (
              <p key={i}>{par}</p>
            ))}
          </section>
        )}

        {/* ── PROJETOS POR CATEGORIA ── */}
        {porCategoria.map(({ cat, itens }) => (
          <section key={cat.id} className="rel-secao">
            <h2 className="rel-cat-titulo">
              <span className="rel-cat-cor" style={{ background: cat.color }} />
              {cat.name}
            </h2>
            {itens.map((p) => {
              const capa = capaUrl(p);
              return (
                <article key={p.id} className={`rel-proj${capa ? " rel-proj-com-capa" : ""}`}>
                  {capa && <img className="rel-capa-proj" src={capa} alt="" loading="eager" />}
                  <div>
                    <h3>{p.title}</h3>
                    <p className="rel-proj-meta">
                      {p.status === "draft" && <span className="rel-rascunho">RASCUNHO</span>}
                      {p.featured && <span className="rel-destaque">★ Destaque · </span>}
                      {[p.outlet, fmtData(p.published_at)].filter(Boolean).join(" · ")}
                    </p>
                    {p.summary && <p>{p.summary}</p>}
                    {p.external_url && <a href={p.external_url}>{p.external_url}</a>}
                  </div>
                </article>
              );
            })}
          </section>
        ))}

        {semCategoria.length > 0 && (
          <section className="rel-secao">
            <h2 className="rel-cat-titulo">Outros projetos</h2>
            {semCategoria.map((p) => {
              const capa = capaUrl(p);
              return (
                <article key={p.id} className={`rel-proj${capa ? " rel-proj-com-capa" : ""}`}>
                  {capa && <img className="rel-capa-proj" src={capa} alt="" loading="eager" />}
                  <div>
                    <h3>{p.title}</h3>
                    <p className="rel-proj-meta">
                      {p.status === "draft" && <span className="rel-rascunho">RASCUNHO</span>}
                      {[p.outlet, fmtData(p.published_at)].filter(Boolean).join(" · ")}
                    </p>
                    {p.summary && <p>{p.summary}</p>}
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <p className="rel-rodape">
          {settings.full_name} · Portfólio de Jornalismo · {hoje}
        </p>
      </div>
    </div>
  );
}