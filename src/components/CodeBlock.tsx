"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[11px] transition-all duration-200 ${
        copied
          ? "border-mint/50 bg-mint/10 text-mint"
          : "border-line bg-panel2 text-fog hover:border-line2 hover:text-snow"
      }`}
      aria-label={copied ? "Copied" : label}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied" : label}
    </button>
  );
}

export default function CodeBlock({
  code,
  title,
  className = "",
  maxHeight = "26rem",
}: {
  code: string;
  title?: string;
  className?: string;
  maxHeight?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-xl border border-line bg-[#0d1420] ${className}`}>
      {title && (
        <div className="flex items-center justify-between border-b border-line bg-panel px-4 py-2">
          <span className="font-mono text-[11px] tracking-wide text-fog">{title}</span>
          <CopyButton text={code} />
        </div>
      )}
      <pre
        className="code-scroll overflow-auto p-4 font-mono text-[12.5px] leading-relaxed text-mist"
        style={{ maxHeight }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}