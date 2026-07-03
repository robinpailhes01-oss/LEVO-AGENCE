import { isAuthenticated } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Lead } from "@/lib/db";

export const runtime = "nodejs";

/** Colonnes pensées pour l'import Instantly (mapping simple à l'écran d'import). */
const HEADERS = ["email", "first_name", "last_name", "company_name", "phone", "website", "city", "sector", "icebreaker"];

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function splitName(fullName: string | null): { first: string; last: string } {
  if (!fullName) return { first: "", last: "" };
  const parts = fullName.trim().split(/\s+/);
  return { first: parts[0] ?? "", last: parts.slice(1).join(" ") };
}

export async function GET(req: Request): Promise<Response> {
  if (!(await isAuthenticated())) {
    return new Response("Non autorisé", { status: 401 });
  }

  const url = new URL(req.url);
  const nicheId = url.searchParams.get("niche_id");
  const stage = url.searchParams.get("stage");

  let q = supabaseAdmin().from("leads").select("*").not("email", "is", null);
  if (nicheId) q = q.eq("niche_id", nicheId);
  if (stage) q = q.eq("stage", stage);

  const { data, error } = await q.order("created_at", { ascending: true });
  if (error) return new Response(`Erreur : ${error.message}`, { status: 500 });

  const leads = (data ?? []) as Lead[];
  const lines = [HEADERS.join(",")];
  for (const l of leads) {
    const { first, last } = splitName(l.first_name ? null : l.full_name);
    const enrichment = (l.enrichment_data ?? {}) as Record<string, unknown>;
    const city = typeof enrichment.city === "string" ? enrichment.city : "";
    const icebreaker = typeof enrichment.icebreaker === "string" ? enrichment.icebreaker : "";
    lines.push(
      [
        l.email ?? "",
        l.first_name ?? first,
        last,
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
