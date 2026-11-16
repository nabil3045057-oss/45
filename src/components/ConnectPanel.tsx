"use client";

import { useState } from "react";
import { Radar, KeyRound, Plug, CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react";
import CodeBlock, { CopyButton } from "./CodeBlock";

const SNIPPETS = [
  {
    id: "curl",
    label: "curl",
    code: `curl http://localhost:20128/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_OMNIROUTE_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "auto",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`,
  },
  {
    id: "python",
    label: "Python",
    code: `from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:20128/v1",
    api_key="YOUR_OMNIROUTE_KEY",  # Dashboard -> Endpoints
)

reply = client.chat.completions.create(
    model="auto",  # or "openai/gpt-5.4", "anthropic/claude-...", ...
    messages=[{"role": "user", "content": "Hello!"}],
)
print(reply.choices[0].message.content)`,
  },
  {
    id: "node",
    label: "Node.js",
    code: `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "http://localhost:20128/v1",
  apiKey: process.env.OMNIROUTE_KEY, // Dashboard -> Endpoints
});

const reply = await client.chat.completions.create({
  model: "auto",
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(reply.choices[0].message.content);`,
  },
  {
    id: "agents",
    label: "Coding agents",
    code: `# Any OpenAI-compatible tool (Cursor, Cline, Codex CLI, ...)
OPENAI_BASE_URL=http://localhost:20128/v1
OPENAI_API_KEY=YOUR_OMNIROUTE_KEY

# Claude Code / Anthropic-format tools
ANTHROPIC_BASE_URL=http://localhost:20128
ANTHROPIC_AUTH_TOKEN=YOUR_OMNIROUTE_KEY

# Cursor: Settings -> Models -> OpenAI API Base URL
#   http://localhost:20128/v1   + your OmniRoute key`,
  },
] as const;

type ProbeState = "idle" | "checking" | "up" | "down";

export default function ConnectPanel() {
  const [tab, setTab] = useState<(typeof SNIPPETS)[number]["id"]>("curl");
  const [probe, setProbe] = useState<ProbeState>("idle");
  const snippet = SNIPPETS.find((s) => s.id === tab)!;

  const runProbe = async () => {
    setProbe("checking");
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3500);
    try {
      // no-cors: we only test reachability of a gateway on THIS machine;
      // an opaque response still proves something is listening on 20128.
      await fetch("http://localhost:20128/api/monitoring/health", {
        mode: "no-cors",
        signal: ctrl.signal,
        cache: "no-store",
      });
      setProbe("up");
    } catch {
      setProbe("down");
    } finally {
      clearTimeout(t);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
      <div className="space-y-4">
        <div className="rounded-xl border border-line bg-panel p-5">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-fog">Connection settings</p>
          {[
            { k: "Base URL", v: "http://localhost:20128/v1", icon: <Plug size={13} /> },
            { k: "API key", v: "Dashboard → Endpoints → copy", icon: <KeyRound size={13} /> },
            { k: "Model", v: "auto (or provider/model)", icon: <Radar size={13} /> },
          ].map((row) => (
            <div
              key={row.k}
              className="flex items-center justify-between gap-3 border-b border-line/60 py-2.5 last:border-0"
            >
              <span className="inline-flex items-center gap-2 text-[13px] text-fog">
                <span className="text-ember">{row.icon}</span>
                {row.k}
              </span>
              <span className="flex items-center gap-2">
                <code className="font-mono text-[12px] text-mist">{row.v}</code>
                {row.k === "Base URL" && <CopyButton text={row.v} label="" />}
              </span>
            </div>
          ))}
          <a
            href="http://localhost:20128"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-skyx/40 bg-skyx/10 px-4 py-2.5 font-display text-sm font-medium text-skyx transition-all hover:bg-skyx/20"
          >
            <ExternalLink size={15} /> Open dashboard · localhost:20128
          </a>
        </div>

        <div className="rounded-xl border border-line bg-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-[15px] font-semibold text-snow">Is your gateway running?</p>
              <p className="mt-0.5 text-[12.5px] text-fog">Probes port 20128 on this computer from your browser.</p>
            </div>
            <button
              type="button"
              onClick={runProbe}
              disabled={probe === "checking"}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-panel2 px-3.5 py-2 font-mono text-[12px] text-snow ring-1 ring-line transition-all hover:ring-mint/50 disabled:opacity-60"
            >
              {probe === "checking" ? <Loader2 size={13} className="animate-spin" /> : <Radar size={13} />}
              Check
            </button>
          </div>
          {probe !== "idle" && probe !== "checking" && (
            <p
              className={`mt-3 flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-[13px] ${
                probe === "up" ? "border-mint/35 bg-mint/8 text-mint" : "border-danger/35 bg-danger/8 text-mist"
              }`}
            >
              {probe === "up" ? (
                <>
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                  Something is listening on localhost:20128 — your portable gateway appears to be up.
                </>
              ) : (
                <>
                  <XCircle size={15} className="mt-0.5 shrink-0 text-danger" />
                  Nothing answered on port 20128. Start the launcher first (double-click the .cmd or run bash start.sh).
                </>
              )}
            </p>
          )}
        </div>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {SNIPPETS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setTab(s.id)}
              className={`rounded-lg px-3.5 py-1.5 font-mono text-[12px] transition-all duration-200 ${
                tab === s.id
                  ? "bg-mint/15 text-mint shadow-[inset_0_0_0_1px_rgba(61,220,151,0.4)]"
                  : "bg-panel text-fog ring-1 ring-line hover:text-snow"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <CodeBlock code={snippet.code} title={`${snippet.label} · OpenAI-compatible`} maxHeight="24rem" />
        <p className="mt-3 text-[13px] leading-relaxed text-fog">
          With <code className="font-mono text-[12px] text-mist">REQUIRE_API_KEY=true</code> (the kit
          default), requests without a valid <code className="font-mono text-[12px] text-mist">Authorization: Bearer</code>{" "}
          header are rejected — the endpoint is never silently open to your network.
        </p>
      </div>
    </div>
  );
}