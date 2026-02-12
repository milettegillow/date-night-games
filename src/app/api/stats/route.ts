import { NextResponse } from "next/server";

const POSTHOG_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
const POSTHOG_HOST = "https://eu.i.posthog.com";

async function hogql(query: string): Promise<{ results: unknown[][] }> {
  const res = await fetch(
    `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${POSTHOG_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: { kind: "HogQLQuery", query },
      }),
      next: { revalidate: 300 },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PostHog API error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function GET() {
  if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) {
    return NextResponse.json(
      {
        error: "Missing environment variables",
        hasPosthogKey: !!POSTHOG_API_KEY,
        hasProjectId: !!POSTHOG_PROJECT_ID,
      },
      { status: 500 }
    );
  }

  try {
    const [
      sessionsResult,
      gamesPlayedResult,
      roundsResult,
      gamePopularityResult,
      nhieSpiceResult,
      mrsmrsSpicyResult,
      wyrCategoryResult,
      mrsmrsScoreResult,
      nhieScoreResult,
      wheelCategoryResult,
      wyrMatchResult,
    ] = await Promise.all([
      // Total unique sessions
      hogql(`SELECT count(DISTINCT "$session_id") FROM events WHERE "$session_id" IS NOT NULL`),

      // Total games played (all game_start events)
      hogql(`SELECT count() FROM events WHERE event IN ('mrsmrs_game_start', 'nhie_game_start', 'wyr_game_start')`),

      // Total rounds completed
      hogql(`SELECT count() FROM events WHERE event IN ('mrsmrs_round_complete', 'nhie_round_complete', 'wyr_round_complete', 'wheel_spin')`),

      // Game popularity breakdown
      hogql(`SELECT properties.game, count() FROM events WHERE event = 'game_selected' GROUP BY properties.game ORDER BY count() DESC`),

      // NHIE spice level breakdown
      hogql(`SELECT properties.spiceLevel, count() FROM events WHERE event = 'nhie_game_start' GROUP BY properties.spiceLevel ORDER BY count() DESC`),

      // Mr & Mrs spicy mode percentage
      hogql(`SELECT properties.spicy, count() FROM events WHERE event = 'mrsmrs_game_start' GROUP BY properties.spicy`),

      // WYR category breakdown
      hogql(`SELECT properties.category, count() FROM events WHERE event = 'wyr_game_start' GROUP BY properties.category ORDER BY count() DESC`),

      // Mr & Mrs average score
      hogql(`SELECT avg(toFloat64(properties.score)) FROM events WHERE event = 'mrsmrs_game_complete'`),

      // NHIE average score
      hogql(`SELECT avg(toFloat64(properties.score)) FROM events WHERE event = 'nhie_game_complete'`),

      // Most popular wheel category
      hogql(`SELECT properties.category, count() FROM events WHERE event = 'wheel_spin' GROUP BY properties.category ORDER BY count() DESC LIMIT 1`),

      // WYR average agreement rate
      hogql(`SELECT
        countIf(properties.matched = 'true') * 100.0 / count()
        FROM events WHERE event = 'wyr_round_complete'`),
    ]);

    const stats = {
      hero: {
        sessions: sessionsResult.results[0]?.[0] ?? 0,
        gamesPlayed: gamesPlayedResult.results[0]?.[0] ?? 0,
        roundsCompleted: roundsResult.results[0]?.[0] ?? 0,
      },
      gamePopularity: (gamePopularityResult.results || []).map(
        ([game, count]) => ({ game, count })
      ),
      settings: {
        nhieSpiceLevels: (nhieSpiceResult.results || []).map(
          ([level, count]) => ({ level, count })
        ),
        mrsmrsSpicy: (() => {
          const rows = mrsmrsSpicyResult.results || [];
          const spicyCount = rows.find(
            ([v]) => v === true || v === "true"
          )?.[1] as number ?? 0;
          const cleanCount = rows.find(
            ([v]) => v === false || v === "false"
          )?.[1] as number ?? 0;
          const total = spicyCount + cleanCount;
          return {
            spicyPercent: total > 0 ? Math.round((spicyCount / total) * 100) : 0,
            total,
          };
        })(),
        wyrCategories: (wyrCategoryResult.results || []).map(
          ([category, count]) => ({ category, count })
        ),
      },
      funFacts: {
        avgMrsmrsScore: mrsmrsScoreResult.results[0]?.[0] != null
          ? Math.round((mrsmrsScoreResult.results[0][0] as number) * 10) / 10
          : null,
        avgNhieScore: nhieScoreResult.results[0]?.[0] != null
          ? Math.round((nhieScoreResult.results[0][0] as number) * 10) / 10
          : null,
        topWheelCategory: wheelCategoryResult.results[0]?.[0] ?? null,
        wyrAgreementRate: wyrMatchResult.results[0]?.[0] != null
          ? Math.round(wyrMatchResult.results[0][0] as number)
          : null,
      },
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(stats, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      {
        error: "Stats fetch failed",
        message: error instanceof Error ? error.message : "Unknown error",
        hasPosthogKey: !!POSTHOG_API_KEY,
        hasProjectId: !!POSTHOG_PROJECT_ID,
        projectId: POSTHOG_PROJECT_ID,
      },
      { status: 500 }
    );
  }
}
