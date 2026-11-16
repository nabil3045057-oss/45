"use client";

import { useMemo, useState } from "react";
import { Download, FileCode2, FileText, FileCog, Terminal } from "lucide-react";
import { buildKit, DEFAULT_CONFIG } from "@/lib/launcher";
import CodeBlock from "./CodeBlock";

function iconFor(name: string) {
  if (name.endsWith(".cmd") || name.endsWith(".sh")) return <Terminal size={13} />;
  if (name.endsWith(".ps1")) return <FileCog size={13} />;
  if (name.endsWith(".env") || name.endsWith(".txt")) return <FileText size={13} />;
  return <FileCode2 size={13} />;
}

export default function FileViewer() {
  const files = useMemo(() => buildKit(DEFAULT_CONFIG), []);
  const [active, setActive] = useState(2); // start.sh
  const file = files[active];

  const downloadOne = () => {
    const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name.split("/").pop() ?? "file.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel">
      <div className="code-scroll flex gap-1 overflow-x-auto border-b border-line bg-[#0d1420] p-2">
        {files.map((f, i) => (
          <button
            key={f.name}
            type="button"
            onClick={() => setActive(i)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11.5px] transition-all duration-200 ${
              i === active
                ? "bg-ember/15 text-ember shadow-[inset_0_0_0_1px_rgba(255,145,66,0.35)]"
                : "text-fog hover:bg-raise hover:text-snow"
            }`}
          >
            {iconFor(f.name)}
            {f.name}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3">
        <p className="text-[13px] text-fog">
          <span className="font-mono text-mist">{file.name}</span>
          <span className="mx-2 text-line2">·</span>
          {file.desc}
          <span className="mx-2 text-line2">·</span>
          <span className="font-mono text-[11px]">{file.content.split("\n").length} lines</span>
        </p>
        <button
          type="button"
          onClick={downloadOne}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-panel2 px-2.5 py-1 font-mono text-[11px] text-fog transition-colors hover:border-ember/50 hover:text-ember"
        >
          <Download size={12} /> Download this file
        </button>
      </div>
      <div className="p-4 pt-3">
        <CodeBlock code={file.content} title={file.name} maxHeight="30rem" />
      </div>
    </div>
  );
}