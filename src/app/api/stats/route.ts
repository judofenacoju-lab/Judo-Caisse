import { NextRequest, NextResponse } from "next/server";
import { getMonthlyStats, getRecapData, getStats } from "@/lib/db";
import { getSession, sessionHasWorkspace } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!sessionHasWorkspace(session)) {
    return NextResponse.json(
      { error: "Sélectionnez un tableau de bord" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");

  if (mode === "date" || mode === "month" || mode === "year" || mode === "all") {
    const recap = await getRecapData(session.workspace, {
      mode,
      date: searchParams.get("date") ?? undefined,
      month: searchParams.get("month") ?? undefined,
      year: searchParams.get("year") ?? undefined,
    });
    return NextResponse.json({ recap });
  }

  const [stats, monthly] = await Promise.all([
    getStats(session.workspace),
    getMonthlyStats(session.workspace),
  ]);
  return NextResponse.json({ stats, monthly });
}
