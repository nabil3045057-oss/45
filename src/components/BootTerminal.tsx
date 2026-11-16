"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, TerminalSquare, Zap, Snowflake } from "lucide-react";

type Line = { text: string; tone: "cmd" | "info" | "ok" | "warn" | "url"; pause?: number };

const COLD: Line[] = [
  { text: "E:\\> Start OmniRoute.cmd", tone: "cmd", pause: 700 },
  { text: "[omniroute-portable] First run: downloading Node.js v24.22.1 (win-x64) into .\\runtime ...", tone: "info", pause: 900 },
  { text: "  node-v24.22.1-win-x64.zip   100%  29.4 MB", tone: "info", pause: 500 },
  { text: "[omniroute-portable] SHA-256 checksum verified.", tone: "ok", pause: 450 },
  { text: "[omniroute-portable] Node.js ready: v24.22.1", tone: "ok", pause: 600 },
  { text: "[omniroute-portable] Installing omniroute@3.8.52 into .\\app (one-time) ...", tone: "info", pause: 1100 },
  { text: "[omniroute-portable] OmniRoute installed.", tone: "ok", pause: 500 },
  { text: "[omniroute-portable] Generated data/secrets.env (encryption key, JWT secret, API key secret).", tone: "ok", pause: 500 },
  { text: "[omniroute-portable] Dashboard login password: x7Kp2mQa_Rt1", tone: "warn", pause: 700 },
  { text: "[omniroute-portable] Dashboard : http://localhost:20128", tone: "url", pause: 350 },
  { text: "[omniroute-portable] API base  : http://localhost:20128/v1   (API key required: true)", tone: "url", pause: 350 },
  { text: "▲ OmniRoute ready — routing 375 providers through one endpoint.", tone: "ok", pause: 400 },
];

const WARM: Line[] = [
  { text: "E:\\> Start OmniRoute.cmd", tone: "cmd", pause: 600 },
  { text: "[omniroute-portable] runtime/node .version = 24.22.1 ✓ skip download", tone: "info", pause: 350 },
  { text: "[omniroute-portable] app/.omniroute-version = 3.8.52 ✓ skip install", tone: "info", pause: 350 },
  { text: "[omniroute-portable] data/secrets.env found ✓ keys untouched", tone: "ok", pause: 400 },
  { text: "[omniroute-portable] Dashboard : http://localhost:20128", tone: "url", pause: 300 },
  { text: "[omniroute-portable] API base  : http://localhost:20128/v1   (API key required: true)", tone: "url", pause: 300 },
  { text: "▲ OmniRoute ready in 3.2s — same files, same data, fully offline.", tone: "ok", pause: 400 },
];

const TONE: Record<Line["tone"], string> = {
  cmd: "text-snow font-semibold",
  info: "text-fog",
  ok: "text-mint",
  warn: "text-ember",
  url: "text-skyx",
};

export default function BootTerminal() {
  const [mode, setMode] = useState<"cold" | "warm">("cold");
  const [count, setCount] = useState(0);
  const [run, setRun] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lines = mode === "cold" ? COLD : WARM;

  useEffect(() => {
    setCount(0);
    let i = 0;
    const step = () => {
      i += 1;
      setCount(i);
      if (i < lines.length) {
        timer.current = setTimeout(step, lines[i - 1].pause ?? 400);
      }
    };
    timer.current = setTimeout(step, 500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, run]);

  const done = count >= lines.length;

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-[#0a0f18] shadow-[0_24px_70px_-24px_rgba(0,0,0,0.8)]">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-panel px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <i className="h-2.5 w-2.5 rounded-full bg-danger/70" />
          <i className="h-2.5 w-2.5 rounded-full bg-ember/70" />
          <i className="h-2.5 w-2.5 rounded-full bg-mint/70" />
        </span>
        <span className="ml-1 inline-flex items-center gap-1.5 font-mono text-[11px] text-fog">
          <TerminalSquare size={12} /> OmniRoute-Portable
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMode("cold")}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[10.5px] transition-colors ${
              mode === "cold" ? "bg-ember/15 text-ember" : "text-fog hover:text-snow"
            }`}
          >
            <Snowflake size={11} /> first run
          </button>
          <button
            type="button"
            onClick={() => setMode("warm")}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[10.5px] transition-colors ${
              mode === "warm" ? "bg-mint/15 text-mint" : "text-fog hover:text-snow"
            }`}
          >
            <Zap size={11} /> every run after
          </button>
          <button
            type="button"
            onClick={() => setRun((r) => r + 1)}
            className="rounded-md p-1 text-fog transition-colors hover:text-snow"
            aria-label="Replay boot sequence"
            title="Replay"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>
      <div className="code-scroll h-[340px] overflow-y-auto p-4 font-mono text-[12px] leading-[1.75] sm:h-[360px]">
        {lines.slice(0, count).map((l, i) => (
          <div key={`${run}-${i}`} className={TONE[l.tone]}>
            {l.text}
          </div>
        ))}
        <span className="cursor-blink inline-block h-4 w-2 translate-y-0.5 bg-mint" aria-hidden />
        {done && (
          <span className="ml-3 font-mono text-[11px] text-fog">
            {mode === "cold" ? "— one-time setup complete" : "— warm start, no network needed"}
          </span>
        )}
      </div>
    </div>
  );
}