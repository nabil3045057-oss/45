import {
  Usb,
  Download,
  FolderTree,
  FileCode2,
  Settings2,
  Plug,
  HelpCircle,
  ShieldCheck,
  Lock,
  KeyRound,
  Fingerprint,
  FileCheck2,
  HardDriveDownload,
  PackageOpen,
  Rocket,
  Zap,
  BookOpen,
  Plus,
  Database,
  Folder,
  FolderCog,
  FileText,
  Terminal,
  WifiOff,
  ShieldOff,
} from "lucide-react";
import Reveal from "@/components/Reveal";
import BootTerminal from "@/components/BootTerminal";
import FileViewer from "@/components/FileViewer";
import OsGuide from "@/components/OsGuide";
import BuilderPanel from "@/components/BuilderPanel";
import ConnectPanel from "@/components/ConnectPanel";

function SectionHead({
  kicker,
  title,
  sub,
  icon,
}: {
  kicker: string;
  title: string;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <Reveal className="mb-8">
      <p className="mb-2 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ember">
        <span className="text-mint">{icon}</span>
        {kicker}
      </p>
      <h2 className="font-display text-3xl font-bold tracking-tight text-snow sm:text-4xl">{title}</h2>
      {sub && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-fog">{sub}</p>}
    </Reveal>
  );
}

const TREE: { depth: number; name: string; note: string; kind: "dir" | "auto" | "file" | "secret" }[] = [
  { depth: 0, name: "OmniRoute-Portable/", note: "the whole app — copy it anywhere", kind: "dir" },
  { depth: 1, name: "Start OmniRoute.cmd", note: "Windows: double-click", kind: "file" },
  { depth: 1, name: "launcher.ps1", note: "Windows engine, no admin", kind: "file" },
  { depth: 1, name: "start.sh", note: "Linux / macOS: bash start.sh", kind: "file" },
  { depth: 1, name: "launcher.env", note: "pins · port · security switches", kind: "file" },
  { depth: 1, name: "tools/", note: "secret generator + browser opener", kind: "dir" },
  { depth: 1, name: "runtime/", note: "pinned Node.js LTS — auto, first run", kind: "auto" },
  { depth: 1, name: "app/", note: "omniroute@3.8.52 — auto, first run", kind: "auto" },
  { depth: 1, name: "data/", note: "everything persistent lives here", kind: "secret" },
  { depth: 2, name: "secrets.env", note: "encryption key · JWT · initial password", kind: "secret" },
  { depth: 2, name: "storage.sqlite", note: "encrypted database (DATA_DIR)", kind: "secret" },
  { depth: 2, name: "npm-cache/ · backups/", note: "even the cache stays on the stick", kind: "auto" },
];

const SECURITY = [
  {
    icon: <KeyRound size={16} />,
    key: "REQUIRE_API_KEY",
    value: "true",
    tone: "mint",
    body: "Every /v1 request must carry Authorization: Bearer <key>. Copy yours from Dashboard → Endpoints. Off by default upstream — on by default here.",
  },
  {
    icon: <Lock size={16} />,
    key: "BIND_HOST",
    value: "127.0.0.1",
    tone: "mint",
    body: "The server binds to loopback only, so it is invisible to the rest of the network. Flip to 0.0.0.0 in launcher.env only when you deliberately want LAN access.",
  },
  {
    icon: <Fingerprint size={16} />,
    key: "STORAGE_ENCRYPTION_KEY",
    value: "generated · 256-bit",
    tone: "ember",
    body: "Created by the portable Node runtime on first run (crypto.randomBytes). Encrypts the SQLite database and provider credentials at rest. Back up data/secrets.env!",
  },
  {
    icon: <ShieldCheck size={16} />,
    key: "JWT_SECRET · API_KEY_SECRET",
    value: "generated",
    tone: "ember",
    body: "Random per-kit secrets for dashboard sessions and API-key HMAC — never the upstream defaults, never shared between sticks.",
  },
  {
    icon: <FileCheck2 size={16} />,
    key: "NODE_SHA256_*",
    value: "official checksums",
    tone: "skyx",
    body: "The Node.js download is verified against nodejs.org's published SHA-256 sums before extraction. A corrupted or tampered download aborts the launch.",
  },
  {
    icon: <ShieldOff size={16} />,
    key: "system footprint",
    value: "zero",
    tone: "skyx",
    body: "No PATH edits, no registry writes, no global npm packages, no services. Uninstall = delete the folder. Your machine never knows it was there.",
  },
];

const FAQ = [
  {
    q: "Does the first run need internet? What about after that?",
    a: "First run downloads the pinned Node.js LTS (~30 MB) from nodejs.org and omniroute@3.8.52 from npm — a few minutes on a normal connection. After that, runtime/ and app/ carry version markers, so every later start skips all downloads and boots in seconds, fully offline. (Talking to cloud LLM providers naturally still needs internet.)",
  },
  {
    q: "Why a .cmd that calls PowerShell instead of a big batch file?",
    a: "The .cmd is a two-line double-click shim; the real logic lives in launcher.ps1, which gives us reliable HTTPS downloads, Get-FileHash checksum verification and ZIP extraction on any Windows 10/11 box. It runs with -ExecutionPolicy Bypass scoped to that one process — your system policy and PATH are untouched, and no admin rights are involved.",
  },
  {
    q: "Will it work from a USB stick formatted as exFAT?",
    a: "Yes. The npm install uses --no-bin-links because exFAT has no symlinks, and the launchers invoke node and omniroute.mjs by direct path. Avoid FAT32 (4 GB file limit, no permissions). One caveat: native modules like better-sqlite3 are compiled per-OS — if you move the stick from Windows to Linux, delete app/ and re-run there; data/ carries over untouched.",
  },
  {
    q: "Where exactly are my keys and database?",
    a: "Everything persistent is inside data/: secrets.env (encryption key, JWT secret, initial dashboard password), the SQLite database (DATA_DIR points here), settings, logs, backups, and even the npm cache. Nothing is written to ~/.omniroute, AppData, or the registry.",
  },
  {
    q: "What happens if I lose data/secrets.env?",
    a: "The SQLite database is encrypted with STORAGE_ENCRYPTION_KEY from that file. Without it, stored provider credentials cannot be decrypted — you would re-enter them. Treat secrets.env like a password manager export and keep a backup copy somewhere safe.",
  },
  {
    q: "How do I update OmniRoute or Node later?",
    a: "Edit OMNIROUTE_VERSION or NODE_VERSION in launcher.env and start again. The launcher compares the version markers, re-downloads only the piece that changed, and leaves data/ completely alone. For unpinned Node versions the checksum is fetched live from nodejs.org's SHASUMS256.txt.",
  },
  {
    q: "macOS says the files are from an unidentified developer.",
    a: "Files downloaded from the internet get a quarantine attribute. Run xattr -dr com.apple.quarantine . once inside the folder, then bash start.sh. The scripts are plain text and the Node runtime is the official signed nodejs.org build.",
  },
  {
    q: "Why did the install skip Playwright's Chromium?",
    a: "To keep the kit lean and the first run fast, PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 is set during install. Normal API providers work fine. If you want web-cookie providers (e.g. Gemini Web), run the Playwright install once with PLAYWRIGHT_BROWSERS_PATH pointed at data/pw-browsers so the browser also stays on the stick.",
  },
];

export default function Page() {
  return (
    <main className="relative">
      {/* ================= NAV ================= */}
      <header className="sticky top-0 z-50 border-b border-line/70 bg-ink/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ember text-ink shadow-lg shadow-ember/30">
              <Usb size={16} />
            </span>
            <span className="font-display text-[15px] font-bold tracking-tight text-snow">
              OmniRoute <span className="text-ember">Portable</span>
            </span>
          </a>
          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {[
              { href: "#files", label: "Files", icon: <FileCode2 size={13} /> },
              { href: "#setup", label: "Setup", icon: <Settings2 size={13} /> },
              { href: "#security", label: "Security", icon: <ShieldCheck size={13} /> },
              { href: "#builder", label: "Builder", icon: <FolderTree size={13} /> },
              { href: "#connect", label: "Connect", icon: <Plug size={13} /> },
              { href: "#faq", label: "FAQ", icon: <HelpCircle size={13} /> },
            ].map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] text-fog transition-colors hover:bg-panel hover:text-snow"
              >
                {n.icon}
                {n.label}
              </a>
            ))}
          </nav>
          <a
            href="/api/download"
            className="ml-auto inline-flex items-center gap-2 rounded-lg bg-ember px-3.5 py-2 font-display text-[13px] font-semibold text-ink shadow-md shadow-ember/25 transition-all hover:-translate-y-px hover:bg-[#ffa35f] md:ml-2"
          >
            <Download size={14} /> Get the kit
          </a>
        </div>
      </header>

      {/* ================= OPENER ================= */}
      <section id="top" className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr]">
          <Reveal>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3.5 py-1.5 font-mono text-[11px] tracking-[0.16em] text-fog">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-mint" />
              NO ADMIN · NO GLOBAL NODE · NO TRACE
            </p>
            <h1 className="font-display text-[2.6rem] font-bold leading-[1.04] tracking-tight text-snow sm:text-6xl">
              One folder.
              <br />
              Any machine.
              <br />
              <span className="text-ember">Your entire AI gateway.</span>
            </h1>
            <p className="mt-5 max-w-lg text-[15.5px] leading-relaxed text-fog">
              A drop-in portable launcher for <b className="text-mist">OmniRoute</b>. Double-click on
              Windows or <code className="rounded bg-panel px-1.5 py-0.5 font-mono text-[13px] text-mint">bash start.sh</code>{" "}
              on Linux/macOS — it fetches a pinned Node.js LTS into{" "}
              <code className="font-mono text-[13px] text-mist">runtime/</code>, installs OmniRoute into{" "}
              <code className="font-mono text-[13px] text-mist">app/</code>, and keeps every key, setting
              and the encrypted SQLite database in <code className="font-mono text-[13px] text-mist">data/</code>.
              Unplug, walk away, plug in somewhere else.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 font-mono text-[11.5px]">
              <span className="rounded-md border border-line bg-panel px-2.5 py-1.5 text-mist">
                Node <b className="text-skyx">v24.22.1 LTS</b> · SHA-256 pinned
              </span>
              <span className="rounded-md border border-line bg-panel px-2.5 py-1.5 text-mist">
                omniroute<b className="text-skyx">@3.8.52</b>
              </span>
              <span className="rounded-md border border-line bg-panel px-2.5 py-1.5 text-mist">
                :<b className="text-skyx">20128</b> · key required <b className="text-mint">✓</b>
              </span>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="/api/download"
                className="inline-flex items-center gap-2 rounded-xl bg-ember px-6 py-3.5 font-display text-[15px] font-semibold text-ink shadow-lg shadow-ember/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ffa35f] hover:shadow-xl hover:shadow-ember/35"
              >
                <Download size={17} /> Download OmniRoute-Portable.zip
              </a>
              <a
                href="#files"
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel px-5 py-3.5 font-display text-[15px] font-medium text-snow transition-all duration-200 hover:border-line2 hover:bg-panel2"
              >
                <FileCode2 size={16} className="text-mint" /> Read every script first
              </a>
            </div>
            <p className="mt-3 font-mono text-[11px] text-fog/80">
              ~14 KB of plain-text scripts · everything else is fetched from nodejs.org & npm on first run
            </p>
          </Reveal>
          <Reveal delay={150} className="float-y">
            <BootTerminal />
          </Reveal>
        </div>
      </section>

      {/* ================= FOLDER + LIFECYCLE ================= */}
      <section className="border-y border-line/60 bg-panel/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
            <Reveal>
              <p className="mb-2 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ember">
                <FolderTree size={13} className="text-mint" /> Anatomy of the stick
              </p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-snow">
                Everything lives <span className="text-mint">right here</span>
              </h2>
              <div className="mt-6 overflow-hidden rounded-xl border border-line bg-[#0d1420] p-4 font-mono text-[12.5px] leading-[1.9]">
                {TREE.map((t) => (
                  <div
                    key={t.name}
                    className="group flex items-baseline gap-2 rounded px-2 transition-colors hover:bg-raise/60"
                    style={{ paddingLeft: `${t.depth * 20 + 8}px` }}
                    title={t.note}
                  >
                    <span className="shrink-0">
                      {t.kind === "dir" && <Folder size={13} className="inline text-skyx" />}
                      {t.kind === "auto" && <FolderCog size={13} className="inline text-fog" />}
                      {t.kind === "secret" &&
                        (t.name.endsWith("/") ? (
                          <Database size={13} className="inline text-ember" />
                        ) : (
                          <Lock size={13} className="inline text-ember" />
                        ))}
                      {t.kind === "file" &&
                        (t.name.endsWith(".sh") || t.name.endsWith(".cmd") ? (
                          <Terminal size={13} className="inline text-mint" />
                        ) : (
                          <FileText size={13} className="inline text-mist" />
                        ))}
                    </span>
                    <span
                      className={
                        t.kind === "secret"
                          ? "text-ember"
                          : t.kind === "dir"
                            ? "font-semibold text-skyx"
                            : t.kind === "auto"
                              ? "text-fog"
                              : "text-snow"
                      }
                    >
                      {t.name}
                    </span>
                    <span className="ml-auto hidden truncate pl-3 text-[10.5px] text-fog/60 transition-colors group-hover:text-fog sm:inline">
                      {t.note}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 flex items-center gap-2 text-[12.5px] text-fog">
                <WifiOff size={13} className="text-mint" />
                Gray folders are auto-created on first run; orange never leaves the folder.
              </p>
            </Reveal>

            <Reveal delay={120}>
              <p className="mb-2 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ember">
                <Zap size={13} className="text-mint" /> Lifecycle
              </p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-snow">
                Slow once. <span className="text-ember">Fast forever.</span>
              </h2>
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-line bg-panel p-5">
                  <p className="mb-4 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.16em] text-fog">
                    First run <span className="text-ember">~3–6 min · online</span>
                  </p>
                  <ol className="space-y-0">
                    {[
                      { icon: <HardDriveDownload size={15} />, t: "Fetch pinned Node.js LTS", d: "nodejs.org → runtime/ · SHA-256 verified against official sums" },
                      { icon: <PackageOpen size={15} />, t: "Install omniroute@3.8.52", d: "npm → app/ · cache inside data/ · --no-bin-links for USB filesystems" },
                      { icon: <KeyRound size={15} />, t: "Generate secrets once", d: "encryption key, JWT secret, API key secret, dashboard password → data/secrets.env" },
                      { icon: <Rocket size={15} />, t: "Boot & open dashboard", d: "localhost:20128 · /v1 protected by API key from the first second" },
                    ].map((s, i, arr) => (
                      <li key={s.t} className="relative flex gap-3.5 pb-4 last:pb-0">
                        {i < arr.length - 1 && (
                          <span className="absolute left-[13px] top-8 h-[calc(100%-30px)] w-px bg-line2" aria-hidden />
                        )}
                        <span className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ember/40 bg-panel2 text-ember">
                          {s.icon}
                        </span>
                        <div>
                          <p className="font-display text-[14px] font-semibold text-snow">{s.t}</p>
                          <p className="mt-0.5 text-[12.5px] leading-relaxed text-fog">{s.d}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="flex items-center gap-4 rounded-xl border border-mint/30 bg-mint/5 p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mint/15 text-mint">
                    <Zap size={20} />
                  </span>
                  <div>
                    <p className="font-display text-[15px] font-semibold text-mint">
                      Every run after · seconds · offline
                    </p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-fog">
                      Version markers match → zero downloads, zero installs. Same runtime, same app,
                      same encrypted data. Just boot.
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= FILES ================= */}
      <section id="files" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
        <SectionHead
          kicker="Audit before you run"
          title="Seven plain-text files. That's the whole launcher."
          sub="No binaries, no installers, no obfuscation. Inspect every line here, download files individually, or grab the ZIP. The preview below is byte-for-byte what ships in the kit."
          icon={<FileCode2 size={13} />}
        />
        <Reveal delay={100}>
          <FileViewer />
        </Reveal>
      </section>

      {/* ================= SETUP ================= */}
      <section id="setup" className="border-y border-line/60 bg-panel/40">
        <div className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
          <SectionHead
            kicker="Per-platform setup"
            title="Double-click, or one line of bash"
            sub="Pick your OS. Each path ends at the same place: dashboard on localhost:20128, OpenAI-compatible API on /v1, keys required."
            icon={<Settings2 size={13} />}
          />
          <Reveal delay={100}>
            <OsGuide />
          </Reveal>
        </div>
      </section>

      {/* ================= SECURITY ================= */}
      <section id="security" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
        <SectionHead
          kicker="Secure by default"
          title="Not open to the whole network. Ever."
          sub="Upstream OmniRoute ships with REQUIRE_API_KEY=false for convenience. This kit flips the defaults: keys mandatory, loopback-only binding, encrypted storage, and verified downloads."
          icon={<ShieldCheck size={13} />}
        />
        <div className="grid gap-4 md:grid-cols-2">
          {SECURITY.map((s, i) => (
            <Reveal key={s.key} delay={i * 60}>
              <div className="group h-full rounded-xl border border-line bg-panel p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-line2 hover:bg-panel2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      s.tone === "mint"
                        ? "bg-mint/12 text-mint"
                        : s.tone === "ember"
                          ? "bg-ember/12 text-ember"
                          : "bg-skyx/12 text-skyx"
                    }`}
                  >
                    {s.icon}
                  </span>
                  <code className="font-mono text-[13px] font-semibold text-snow">{s.key}</code>
                  <span
                    className={`ml-auto rounded-md px-2 py-0.5 font-mono text-[11px] ${
                      s.tone === "mint"
                        ? "bg-mint/12 text-mint"
                        : s.tone === "ember"
                          ? "bg-ember/12 text-ember"
                          : "bg-skyx/12 text-skyx"
                    }`}
                  >
                    {s.value}
                  </span>
                </div>
                <p className="mt-3 text-[13.5px] leading-relaxed text-fog">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= BUILDER ================= */}
      <section id="builder" className="border-y border-line/60 bg-panel/40">
        <div className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
          <SectionHead
            kicker="Kit builder"
            title="Tune the pins, keep the safety"
            sub="Change the port for a second stick, pin a different release, or enable LAN mode deliberately. Presets are saved to the database so your configurations are one click away next time."
            icon={<FolderTree size={13} />}
          />
          <Reveal delay={100}>
            <BuilderPanel />
          </Reveal>
        </div>
      </section>

      {/* ================= CONNECT ================= */}
      <section id="connect" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
        <SectionHead
          kicker="Wire it up"
          title="One endpoint for every tool"
          sub="Point any OpenAI-compatible client at the portable gateway. The model name auto lets OmniRoute pick a provider, or address one explicitly with provider/model."
          icon={<Plug size={13} />}
        />
        <Reveal delay={100}>
          <ConnectPanel />
        </Reveal>
      </section>

      {/* ================= FAQ ================= */}
      <section id="faq" className="border-t border-line/60 bg-panel/40">
        <div className="mx-auto max-w-4xl scroll-mt-20 px-4 py-16 sm:px-6">
          <SectionHead
            kicker="Troubleshooting & details"
            title="Questions you'd ask before trusting a USB stick"
            icon={<HelpCircle size={13} />}
          />
          <div className="space-y-3">
            {FAQ.map((f, i) => (
              <Reveal key={f.q} delay={i * 40}>
                <details className="faq group rounded-xl border border-line bg-panel transition-colors open:border-line2">
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 font-display text-[15px] font-semibold text-snow transition-colors hover:text-ember">
                    <Plus size={16} className="faq-plus shrink-0 text-ember" />
                    {f.q}
                  </summary>
                  <p className="border-t border-line/60 px-5 py-4 text-[14px] leading-relaxed text-fog">
                    {f.a}
                  </p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-line/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center sm:px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ember text-ink shadow-lg shadow-ember/25">
            <Usb size={18} />
          </span>
          <p className="max-w-xl text-[13px] leading-relaxed text-fog">
            OmniRoute Portable Kit — community launcher scripts for{" "}
            <a
              href="https://github.com/diegosouzapw/OmniRoute"
              target="_blank"
              rel="noreferrer"
              className="text-mist underline decoration-line2 underline-offset-4 transition-colors hover:text-ember"
            >
              OmniRoute
            </a>{" "}
            (MIT). Pins verified against nodejs.org and the npm registry. OmniRoute itself is a
            separate project — this kit just makes it travel well.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-[11.5px] text-fog">
            <a
              href="https://github.com/diegosouzapw/OmniRoute/wiki"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-snow"
            >
              <BookOpen size={13} /> OmniRoute docs
            </a>
            <a
              href="https://nodejs.org/dist/v24.22.1/SHASUMS256.txt"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-snow"
            >
              <FileCheck2 size={13} /> Node checksums
            </a>
            <a href="/api/download" className="inline-flex items-center gap-1.5 text-ember transition-colors hover:text-[#ffa35f]">
              <Download size={13} /> OmniRoute-Portable.zip
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}