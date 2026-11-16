"use client";

import { useState } from "react";
import { AppWindow, Apple, TerminalSquare, MousePointerClick, ShieldCheck, Globe } from "lucide-react";
import CodeBlock from "./CodeBlock";

const OS = [
  {
    id: "windows",
    label: "Windows",
    icon: <AppWindow size={14} />,
    steps: [
      {
        icon: <MousePointerClick size={15} />,
        title: "Copy the folder anywhere",
        body: "Desktop, D:\\Tools, or your USB stick (exFAT or NTFS). No installer, no admin prompt.",
      },
      {
        icon: <TerminalSquare size={15} />,
        title: "Double-click Start OmniRoute.cmd",
        body: "It calls PowerShell with a process-scoped execution policy — your machine's settings are untouched. First run downloads Node and installs OmniRoute.",
      },
      {
        icon: <ShieldCheck size={15} />,
        title: "If SmartScreen appears",
        body: "Click “More info → Run anyway”. Both scripts are plain text — open them in Notepad first if you want to audit every line.",
      },
      {
        icon: <Globe size={15} />,
        title: "Dashboard opens itself",
        body: "http://localhost:20128 — log in with the INITIAL_PASSWORD printed in the console (stored in data\\secrets.env).",
      },
    ],
    code: `:: that's the whole install
E:\\OmniRoute-Portable> Start OmniRoute.cmd`,
    codeTitle: "cmd",
  },
  {
    id: "linux",
    label: "Linux",
    icon: <TerminalSquare size={14} />,
    steps: [
      {
        icon: <MousePointerClick size={15} />,
        title: "Copy the folder anywhere",
        body: "Home directory, /opt you own, or a USB mount. Needs curl or wget plus tar — present on virtually every distro.",
      },
      {
        icon: <TerminalSquare size={15} />,
        title: "Run the launcher",
        body: "bash start.sh works even if the USB filesystem dropped the executable bit. No sudo, ever.",
      },
      {
        icon: <ShieldCheck size={15} />,
        title: "Checksum-verified runtime",
        body: "The pinned Node tarball is verified with sha256sum against nodejs.org's official SHASUMS256 before it is extracted.",
      },
      {
        icon: <Globe size={15} />,
        title: "Open the dashboard",
        body: "xdg-open fires automatically; otherwise browse to http://localhost:20128. Ctrl+C stops the server cleanly.",
      },
    ],
    code: `cd /media/$USER/USB/OmniRoute-Portable
bash start.sh

# or make it executable once:
chmod +x start.sh && ./start.sh`,
    codeTitle: "bash",
  },
  {
    id: "macos",
    label: "macOS",
    icon: <Apple size={14} />,
    steps: [
      {
        icon: <MousePointerClick size={15} />,
        title: "Copy the folder anywhere",
        body: "Works on Apple Silicon (arm64) and Intel (x64) — the launcher detects the architecture and pins the matching Node build.",
      },
      {
        icon: <ShieldCheck size={15} />,
        title: "Clear the download quarantine",
        body: "Files copied from the internet get a quarantine flag. One xattr command clears it for the whole folder — no admin needed.",
      },
      {
        icon: <TerminalSquare size={15} />,
        title: "Run the launcher",
        body: "bash start.sh from Terminal. curl and shasum ship with macOS, so there is nothing to install first.",
      },
      {
        icon: <Globe size={15} />,
        title: "Dashboard opens itself",
        body: "The open command launches http://localhost:20128 in your default browser a few seconds after boot.",
      },
    ],
    code: `cd /Volumes/USB/OmniRoute-Portable
xattr -dr com.apple.quarantine .   # once, if downloaded
bash start.sh`,
    codeTitle: "zsh / bash",
  },
] as const;

export default function OsGuide() {
  const [tab, setTab] = useState<(typeof OS)[number]["id"]>("windows");
  const os = OS.find((o) => o.id === tab)!;

  return (
    <div>
      <div className="mb-6 inline-flex rounded-xl border border-line bg-panel p-1">
        {OS.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setTab(o.id)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-display text-sm font-medium transition-all duration-200 ${
              tab === o.id ? "bg-ember text-ink shadow-lg shadow-ember/20" : "text-fog hover:text-snow"
            }`}
          >
            {o.icon}
            {o.label}
          </button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <ol className="space-y-3">
          {os.steps.map((s, i) => (
            <li
              key={`${os.id}-${i}`}
              className="group flex gap-4 rounded-xl border border-line bg-panel p-4 transition-all duration-300 hover:border-line2 hover:bg-panel2"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-panel2 font-mono text-xs text-ember transition-colors group-hover:border-ember/40">
                {i + 1}
              </span>
              <div>
                <p className="flex items-center gap-2 font-display text-[15px] font-semibold text-snow">
                  <span className="text-mint">{s.icon}</span>
                  {s.title}
                </p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-fog">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <CodeBlock code={os.code} title={os.codeTitle} maxHeight="20rem" />
          <p className="mt-3 rounded-lg border border-mint/25 bg-mint/5 px-4 py-3 text-[13px] leading-relaxed text-mist">
            <span className="font-semibold text-mint">Every run after the first:</span> the launcher
            sees the version markers in <code className="font-mono text-[12px]">runtime/</code> and{" "}
            <code className="font-mono text-[12px]">app/</code>, skips all downloads, and boots
            straight from the same files — offline, in seconds.
          </p>
        </div>
      </div>
    </div>
  );
}