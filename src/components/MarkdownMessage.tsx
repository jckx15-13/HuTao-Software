import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code(props) {
          const { children, className, node, ...rest } = props;
          const match = /language-(\w+)/.exec(className || '');
          const isInline = !match && !className?.includes('language-');
          
          if (isInline) {
            return (
              <code className="bg-black/20 px-1.5 py-0.5 rounded text-sm font-mono text-primary-text" {...rest}>
                {children}
              </code>
            );
          }

          return (
            <CodeBlock 
              language={match ? match[1] : 'text'} 
              value={String(children).replace(/\n$/, '')} 
            />
          );
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function CodeBlock({ language, value }: { language: string, value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 overflow-hidden rounded-lg border border-panel-border/70 bg-base/70 shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_2px_10px_rgba(255,255,255,0.02)] backdrop-blur-md transition-transform duration-300 hover:-translate-y-0.5">
      <div className="flex items-center justify-between border-b border-panel-border/60 bg-panel/40 px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-primary">{language}</span>
        <button 
          onClick={() => handleCopy().catch(() => undefined)}
          className="flex items-center gap-2 rounded bg-base/60 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-text-muted transition-colors hover:text-primary"
        >
          {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="max-h-[400px] overflow-auto p-4 font-mono text-sm leading-relaxed text-text-main">
        <code className={`language-${language}`}>{value}</code>
      </pre>
    </div>
  );
}
