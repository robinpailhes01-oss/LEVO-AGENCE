import { isAuthenticated } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Lead } from "@/lib/db";

export const runtime = "nodejs";

/** Colonnes pensées pour l'import Instantly (mapping simple à l'écran d'import). */
const HEADERS = ["email", "first_name", "company_name", "phone", "website", "city", "sector", "icebreaker"];

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request): Promise<Response> {
  if (!(await isAuthenticated())) {
    return new Response("Non autorisé", { status: 401 });
  }

  const url = new URL(req.url);
  const nicheId = url.searchParams.get("niche_id");
  const stage = url.searchParams.get("stage");
  // `all=1` → réexporte tout (même déjà exportés) et ne (re)marque rien.
  const exportAll = url.searchParams.get("all") === "1";

  // Supabase/PostgREST plafonne une lecture à 1000 lignes — on pagine pour tout exporter.
  const leads: Lead[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    let q = supabaseAdmin().from("leads").select("*").not("email", "is", null);
    if (nicheId) q = q.eq("niche_id", nicheId);
    if (stage) q = q.eq("stage", stage);
    if (!exportAll) q = q.is("exported_at", null); // par défaut : seulement les nouveaux
    const { data, error } = await q.order("created_at", { ascending: true }).range(from, from + pageSize - 1);
    if (error) return new Response(`Erreur : ${error.message}`, { status: 500 });
    leads.push(...((data ?? []) as Lead[]));
    if (!data || data.length < pageSize) break;
  }

  // Marque les leads fraîchement exportés pour ne plus les ressortir (sauf mode `all`).
  if (!exportAll && leads.length > 0) {
    const ids = leads.map((l) => l.id);
    const now = new Date().toISOString();
    for (let i = 0; i < ids.length; i += 500) {
      await supabaseAdmin().from("leads").update({ exported_at: now }).in("id", ids.slice(i, i + 500));
    }
  }
  const lines = [HEADERS.join(",")];
  for (const l of leads) {
    const enrichment = (l.enrichment_data ?? {}) as Record<string, unknown>;
    const city = typeof enrichment.city === "string" ? enrichment.city : "";
    const icebreaker = typeof enrichment.icebreaker === "string" ? enrichment.icebreaker : "";
    lines.push(
      [
        l.email ?? "",
        l.first_name ?? "", // vrai prénom de contact uniquement, vide si inconnu
        l.company ?? "",
        (enrichment.phone as string | undefined) ?? "",
        l.linkedin_url ?? "",
        city,
        l.sector ?? "",
        icebreaker,
      ]
        .map(csvCell)
        .join(","),
    );
  }

  const filename = `leads${nicheId ? `-${nicheId.slice(0, 8)}` : ""}.csv`;
  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}
