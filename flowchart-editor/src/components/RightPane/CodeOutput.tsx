import { Copy, Download } from 'lucide-react';
import { useState } from 'react';

interface CodeOutputProps {
  language: 'python' | 'javascript' | 'pseudocode';
}

const SAMPLE_CODE: Record<string, string> = {
  python: `def flowchart():
    print("Start")
    # Process
    x = 0
    x = x + 1
    print(f"Result: {x}")
    # End
    return x
`,
  javascript: `function flowchart() {
  console.log("Start");
  // Process
  let x = 0;
  x = x + 1;
  console.log(\`Result: \${x}\`);
  // End
  return x;
}
`,
  pseudocode: `START
  PRINT "Start"
  SET x = 0
  x = x + 1
  PRINT x
END
`,
};

const LANGUAGE_LABEL: Record<CodeOutputProps['language'], string> = {
  python: 'Python',
  javascript: 'JavaScript',
  pseudocode: 'Pseudocode',
};

export default function CodeOutput({ language }: CodeOutputProps) {
  const [copied, setCopied] = useState(false);
  const code = SAMPLE_CODE[language];
  const lines = code.replace(/\n$/, '').split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-200">
            {LANGUAGE_LABEL[language]}
          </h2>
        </div>
        <div className="flex gap-1">
          <button
            onClick={handleCopy}
            className="relative p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4" />
            {copied && (
              <span className="absolute -bottom-7 right-0 whitespace-nowrap px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-[11px] text-cyan-300 shadow-lg">
                Copied
              </span>
            )}
          </button>
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <pre className="flex-1 overflow-auto font-mono text-xs leading-relaxed bg-slate-900/30">
        <code className="grid grid-cols-[3rem_1fr] gap-x-3 px-4 py-4">
          {lines.map((line, i) => (
            <span key={i} className="contents">
              <span className="select-none text-right text-slate-600">{i + 1}</span>
              <span className="text-slate-300 whitespace-pre">{line || ' '}</span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
