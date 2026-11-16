import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { launcherPresets } from "@/db/schema";
import { sanitizeConfig } from "@/lib/launcher";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select()
    .from(launcherPresets)
    .orderBy(desc(launcherPresets.createdAt))
    .limit(20);
  return NextResponse.json({ presets: rows });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const name =
    typeof body.name === "string" && body.name.trim()
      ? body.name.trim().slice(0, 60)
      : null;
  if (!name) {
    return NextResponse.json({ error: "Preset name is required" }, { status: 400 });
  }
  const cfg = sanitizeConfig(body as never);
  const [row] = await db
    .insert(launcherPresets)
    .values({
      name,
      port: cfg.port,
      nodeVersion: cfg.nodeVersion,
      omnirouteVersion: cfg.omnirouteVersion,
      bindHost: cfg.bindHost,
      requireApiKey: cfg.requireApiKey,
      openBrowser: cfg.openBrowser,
    })
    .returning();
  return NextResponse.json({ preset: row }, { status: 201 });
}