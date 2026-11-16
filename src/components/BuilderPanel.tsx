"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Download,
  Save,
  Trash2,
  History,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Lock,
  FolderClock,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { DEFAULT_CONFIG, KNOWN_CHECKSUMS, type LauncherConfig } from "@/lib/launcher";

interface Preset extends LauncherConfig {
  id: number;
  name: string;
  createdAt: string;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-fog">
        {label}
        {hint && <span className="normal-case tracking-normal text-[10.5px] text-fog/70">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-line bg-[#0d1420] px-3 py-2.5 font-mono text-[13px] text-snow outline-none transition-colors placeholder:text-fog/50 focus:border-ember/60 focus:ring-2 focus:ring-ember/15";

function Toggle({
  checked,
  onChange,
  labelOn,
  labelOff,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  labelOn: string;
  labelOff: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-all duration-200 ${
        checked ? "border-mint/40 bg-mint/8" : "border-line bg-[#0d1420] hover:border-line2"
      }`}
    >
      <span className={`font-mono text-[12.5px] ${checked ? "text-mint" : "text-fog"}`}>
        {checked ? labelOn : labelOff}
      </span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-mint/80" : "bg-line2"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-snow transition-all duration-200 ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

export default function BuilderPanel() {
  const [cfg, setCfg] = useState<LauncherConfig>({ ...DEFAULT_CONFIG });
  const [name, setName] = useState("");
  const [presets, setPresets] = useState<Preset[]>([]);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof LauncherConfig>(k: K, v: LauncherConfig[K]) =>
    setCfg((c) => ({ ...c, [k]: v }));

  const loadPresets = useCallback(async () => {
    try {
      const res = await fetch("/api/presets");
      if (res.ok) {
        const data = await res.json();
        setPresets(data.presets ?? []);
      }
    } catch {
      /* offline preview — builder still works without history */
    }
  }, []);

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  const downloadUrl =
    `/api/download?node=${encodeURIComponent(cfg.nodeVersion)}` +
    `&omni=${encodeURIComponent(cfg.omnirouteVersion)}&port=${cfg.port}` +
    `&bind=${cfg.bindHost}&key=${cfg.requireApiKey}&browser=${cfg.openBrowser}`;

  const savePreset = async () => {
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      const res = await fetch("/api/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || `Kit · port ${cfg.port}`,
          ...cfg,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      setName("");
      setSaved("Preset saved — it will be here next time you visit.");
      await loadPresets();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const removePreset = async (id: number) => {
    setPresets((p) => p.filter((x) => x.id !== id));
    await fetch(`/api/presets/${id}`, { method: "DELETE" }).catch(() => {});
    loadPresets();
  };

  const applyPreset = (p: Preset) => {
    setCfg({
      nodeVersion: p.nodeVersion,
      omnirouteVersion: p.omnirouteVersion,
      port: p.port,
      bindHost: p.bindHost,
      requireApiKey: p.requireApiKey,
      openBrowser: p.openBrowser,
    });
    setSaved(`Loaded “${p.name}” into the builder.`);
  };

  const knownSums = Boolean(KNOWN_CHECKSUMS[cfg.nodeVersion]);
  const insecure = !cfg.requireApiKey || cfg.bindHost === "0.0.0.0";

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      {/* form */}
      <div className="rounded-xl border border-line bg-panel p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-snow">Configure your kit</h3>
          <button
            type="button"
            onClick={() => setCfg({ ...DEFAULT_CONFIG })}
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 font-mono text-[11px] text-fog transition-colors hover:border-line2 hover:text-snow"
          >
            <RotateCcw size={11} /> Reset defaults
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Node.js LTS pin" hint={knownSums ? "SHA-256 baked in" : "verified via nodejs.org"}>
            <input
              className={inputCls}
              value={cfg.nodeVersion}
              onChange={(e) => set("nodeVersion", e.target.value)}
              placeholder="24.22.1"
              spellCheck={false}
            />
          </Field>
          <Field label="OmniRoute pin" hint="npm version">
            <input
              className={inputCls}
              value={cfg.omnirouteVersion}
              onChange={(e) => set("omnirouteVersion", e.target.value)}
              placeholder="3.8.52"
              spellCheck={false}
            />
          </Field>
          <Field label="Port" hint="dashboard + /v1">
            <input
              className={inputCls}
              type="number"
              min={1024}
              max={65535}
              value={cfg.port}
              onChange={(e) => set("port", Number(e.target.value))}
            />
          </Field>
          <Field label="Bind address">
            <div className="grid grid-cols-2 gap-2">
              {(["127.0.0.1", "0.0.0.0"] as const).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => set("bindHost", h)}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 font-mono text-[12px] transition-all ${
                    cfg.bindHost === h
                      ? h === "127.0.0.1"
                        ? "border-mint/50 bg-mint/10 text-mint"
                        : "border-ember/50 bg-ember/10 text-ember"
                      : "border-line bg-[#0d1420] text-fog hover:border-line2"
                  }`}
                >
                  {h === "127.0.0.1" ? <Lock size={12} /> : <Globe size={12} />}
                  {h}
                </button>
              ))}
            </div>
          </Field>
          <Field label="API key protection" hint="REQUIRE_API_KEY">
            <Toggle
              checked={cfg.requireApiKey}
              onChange={(v) => set("requireApiKey", v)}
              labelOn="true — Bearer key required"
              labelOff="false — /v1 is open!"
            />
          </Field>
          <Field label="Open browser on start">
            <Toggle
              checked={cfg.openBrowser}
              onChange={(v) => set("openBrowser", v)}
              labelOn="true — auto-open dashboard"
              labelOff="false — console only"
            />
          </Field>
        </div>

        <div
          className={`mt-4 flex items-start gap-2.5 rounded-lg border px-4 py-3 text-[13px] leading-relaxed transition-colors ${
            insecure ? "border-ember/40 bg-ember/8 text-mist" : "border-mint/30 bg-mint/5 text-mist"
          }`}
        >
          {insecure ? (
            <ShieldAlert size={16} className="mt-0.5 shrink-0 text-ember" />
          ) : (
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-mint" />
          )}
          {cfg.requireApiKey && cfg.bindHost === "127.0.0.1" && (
            <span>
              <b className="text-mint">Locked down.</b> Loopback-only binding plus mandatory API keys —
              the recommended USB-stick posture.
            </span>
          )}
          {cfg.requireApiKey && cfg.bindHost === "0.0.0.0" && (
            <span>
              <b className="text-ember">LAN mode.</b> Other devices can reach the gateway. The API key
              is your only lock — keep <code className="font-mono text-[12px]">REQUIRE_API_KEY=true</code> and
              treat the key like a password.
            </span>
          )}
          {!cfg.requireApiKey && (
            <span>
              <b className="text-ember">Warning:</b> with API key protection off, anyone who can reach
              the port can spend your provider quota. Only do this on a trusted, isolated machine.
            </span>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <a
            href={downloadUrl}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-ember px-5 py-3 font-display text-[15px] font-semibold text-ink shadow-lg shadow-ember/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ffa35f] hover:shadow-xl hover:shadow-ember/30"
          >
            <Download size={17} /> Download customized kit (.zip)
          </a>
        </div>
        <div className="mt-3 flex gap-2">
          <input
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Preset name, e.g. “USB stick — office”"
            maxLength={60}
          />
          <button
            type="button"
            onClick={savePreset}
            disabled={busy}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-line bg-panel2 px-4 py-2 font-display text-sm font-medium text-snow transition-colors hover:border-mint/50 hover:text-mint disabled:opacity-50"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save preset
          </button>
        </div>
        {saved && <p className="mt-2 text-[12.5px] text-mint">{saved}</p>}
        {error && <p className="mt-2 text-[12.5px] text-danger">{error}</p>}
      </div>

      {/* history */}
      <div className="rounded-xl border border-line bg-panel p-5 sm:p-6">
        <h3 className="mb-1 flex items-center gap-2 font-display text-lg font-semibold text-snow">
          <History size={17} className="text-skyx" /> Saved presets
        </h3>
        <p className="mb-4 text-[13px] text-fog">
          Stored in the database — reload a past configuration in one click instead of remembering pins and ports.
        </p>
        {presets.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line2 px-4 py-10 text-center">
            <FolderClock size={26} className="text-fog/60" />
            <p className="text-[13px] text-fog">
              No presets yet. Configure the kit and hit <b className="text-mist">Save preset</b> —
              it will appear here.
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {presets.map((p) => (
              <li
                key={p.id}
                className="group rounded-lg border border-line bg-panel2 p-3.5 transition-all duration-200 hover:border-line2"
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="truncate text-left font-display text-[14px] font-semibold text-snow transition-colors hover:text-ember"
                    title="Load into builder"
                  >
                    {p.name}
                  </button>
                  <span className="flex shrink-0 items-center gap-1">
                    <a
                      href={`/api/download?preset=${p.id}`}
                      className="rounded-md p-1.5 text-fog transition-colors hover:bg-raise hover:text-mint"
                      title="Download this preset as ZIP"
                      aria-label={`Download ${p.name}`}
                    >
                      <Download size={14} />
                    </a>
                    <button
                      type="button"
                      onClick={() => removePreset(p.id)}
                      className="rounded-md p-1.5 text-fog transition-colors hover:bg-raise hover:text-danger"
                      title="Delete preset"
                      aria-label={`Delete ${p.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </span>
                </div>
                <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-fog">
                  <span>:{p.port}</span>
                  <span>node {p.nodeVersion}</span>
                  <span>omni {p.omnirouteVersion}</span>
                  <span className={p.requireApiKey ? "text-mint" : "text-ember"}>
                    key:{String(p.requireApiKey)}
                  </span>
                  <span className={p.bindHost === "127.0.0.1" ? "text-mint" : "text-ember"}>{p.bindHost}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-5 rounded-lg border border-line bg-[#0d1420] p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fog">Live preview · launcher.env</p>
          <pre className="code-scroll mt-2 overflow-x-auto font-mono text-[12px] leading-relaxed text-mist">
{`NODE_VERSION=${cfg.nodeVersion}
OMNIROUTE_VERSION=${cfg.omnirouteVersion}
PORT=${cfg.port}
BIND_HOST=${cfg.bindHost}
REQUIRE_API_KEY=${cfg.requireApiKey}
OPEN_BROWSER=${cfg.openBrowser}`}
          </pre>
        </div>
      </div>
    </div>
  );
}