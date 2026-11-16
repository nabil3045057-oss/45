/**
 * OmniRoute Portable Kit — launcher file generators.
 * Pure functions (no Node APIs) so the browser can preview the exact files
 * that the /api/download route packs into the ZIP.
 */

export interface LauncherConfig {
  nodeVersion: string;
  omnirouteVersion: string;
  port: number;
  bindHost: string;
  requireApiKey: boolean;
  openBrowser: boolean;
}

export const DEFAULT_CONFIG: LauncherConfig = {
  nodeVersion: "24.22.1", // Node.js LTS "Krypton"
  omnirouteVersion: "3.8.52",
  port: 20128,
  bindHost: "127.0.0.1",
  requireApiKey: true,
  openBrowser: true,
};

/** Official SHA-256 sums from https://nodejs.org/dist/v24.22.1/SHASUMS256.txt */
export const KNOWN_CHECKSUMS: Record<string, Record<string, string>> = {
  "24.22.1": {
    WIN_X64: "d2046d28c2c3dcd211ac5145c0bf30e2047ef9dfb306693c8c6e2eccd8b95fa5",
    WIN_ARM64: "a0c807319fede24c4a0d8f84564c82a619bd313b16b10c007c383c2609e99171",
    LINUX_X64: "6c172a9ab6718f7b801fb5a7bd486af2ee5e32758086a04b84fcce2aa77095e6",
    LINUX_ARM64: "dbabf7a1cbf947e6059ffad2c27b80041db97dea1e553b62afdee7f13fca336e",
    DARWIN_X64: "d132557e7ee2b85af08b0c8c34338e65c6430f2238d01f727728ef42dc83b035",
    DARWIN_ARM64: "89c682593d76cd44233fa53b1563264e7de9cbb189cad169135c5b4fadfbc0a7",
  },
};

const VERSION_RE = /^\d+\.\d+\.\d+$/;

export function sanitizeConfig(input: Partial<Record<keyof LauncherConfig, unknown>>): LauncherConfig {
  const cfg: LauncherConfig = { ...DEFAULT_CONFIG };
  if (typeof input.nodeVersion === "string" && VERSION_RE.test(input.nodeVersion.trim())) {
    cfg.nodeVersion = input.nodeVersion.trim();
  }
  if (typeof input.omnirouteVersion === "string" && VERSION_RE.test(input.omnirouteVersion.trim())) {
    cfg.omnirouteVersion = input.omnirouteVersion.trim();
  }
  const port = Number(input.port);
  if (Number.isInteger(port) && port >= 1024 && port <= 65535) cfg.port = port;
  if (input.bindHost === "127.0.0.1" || input.bindHost === "0.0.0.0") {
    cfg.bindHost = input.bindHost;
  }
  if (typeof input.requireApiKey === "boolean") cfg.requireApiKey = input.requireApiKey;
  if (typeof input.openBrowser === "boolean") cfg.openBrowser = input.openBrowser;
  return cfg;
}

/* ------------------------------------------------------------------ */
/* launcher.env                                                        */
/* ------------------------------------------------------------------ */

export function launcherEnv(cfg: LauncherConfig): string {
  const sums = KNOWN_CHECKSUMS[cfg.nodeVersion];
  const sum = (k: string) => (sums ? sums[k] : "auto");
  return `# ============================================================
#  OmniRoute Portable - launcher configuration
#  Edit this file and re-run. Changing a version triggers a
#  one-time re-download / re-install on the next start.
# ============================================================

# Pinned Node.js LTS build (downloaded into ./runtime on first run)
NODE_VERSION=${cfg.nodeVersion}

# Pinned OmniRoute release (installed into ./app on first run)
OMNIROUTE_VERSION=${cfg.omnirouteVersion}

# Dashboard: http://localhost:${cfg.port}   API: http://localhost:${cfg.port}/v1
PORT=${cfg.port}

# 127.0.0.1 = this computer only (recommended for a USB stick)
# 0.0.0.0   = also reachable from your local network (keep the API key on!)
BIND_HOST=${cfg.bindHost}

# true = every /v1 request must send "Authorization: Bearer <key>"
# Copy your key from the OmniRoute dashboard -> Endpoints page.
REQUIRE_API_KEY=${cfg.requireApiKey}

# Open the dashboard in your browser a few seconds after start
OPEN_BROWSER=${cfg.openBrowser}

# Official SHA-256 checksums for the pinned Node build.
# Source: https://nodejs.org/dist/v${cfg.nodeVersion}/SHASUMS256.txt
# "auto" = fetch and verify against nodejs.org at download time.
NODE_SHA256_WIN_X64=${sum("WIN_X64")}
NODE_SHA256_WIN_ARM64=${sum("WIN_ARM64")}
NODE_SHA256_LINUX_X64=${sum("LINUX_X64")}
NODE_SHA256_LINUX_ARM64=${sum("LINUX_ARM64")}
NODE_SHA256_DARWIN_X64=${sum("DARWIN_X64")}
NODE_SHA256_DARWIN_ARM64=${sum("DARWIN_ARM64")}
`;
}

/* ------------------------------------------------------------------ */
/* Start OmniRoute.cmd  (Windows double-click entry point)             */
/* ------------------------------------------------------------------ */

export function startCmd(): string {
  return [
    "@echo off",
    "rem ============================================================",
    "rem  OmniRoute Portable - double-click to set up and start.",
    "rem  No admin rights. No global Node.js. Everything stays here.",
    "rem ============================================================",
    "setlocal",
    'cd /d "%~dp0"',
    'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0launcher.ps1"',
    "if errorlevel 1 (",
    "  echo.",
    "  echo OmniRoute stopped with an error. See the messages above.",
    "  pause",
    ")",
    "endlocal",
    "",
  ].join("\r\n");
}

/* ------------------------------------------------------------------ */
/* launcher.ps1  (Windows engine, invoked by the .cmd)                 */
/* ------------------------------------------------------------------ */

export function launcherPs1(): string {
  return `# ============================================================
#  OmniRoute Portable - Windows engine (called by Start OmniRoute.cmd)
#  Downloads a pinned Node.js LTS into .\\runtime, installs OmniRoute
#  into .\\app, keeps every secret and database inside .\\data.
#  Requires no admin rights and never touches the system PATH.
# ============================================================
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}

function Say($msg) { Write-Host "[omniroute-portable] $msg" -ForegroundColor Cyan }
function Die($msg) { Write-Host "[omniroute-portable] ERROR: $msg" -ForegroundColor Red; exit 1 }

if (-not (Test-Path (Join-Path $Root 'launcher.env'))) { Die 'launcher.env not found next to this script.' }
$Cfg = @{}
Get-Content (Join-Path $Root 'launcher.env') | ForEach-Object {
  $line = $_.Trim()
  if ($line -and -not $line.StartsWith('#')) {
    $i = $line.IndexOf('=')
    if ($i -gt 0) { $Cfg[$line.Substring(0, $i)] = $line.Substring($i + 1) }
  }
}

$NodeVersion = $Cfg['NODE_VERSION']
$OmniVersion = $Cfg['OMNIROUTE_VERSION']
$Port = $Cfg['PORT']
if (-not $NodeVersion -or -not $OmniVersion -or -not $Port) { Die 'launcher.env is missing NODE_VERSION / OMNIROUTE_VERSION / PORT.' }

foreach ($d in 'runtime', 'app', 'data') {
  New-Item -ItemType Directory -Force -Path (Join-Path $Root $d) | Out-Null
}

$Arch = 'x64'
if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { $Arch = 'arm64' }
$Dist = 'node-v' + $NodeVersion + '-win-' + $Arch
$NodeDir = Join-Path $Root 'runtime\\node'
$NodeExe = Join-Path $NodeDir 'node.exe'
$NpmCli = Join-Path $NodeDir 'node_modules\\npm\\bin\\npm-cli.js'
$Marker = Join-Path $NodeDir '.version'

# --- 1) Portable Node.js runtime (pinned, checksum-verified) ---
$Expected = $Cfg[('NODE_SHA256_WIN_' + $Arch.ToUpper())]
if ((-not $Expected -or $Expected -eq 'auto') -and -not (Test-Path $NodeExe)) {
  Say 'Fetching official checksums from nodejs.org ...'
  $sums = (Invoke-WebRequest -UseBasicParsing -Uri ('https://nodejs.org/dist/v' + $NodeVersion + '/SHASUMS256.txt')).Content
  $line = $sums.Split([char]10) | Where-Object { $_ -match [regex]::Escape($Dist + '.zip') } | Select-Object -First 1
  if ($line) { $Expected = ($line.Trim() -split '\\s+')[0] }
}

if (-not (Test-Path $NodeExe) -or -not (Test-Path $Marker) -or ((Get-Content $Marker -Raw).Trim() -ne $NodeVersion)) {
  Say ('First run: downloading Node.js v' + $NodeVersion + ' (win-' + $Arch + ') into .\\runtime ...')
  $Tmp = Join-Path $Root 'runtime\\.download'
  if (Test-Path $Tmp) { Remove-Item -Recurse -Force $Tmp }
  New-Item -ItemType Directory -Force -Path $Tmp | Out-Null
  $Zip = Join-Path $Tmp ($Dist + '.zip')
  $ProgressPreference = 'SilentlyContinue'
  Invoke-WebRequest -UseBasicParsing -Uri ('https://nodejs.org/dist/v' + $NodeVersion + '/' + $Dist + '.zip') -OutFile $Zip
  if ($Expected -and $Expected -ne 'auto') {
    $Actual = (Get-FileHash $Zip -Algorithm SHA256).Hash.ToLower()
    if ($Actual -ne $Expected.ToLower()) { Die 'SHA-256 mismatch - download corrupted. Re-run to retry.' }
    Say 'SHA-256 checksum verified.'
  }
  Say 'Extracting Node.js ...'
  Expand-Archive -Path $Zip -DestinationPath $Tmp -Force
  if (Test-Path $NodeDir) { Remove-Item -Recurse -Force $NodeDir }
  Move-Item (Join-Path $Tmp $Dist) $NodeDir
  Set-Content -Path $Marker -Value $NodeVersion -NoNewline
  Remove-Item -Recurse -Force $Tmp
  Say ('Node.js ready: ' + (& $NodeExe --version))
}

# --- 2) OmniRoute, installed locally into .\\app ---
$env:npm_config_cache = Join-Path $Root 'data\\npm-cache'
$env:npm_config_update_notifier = 'false'
$env:npm_config_fund = 'false'
$env:npm_config_audit = 'false'
$env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '1'

$AppMarker = Join-Path $Root 'app\\.omniroute-version'
$AppDir = Join-Path $Root 'app\\node_modules\\omniroute'
if (-not (Test-Path $AppDir) -or -not (Test-Path $AppMarker) -or ((Get-Content $AppMarker -Raw).Trim() -ne $OmniVersion)) {
  Say ('Installing omniroute@' + $OmniVersion + ' into .\\app (one-time, may take a few minutes) ...')
  & $NodeExe $NpmCli install --prefix (Join-Path $Root 'app') --no-bin-links --no-audit --no-fund --loglevel=error ('omniroute@' + $OmniVersion)
  if ($LASTEXITCODE -ne 0) { Die 'npm install failed. Check your internet connection and re-run.' }
  Set-Content -Path $AppMarker -Value $OmniVersion -NoNewline
  Say 'OmniRoute installed.'
}

# --- 3) Secrets + data, all inside .\\data ---
& $NodeExe (Join-Path $Root 'tools\\gen-secrets.cjs')
if ($LASTEXITCODE -ne 0) { Die 'Could not generate secrets.' }
Get-Content (Join-Path $Root 'data\\secrets.env') | ForEach-Object {
  $line = $_.Trim()
  if ($line -and -not $line.StartsWith('#')) {
    $i = $line.IndexOf('=')
    if ($i -gt 0) { [Environment]::SetEnvironmentVariable($line.Substring(0, $i), $line.Substring($i + 1), 'Process') }
  }
}

$env:DATA_DIR = Join-Path $Root 'data'
$env:PORT = $Port
$env:HOSTNAME = $Cfg['BIND_HOST']
$env:REQUIRE_API_KEY = $Cfg['REQUIRE_API_KEY']
$env:NODE_ENV = 'production'
$env:NEXT_PUBLIC_BASE_URL = 'http://localhost:' + $Port
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $Root 'data\\pw-browsers'

$Url = 'http://localhost:' + $Port
if ($Cfg['OPEN_BROWSER'] -eq 'true') {
  Start-Process -FilePath $NodeExe -ArgumentList @((Join-Path $Root 'tools\\open-browser.cjs'), $Url) -WindowStyle Hidden
}

Say ('Dashboard : ' + $Url)
Say ('API base  : ' + $Url + '/v1   (API key required: ' + $Cfg['REQUIRE_API_KEY'] + ')')
Say 'Secrets   : data\\secrets.env   <- keep this folder private!'
Say 'Close this window or press Ctrl+C to stop. All data stays in .\\data'
& $NodeExe (Join-Path $Root 'app\\node_modules\\omniroute\\bin\\omniroute.mjs')
exit $LASTEXITCODE
`;
}

/* ------------------------------------------------------------------ */
/* start.sh  (Linux / macOS entry point)                               */
/* ------------------------------------------------------------------ */

export function startSh(): string {
  return `#!/usr/bin/env bash
# ============================================================
#  OmniRoute Portable - Linux / macOS launcher
#  Downloads a pinned Node.js LTS into ./runtime, installs
#  OmniRoute into ./app, keeps all data inside ./data.
#  No sudo, no global Node.js, safe to run from a USB drive.
#
#  Usage:  bash start.sh    (or: chmod +x start.sh && ./start.sh)
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

say() { printf '\\033[1;36m[omniroute-portable]\\033[0m %s\\n' "$*"; }
die() { printf '\\033[1;31m[omniroute-portable] ERROR:\\033[0m %s\\n' "$*" >&2; exit 1; }

[ -f "$ROOT/launcher.env" ] || die "launcher.env not found next to start.sh"
set -a; . "$ROOT/launcher.env"; set +a
: "\${NODE_VERSION:?}" "\${OMNIROUTE_VERSION:?}" "\${PORT:?}"

mkdir -p "$ROOT/runtime" "$ROOT/app" "$ROOT/data"

case "$(uname -s)" in
  Linux)  OS=linux ;;
  Darwin) OS=darwin ;;
  *) die "Unsupported OS. On Windows, double-click 'Start OmniRoute.cmd'." ;;
esac
case "$(uname -m)" in
  x86_64|amd64)  ARCH=x64 ;;
  arm64|aarch64) ARCH=arm64 ;;
  *) die "Unsupported CPU architecture: $(uname -m)" ;;
esac

if [ "$OS" = darwin ]; then EXT=tar.gz; else EXT=tar.xz; fi
DIST="node-v$NODE_VERSION-$OS-$ARCH"
NODE_DIR="$ROOT/runtime/node"
NODE_BIN="$NODE_DIR/bin/node"
NPM_CLI="$NODE_DIR/lib/node_modules/npm/bin/npm-cli.js"

fetch() { # fetch <url> <dest>
  if command -v curl >/dev/null 2>&1; then curl -fL --retry 3 --progress-bar -o "$2" "$1"
  elif command -v wget >/dev/null 2>&1; then wget -O "$2" "$1"
  else die "Need curl or wget to download files."; fi
}
fetch_stdout() {
  if command -v curl >/dev/null 2>&1; then curl -fsSL "$1"
  else wget -qO- "$1"; fi
}
sha256() {
  if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | cut -d' ' -f1
  else shasum -a 256 "$1" | cut -d' ' -f1; fi
}

# --- 1) Portable Node.js runtime (pinned, checksum-verified) ---
SUM_KEY="NODE_SHA256_$(printf '%s_%s' "$OS" "$ARCH" | tr '[:lower:]' '[:upper:]')"
EXPECTED="\${!SUM_KEY:-auto}"
if [ "$EXPECTED" = auto ] && [ ! -x "$NODE_BIN" ]; then
  say "Fetching official checksums from nodejs.org ..."
  EXPECTED="$(fetch_stdout "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt" | grep " $DIST.$EXT\\$" | cut -d' ' -f1 || true)"
fi

if [ ! -x "$NODE_BIN" ] || [ "$(cat "$NODE_DIR/.version" 2>/dev/null || true)" != "$NODE_VERSION" ]; then
  say "First run: downloading Node.js v$NODE_VERSION ($OS-$ARCH) into ./runtime ..."
  TMP="$ROOT/runtime/.download"
  rm -rf "$TMP"; mkdir -p "$TMP"
  fetch "https://nodejs.org/dist/v$NODE_VERSION/$DIST.$EXT" "$TMP/$DIST.$EXT"
  if [ -n "$EXPECTED" ] && [ "$EXPECTED" != auto ]; then
    ACTUAL="$(sha256 "$TMP/$DIST.$EXT")"
    [ "$ACTUAL" = "$EXPECTED" ] || die "SHA-256 mismatch - download corrupted. Re-run to retry."
    say "SHA-256 checksum verified."
  fi
  tar -xf "$TMP/$DIST.$EXT" -C "$TMP"
  rm -rf "$NODE_DIR"
  mv "$TMP/$DIST" "$NODE_DIR"
  printf '%s' "$NODE_VERSION" > "$NODE_DIR/.version"
  rm -rf "$TMP"
  say "Node.js ready: $("$NODE_BIN" --version)"
fi

# --- 2) OmniRoute, installed locally into ./app ---
export npm_config_cache="$ROOT/data/npm-cache"
export npm_config_update_notifier=false npm_config_fund=false npm_config_audit=false
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

if [ ! -d "$ROOT/app/node_modules/omniroute" ] || [ "$(cat "$ROOT/app/.omniroute-version" 2>/dev/null || true)" != "$OMNIROUTE_VERSION" ]; then
  say "Installing omniroute@$OMNIROUTE_VERSION into ./app (one-time, may take a few minutes) ..."
  "$NODE_BIN" "$NPM_CLI" install --prefix "$ROOT/app" --no-bin-links --no-audit --no-fund --loglevel=error "omniroute@$OMNIROUTE_VERSION"
  printf '%s' "$OMNIROUTE_VERSION" > "$ROOT/app/.omniroute-version"
  say "OmniRoute installed."
fi

# --- 3) Secrets + data, all inside ./data ---
"$NODE_BIN" "$ROOT/tools/gen-secrets.cjs"
set -a; . "$ROOT/data/secrets.env"; set +a

export DATA_DIR="$ROOT/data"
export PORT="$PORT"
export HOSTNAME="\${BIND_HOST:-127.0.0.1}"
export REQUIRE_API_KEY="\${REQUIRE_API_KEY:-true}"
export NODE_ENV=production
export NEXT_PUBLIC_BASE_URL="http://localhost:$PORT"
export PLAYWRIGHT_BROWSERS_PATH="$ROOT/data/pw-browsers"

URL="http://localhost:$PORT"
if [ "\${OPEN_BROWSER:-true}" = true ]; then
  "$NODE_BIN" "$ROOT/tools/open-browser.cjs" "$URL" >/dev/null 2>&1 &
fi

say "Dashboard : $URL"
say "API base  : $URL/v1   (API key required: $REQUIRE_API_KEY)"
say "Secrets   : $ROOT/data/secrets.env   <- keep this folder private!"
say "Stop with Ctrl+C. All data stays in ./data"
exec "$NODE_BIN" "$ROOT/app/node_modules/omniroute/bin/omniroute.mjs"
`;
}

/* ------------------------------------------------------------------ */
/* tools/gen-secrets.cjs  (shared first-run secret generator)          */
/* ------------------------------------------------------------------ */

export function genSecretsCjs(): string {
  return `// OmniRoute Portable - generates data/secrets.env on first run only.
// Runs on the portable Node.js runtime; never overwrites existing keys.
"use strict";
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });
const file = path.join(dataDir, "secrets.env");
if (fs.existsSync(file)) process.exit(0);

const hex = (n) => crypto.randomBytes(n).toString("hex");
const password = crypto.randomBytes(9).toString("base64url");
const body = [
  "# OmniRoute Portable - generated on first run. KEEP THIS FILE SECRET.",
  "# STORAGE_ENCRYPTION_KEY encrypts the SQLite database at rest (AES-256).",
  "# Losing it = losing access to saved provider credentials. Back it up!",
  "STORAGE_ENCRYPTION_KEY=" + hex(32),
  "JWT_SECRET=" + hex(48),
  "API_KEY_SECRET=" + hex(32),
  "INITIAL_PASSWORD=" + password,
  "",
].join("\\n");

fs.writeFileSync(file, body, { mode: 0o600 });
console.log("[omniroute-portable] Generated data/secrets.env (encryption key, JWT secret, API key secret).");
console.log("[omniroute-portable] Dashboard login password: " + password);
console.log("[omniroute-portable] It is stored in data/secrets.env - change it after first login.");
`;
}

/* ------------------------------------------------------------------ */
/* tools/open-browser.cjs                                              */
/* ------------------------------------------------------------------ */

export function openBrowserCjs(): string {
  return `// OmniRoute Portable - opens the dashboard once the server has had
// a few seconds to boot. Cross-platform, best-effort, never fatal.
"use strict";
const { spawn } = require("child_process");
const url = process.argv[2] || "http://localhost:20128";

setTimeout(() => {
  const p = process.platform;
  const cmd = p === "win32" ? "cmd" : p === "darwin" ? "open" : "xdg-open";
  const args = p === "win32" ? ["/c", "start", "", url] : [url];
  try {
    spawn(cmd, args, { detached: true, stdio: "ignore" }).unref();
  } catch (_) {
    /* no browser available - the URL is printed in the console anyway */
  }
  process.exit(0);
}, 5000);
`;
}

/* ------------------------------------------------------------------ */
/* README.txt                                                          */
/* ------------------------------------------------------------------ */

export function readmeTxt(cfg: LauncherConfig): string {
  return `============================================================
 OMNIROUTE PORTABLE  -  one folder, any machine, no admin
============================================================
Pinned versions : Node.js v${cfg.nodeVersion} (LTS)  +  omniroute@${cfg.omnirouteVersion}
Dashboard       : http://localhost:${cfg.port}
OpenAI API      : http://localhost:${cfg.port}/v1   (API key REQUIRED: ${cfg.requireApiKey})
Bind address    : ${cfg.bindHost}${cfg.bindHost === "127.0.0.1" ? "  (this computer only)" : "  (LAN reachable - keep REQUIRE_API_KEY=true!)"}

QUICK START
-----------
Windows        Double-click  "Start OmniRoute.cmd"
               (If SmartScreen appears: More info -> Run anyway.
                The script is plain text - read it first if you like.)

Linux / macOS  Open a terminal in this folder and run:
                 bash start.sh
               macOS may quarantine files copied from the internet:
                 xattr -dr com.apple.quarantine .

FIRST RUN (needs internet, a few minutes)
-----------------------------------------
1. Downloads the pinned Node.js LTS from nodejs.org into  runtime/
   and verifies it against the official SHA-256 checksum.
2. Installs omniroute@${cfg.omnirouteVersion} from npm into  app/
   (npm cache also lives inside data/, nothing touches your system).
3. Generates data/secrets.env: STORAGE_ENCRYPTION_KEY (encrypts the
   SQLite DB at rest), JWT_SECRET, API_KEY_SECRET, INITIAL_PASSWORD.
4. Starts the server and opens http://localhost:${cfg.port}

EVERY RUN AFTER THAT: fully offline-capable start in seconds.

FOLDER LAYOUT
-------------
  Start OmniRoute.cmd   Windows double-click entry point
  launcher.ps1          Windows engine (called by the .cmd)
  start.sh              Linux / macOS launcher
  launcher.env          Pins, port, bind address, security switches
  tools/                Small helpers (secrets, browser opener)
  runtime/              Private Node.js runtime      (auto-created)
  app/                  OmniRoute install            (auto-created)
  data/                 EVERYTHING persistent:       (auto-created)
                        secrets.env, settings, SQLite DB,
                        logs, backups, npm cache

CONNECT YOUR TOOLS (OpenAI-compatible)
--------------------------------------
  Base URL : http://localhost:${cfg.port}/v1
  API Key  : Dashboard -> Endpoints -> copy your OmniRoute key
  Model    : auto   (or any provider/model, e.g. openai/gpt-5.4)

  curl http://localhost:${cfg.port}/v1/chat/completions \\
    -H "Authorization: Bearer YOUR_OMNIROUTE_KEY" \\
    -H "Content-Type: application/json" \\
    -d '{"model":"auto","messages":[{"role":"user","content":"Hello!"}]}'

Works with Cursor, Claude Code, Codex CLI, Cline, OpenClaw and any
OpenAI-compatible SDK. Log in to the dashboard with INITIAL_PASSWORD
from data/secrets.env, connect a provider, then copy your API key.

SECURITY DEFAULTS
-----------------
* REQUIRE_API_KEY=true  - /v1 rejects requests without a Bearer key.
* BIND_HOST=${cfg.bindHost} - ${cfg.bindHost === "127.0.0.1" ? "the server is not reachable from the network." : "LAN access enabled; the API key is your only lock - treat it like a password."}
* The SQLite database and provider credentials are encrypted at rest
  with the generated STORAGE_ENCRYPTION_KEY.
* BACK UP data/secrets.env. Losing the encryption key means losing
  access to every stored provider credential.

USB DRIVE NOTES
---------------
* Format the stick as exFAT or NTFS (FAT32 drops file permissions and
  has a 4 GB file limit). The install uses --no-bin-links so symlink-
  less filesystems like exFAT work fine.
* Native modules (better-sqlite3, sharp) are platform-specific: the
  app/ folder works on the OS family it was installed on. To switch
  OS, delete app/ and re-run the launcher there (data/ carries over).
* First run on a new machine is offline-safe ONLY if runtime/ and
  app/ were already built for that OS/architecture.

UPDATING
--------
Edit OMNIROUTE_VERSION (or NODE_VERSION) in launcher.env and start
again - the launcher re-installs just that piece. Your data/ folder
is never touched by updates.

UNINSTALL = delete this folder. Nothing was installed anywhere else.
`;
}

/* ------------------------------------------------------------------ */

export interface KitFile {
  name: string;
  lang: string;
  desc: string;
  content: string;
}

export function buildKit(cfg: LauncherConfig): KitFile[] {
  return [
    { name: "Start OmniRoute.cmd", lang: "bat", desc: "Windows — double-click entry point", content: startCmd() },
    { name: "launcher.ps1", lang: "powershell", desc: "Windows engine (no admin, no PATH changes)", content: launcherPs1() },
    { name: "start.sh", lang: "bash", desc: "Linux / macOS — bash start.sh", content: startSh() },
    { name: "launcher.env", lang: "ini", desc: "Pins, port, bind address, security switches", content: launcherEnv(cfg) },
    { name: "tools/gen-secrets.cjs", lang: "javascript", desc: "First-run key generation (runs on portable Node)", content: genSecretsCjs() },
    { name: "tools/open-browser.cjs", lang: "javascript", desc: "Opens the dashboard after boot", content: openBrowserCjs() },
    { name: "README.txt", lang: "text", desc: "Quick start, security, USB notes", content: readmeTxt(cfg) },
  ];
}