import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';
import type { Components } from 'react-markdown';

const markdownComponents: Components = {
  code({ children, className, ...rest }) {
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
  },
  a({ children, href, ...rest }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline decoration-primary/40 underline-offset-2 transition-colors hover:text-primary-hover hover:decoration-primary"
        {...rest}
      >
        {children}
      </a>
    );
  },
  ul({ children, ...rest }) {
    return <ul className="list-disc space-y-1 pl-6" {...rest}>{children}</ul>;
  },
  ol({ children, ...rest }) {
    return <ol className="list-decimal space-y-1 pl-6" {...rest}>{children}</ol>;
  },
  blockquote({ children, ...rest }) {
    return (
      <blockquote className="border-l-2 border-primary/40 pl-4 italic text-text-muted" {...rest}>
        {children}
      </blockquote>
    );
  },
  table({ children, ...rest }) {
    return (
      <div className="overflow-x-auto rounded-lg border border-panel-border">
        <table className="w-full text-sm" {...rest}>{children}</table>
      </div>
    );
  },
  th({ children, ...rest }) {
    return (
      <th className="border-b border-panel-border bg-panel/60 px-3 py-2 text-left font-mono text-xs uppercase tracking-wider text-text-muted" {...rest}>
        {children}
      </th>
    );
  },
  td({ children, ...rest }) {
    return (
      <td className="border-b border-panel-border/40 px-3 py-2" {...rest}>
        {children}
      </td>
    );
  },
};

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={markdownComponents}
    >
      {content}
    </ReactMarkdown>
  );
}

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — fail silently
    }
  };

  return (
    <div className="my-6 overflow-hidden rounded-lg border border-panel-border/70 bg-base/70 shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_2px_10px_rgba(255,255,255,0.02)] backdrop-blur-md transition-transform duration-300 hover:-translate-y-0.5">
      <div className="flex items-center justify-between border-b border-panel-border/60 bg-panel/40 px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-primary">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 rounded bg-base/60 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-text-muted transition-colors hover:text-primary"
          aria-label={copied ? 'Copied to clipboard' : 'Copy code'}
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
