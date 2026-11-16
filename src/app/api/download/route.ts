import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { launcherPresets } from "@/db/schema";
import { buildKit, sanitizeConfig, type LauncherConfig } from "@/lib/launcher";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  let cfg: LauncherConfig;

  const presetId = Number(sp.get("preset"));
  if (Number.isInteger(presetId) && presetId > 0) {
    const [row] = await db
      .select()
      .from(launcherPresets)
      .where(eq(launcherPresets.id, presetId))
      .limit(1);
    if (!row) {
      return NextResponse.json({ error: "Preset not found" }, { status: 404 });
    }
    cfg = sanitizeConfig(row);
  } else {
    cfg = sanitizeConfig({
      nodeVersion: sp.get("node") ?? undefined,
      omnirouteVersion: sp.get("omni") ?? undefined,
      port: sp.get("port") ?? undefined,
      bindHost: sp.get("bind") ?? undefined,
      requireApiKey: sp.get("key") === null ? undefined : sp.get("key") !== "false",
      openBrowser: sp.get("browser") === null ? undefined : sp.get("browser") !== "false",
    });
  }

  const zip = new JSZip();
  const root = zip.folder("OmniRoute-Portable")!;
  for (const file of buildKit(cfg)) {
    root.file(file.name, file.content);
  }
  // Placeholder folders so the layout is visible before first run.
  root.folder("runtime")!.file(".keep", "Node.js LTS lands here on first run.\n");
  root.folder("app")!.file(".keep", "OmniRoute is installed here on first run.\n");
  root.folder("data")!.file(".keep", "Secrets, settings and the SQLite database live here.\n");

  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="OmniRoute-Portable.zip"',
      "Cache-Control": "no-store",
    },
  });
}