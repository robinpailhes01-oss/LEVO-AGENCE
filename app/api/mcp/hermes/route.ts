import { mcpRoute, str, num, requireStr } from "@/lib/mcp";
import { supabaseAdmin } from "@/lib/supabase/server";
import { runHermesAnalysis, reviewHermesAnalysis } from "@/lib/hermes";

export const runtime = "nodejs";
export const maxDuration = 60;

const { GET, POST } = mcpRoute("hermes", [
  {
    name: "analyze_lead",
    description:
      "HERMES analyse le site web (ou secteur à défaut) d'un lead et rédige un brouillon d'email personnalisé (statut draft, à valider).",
    input: { lead_id: "string" },
    run: async (input) => runHermesAnalysis(requireStr(input, "lead_id")),
  },
  {
    name: "list_analyses",
    description: "Liste les brouillons Hermes (par défaut : en attente de validation).",
    input: { status: "string?", limit: "number?" },
    run: async (input) => {
      const status = str(input, "status") ?? "draft";
      const db = supabaseAdmin();
      let q = db
        .from("hermes_analyses")
        .select("*, leads(full_name, company, email, sector, instagram_handle)")
        .order("created_at", { ascending: false })
        .limit(num(input, "limit") ?? 50);
      if (status !== "all") q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return data;
    },
  },
  {
    name: "review_analysis",
    description: "Valide, rejette ou édite un brouillon Hermes (action humaine obligatoire avant tout envoi).",
    input: { id: "string", action: "string (approve|reject|edit)", email_body: "string?", subject_line: "string?" },
    run: async (input) => {
      const action = requireStr(input, "action");
      if (action !== "approve" && action !== "reject" && action !== "edit") {
        throw new Error("action doit être approve, reject ou edit.");
      }
      return reviewHermesAnalysis(requireStr(input, "id"), action, {
        email_body: str(input, "email_body"),
        subject_line: str(input, "subject_line"),
      });
    },
  },
]);

export { GET, POST };
