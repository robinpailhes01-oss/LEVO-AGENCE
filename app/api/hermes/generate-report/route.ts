import { NextResponse } from "next/server";
import { withHandler, jsonOk, jsonError } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth-guard";
import { serverEnv } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/server";
import { callClaude } from "@/lib/claude";
import { logActivity } from "@/lib/log";
import { HERMES_SYSTEM, hermesReportPrompt } from "@/prompts/hermes";
import {
  aggregateWeek,
  lastWeekRange,
  sendReportEmail,
} from "@/lib/hermes";

export const runtime = "nodejs";
export const maxDuration = 90;

/** Allow either an authenticated dashboard session, or the cron bearer token. */
async function authorize(req: Request): Promise<boolean> {
  if (await isAuthenticated()) return true;
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1] ?? "";
  const expected = serverEnv.cronSecret;
  return expected.length > 0 && token === expected;
}

async function run(req: Request): Promise<NextResponse> {
  if (!(await authorize(req))) return jsonError("Non autorisé.", 401);

  const range = lastWeekRange();
  const data = await aggregateWeek(range);

  const markdown = await callClaude({
    system: HERMES_SYSTEM,
    prompt: hermesReportPrompt({
      weekStart: range.start,
      weekEnd: range.end,
      data: data as unknown as Record<string, unknown>,
    }),
    maxTokens: 2000,
    temperature: 0.4,
  });

  const subject = `Levo — Rapport hebdo (${range.start} → ${range.end})`;
  const emailed = await sendReportEmail(subject, markdown);

  const { data: report, error } = await supabaseAdmin()
    .from("weekly_reports")
    .insert({
      week_start: range.start,
      week_end: range.end,
      summary: markdown.split("\n").find((l) => l.trim().length > 0) ?? null,
      metrics: data as unknown as Record<string, unknown>,
      content_md: markdown,
      sent_at: emailed ? new Date().toISOString() : null,
      email_to: emailed ? serverEnv.emailTo ?? null : null,
    })
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);

  await logActivity({
    agent: "hermes",
    action: "a généré le rapport hebdomadaire",
    summary: emailed ? "Rapport envoyé par email" : "Rapport enregistré",
    entityType: "report",
    entityId: (report as { id: string }).id,
    status: "success",
  });

  return jsonOk({ report, emailed });
}

export async function POST(req: Request): Promise<NextResponse> {
  return withHandler(() => run(req));
}

// Vercel Cron triggers a GET request.
export async function GET(req: Request): Promise<NextResponse> {
  return withHandler(() => run(req));
}
