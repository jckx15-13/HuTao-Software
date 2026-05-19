import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, Copy } from 'lucide-react';

type Block =
  | { type: 'code'; language: string; value: string }
  | { type: 'heading'; level: 2 | 3; value: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'quote'; value: string }
  | { type: 'paragraph'; value: string };

const FENCE_RE = /^```(\w+)?\s*$/;

export function MarkdownMessage({ content }: { content: string }) {
  const blocks = useMemo(() => parseMarkdown(content), [content]);

  return (
    <div className="markdown-lite space-y-3">
      {blocks.map((block, index) => {
        if (block.type === 'code') {
          return <CodeBlock key={index} language={block.language} value={block.value} />;
        }
        if (block.type === 'heading') {
          const Heading = block.level === 2 ? 'h2' : 'h3';
          return (
            <Heading key={index} className="font-mono text-xs font-black uppercase tracking-[0.18em] text-primary">
              <InlineText text={block.value} />
            </Heading>
          );
        }
        if (block.type === 'list') {
          const List = block.ordered ? 'ol' : 'ul';
          return (
            <List key={index} className={`${block.ordered ? 'list-decimal' : 'list-disc'} space-y-1 pl-5`}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <InlineText text={item} />
                </li>
              ))}
            </List>
          );
        }
        if (block.type === 'quote') {
          return (
            <blockquote key={index} className="border-l-2 border-primary/40 pl-4 text-text-muted">
              <InlineText text={block.value} />
            </blockquote>
          );
        }
        return (
          <p key={index}>
            <InlineText text={block.value} />
          </p>
        );
      })}
    </div>
  );
}

function parseMarkdown(input: string): Block[] {
  const lines = input.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const fence = line.match(FENCE_RE);

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (fence) {
      const language = fence[1] || 'text';
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !FENCE_RE.test(lines[i])) {
        code.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      blocks.push({ type: 'code', language, value: code.join('\n') });
      continue;
    }

    if (line.startsWith('### ')) {
      blocks.push({ type: 'heading', level: 3, value: line.slice(4).trim() });
      i += 1;
      continue;
    }

    if (line.startsWith('## ')) {
      blocks.push({ type: 'heading', level: 2, value: line.slice(3).trim() });
      i += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      blocks.push({ type: 'quote', value: quote.join(' ') });
      continue;
    }

    const unordered = /^[-*]\s+/.test(line);
    const ordered = /^\d+[.)]\s+/.test(line);
    if (unordered || ordered) {
      const items: string[] = [];
      const itemRe = unordered ? /^[-*]\s+/ : /^\d+[.)]\s+/;
      while (i < lines.length && itemRe.test(lines[i])) {
        items.push(lines[i].replace(itemRe, '').trim());
        i += 1;
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    const paragraph: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !FENCE_RE.test(lines[i]) &&
      !lines[i].startsWith('## ') &&
      !/^>\s?/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+[.)]\s+/.test(lines[i])
    ) {
      paragraph.push(lines[i]);
      i += 1;
    }
    blocks.push({ type: 'paragraph', value: paragraph.join(' ') });
  }

  return blocks;
}

function InlineText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  const tokenRe = /(`[^`]+`|\[[^\]]+\]\((https?:\/\/[^)\s]+|mailto:[^)\s]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRe.exec(text))) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('`')) {
      nodes.push(
        <code key={match.index} className="rounded bg-black/25 px-1.5 py-0.5 font-mono text-[0.92em] text-primary">
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      const label = token.slice(1, token.indexOf(']('));
      const href = token.slice(token.indexOf('](') + 2, -1);
      nodes.push(
        <a
          key={match.index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline decoration-primary/40 underline-offset-2 transition-colors hover:text-primary-hover"
        >
          {label}
        </a>,
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return <>{nodes}</>;
}

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API is optional in local previews.
    }
  };

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-panel-border/70 bg-base/70 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-panel-border/60 bg-panel/40 px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-primary">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded bg-base/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-text-muted transition-colors hover:text-primary"
          aria-label={copied ? 'Copied to clipboard' : 'Copy code'}
        >
          {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="max-h-[400px] overflow-auto p-4 font-mono text-sm leading-relaxed text-text-main">
        <code>{value}</code>
      </pre>
    </div>
  );
}
