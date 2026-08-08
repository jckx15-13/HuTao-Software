/**
 * A small, real translator between Python, JavaScript, pseudocode and flowchart
 * structure.
 *
 * Scope is deliberately bounded: this handles the control-flow constructs a
 * teaching flowchart actually needs — functions, if/elif/else, for, while,
 * print, assignment, return, calls and comments. It is not a general-purpose
 * transpiler and does not attempt expression-level translation beyond a few
 * well-defined token swaps. Anything it cannot classify is carried through
 * verbatim as a `raw` statement so nothing is silently dropped.
 */

export type Lang = 'python' | 'javascript' | 'pseudocode';

export type StmtKind =
  | 'func'
  | 'if'
  | 'elif'
  | 'else'
  | 'for'
  | 'while'
  | 'print'
  | 'assign'
  | 'return'
  | 'call'
  | 'comment'
  | 'raw';

export interface Stmt {
  kind: StmtKind;
  /** The meaningful payload: a condition, an expression, a signature. */
  text: string;
  children: Stmt[];
}

interface Line {
  depth: number;
  text: string;
}

/* ------------------------------------------------------------------ parsing */

/** Splits source into (depth, text) pairs, blank lines removed. */
function toLines(src: string, braceBased: boolean): Line[] {
  const out: Line[] = [];
  let depth = 0;

  for (const rawLine of src.split('\n')) {
    const trimmed = rawLine.trim();
    if (trimmed === '') continue;

    if (braceBased) {
      // A closing brace only ends a block; it carries no statement of its own.
      const closers = (trimmed.match(/^[})\]]+/) ?? [''])[0].length;
      depth = Math.max(0, depth - closers);

      const body = trimmed.replace(/^[})\]]+\s*/, '').replace(/\s*\{\s*$/, '');
      if (body !== '') out.push({ depth, text: body });

      // Count braces outside of string literals so `"{"` doesn't shift depth.
      const stripped = trimmed.replace(/(["'`])(?:\\.|(?!\1).)*\1/g, '');
      const opens = (stripped.match(/\{/g) ?? []).length;
      const closes = (stripped.match(/\}/g) ?? []).length;
      depth = Math.max(0, depth + opens - Math.max(0, closes - closers));
    } else {
      const indent = rawLine.match(/^[ \t]*/)![0].replace(/\t/g, '    ').length;
      out.push({ depth: Math.floor(indent / 4), text: trimmed });
    }
  }
  return out;
}

/** Removes one balanced pair of outer parens, if present. */
function stripOuterParens(text: string): string {
  const t = text.trim().replace(/[:{]\s*$/, '').trim();
  if (!t.startsWith('(') || !t.endsWith(')')) return t;

  let depth = 0;
  for (let i = 0; i < t.length; i++) {
    if (t[i] === '(') depth++;
    else if (t[i] === ')') {
      depth--;
      // The opening paren closes before the end, so it isn't a wrapper.
      if (depth === 0 && i < t.length - 1) return t;
    }
  }
  return t.slice(1, -1).trim();
}

/** Normalises a condition: drops trailing `:`/`{`, wrapper parens, THEN, and DO. */
function cleanCondition(text: string): string {
  const t = text.trim().replace(/[:{]\s*$/, '').replace(/\s+(THEN|DO)\s*$/i, '').trim();
  return stripOuterParens(t);
}

function classify(text: string): { kind: StmtKind; payload: string } {
  const t = text.replace(/;$/, '').trim();

  if (/^(#|\/\/)/.test(t)) return { kind: 'comment', payload: t.replace(/^(#|\/\/)\s?/, '') };
  if (/^(def |function |FUNCTION )/i.test(t))
    return {
      kind: 'func',
      payload: t.replace(/^(def |function |FUNCTION )/i, '').replace(/[:{]$/, '').trim(),
    };
  if (/^(elif |else if |ELSE IF |ELIF )/i.test(t))
    return { kind: 'elif', payload: cleanCondition(t.replace(/^(elif |else if |ELSE IF |ELIF )/i, '')) };
  if (/^(else|ELSE)\b/i.test(t)) return { kind: 'else', payload: '' };
  if (/^(if |IF )/i.test(t)) return { kind: 'if', payload: cleanCondition(t.replace(/^(if |IF )/i, '')) };
  if (/^(for |FOR |REPEAT )/i.test(t))
    return { kind: 'for', payload: cleanCondition(t.replace(/^(for |FOR |REPEAT )/i, '')) };
  if (/^(while |WHILE )/i.test(t))
    return { kind: 'while', payload: cleanCondition(t.replace(/^(while |WHILE )/i, '')) };
  if (/^(print|console\.log|PRINT|DISPLAY|OUTPUT)\b/i.test(t)) {
    const inner = t.replace(/^(print|console\.log|PRINT|DISPLAY|OUTPUT)\s*/i, '');
    return { kind: 'print', payload: stripOuterParens(inner) };
  }
  if (/^(return|RETURN)\b/i.test(t))
    return { kind: 'return', payload: t.replace(/^(return|RETURN)\s*/i, '') };
  if (/^(let |const |var |SET )/i.test(t) || /^[A-Za-z_$][\w$]*\s*=[^=]/.test(t))
    return { kind: 'assign', payload: t.replace(/^(let |const |var |SET )/i, '') };
  if (/^[\w$.]+\s*\(/.test(t)) return { kind: 'call', payload: t };

  return { kind: 'raw', payload: t };
}

/** Builds the statement tree from the flat depth-tagged line list. */
function build(lines: Line[], start: number, depth: number): [Stmt[], number] {
  const out: Stmt[] = [];
  let i = start;

  while (i < lines.length && lines[i].depth >= depth) {
    if (lines[i].depth > depth) {
      // Defensive: an over-indented orphan attaches to the previous statement
      // rather than being discarded.
      const [kids, next] = build(lines, i, lines[i].depth);
      if (out.length > 0) out[out.length - 1].children.push(...kids);
      i = next;
      continue;
    }

    const { kind, payload } = classify(lines[i].text);
    const stmt: Stmt = { kind, text: payload, children: [] };
    i++;

    if (i < lines.length && lines[i].depth > depth) {
      const [kids, next] = build(lines, i, lines[i].depth);
      stmt.children = kids;
      i = next;
    }
    out.push(stmt);
  }
  return [out, i];
}

export function parseCode(src: string, lang: Lang): Stmt[] {
  const lines = toLines(src, lang === 'javascript');
  return build(lines, 0, 0)[0];
}

/* --------------------------------------------------------------- generating */

/** Token-level swaps between the three surface syntaxes. */
function expr(text: string, to: Lang): string {
  let t = text;

  if (to === 'python') {
    t = t.replace(/&&/g, ' and ').replace(/\|\|/g, ' or ');
    t = t.replace(/\btrue\b/g, 'True').replace(/\bfalse\b/g, 'False');
    t = t.replace(/\bAND\b/g, 'and').replace(/\bOR\b/g, 'or').replace(/\bNOT\b/g, 'not');
    // `${x}` template holes become f-string holes; the f prefix is added below.
    if (/`/.test(t)) t = 'f"' + t.replace(/`/g, '').replace(/\$\{([^}]*)\}/g, '{$1}') + '"';
  } else if (to === 'javascript') {
    t = t.replace(/\band\b|\bAND\b/g, '&&').replace(/\bor\b|\bOR\b/g, '||');
    t = t.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false');
    // An f-string is not valid JS — promote it to a template literal, and turn
    // `{x}` holes into `${x}` or they render literally instead of interpolating.
    const toTemplate = (body: string) => '`' + body.replace(/(?<!\$)\{([^}]*)\}/g, '${$1}') + '`';
    t = t.replace(/\bf"([^"]*)"/g, (_m, body: string) => toTemplate(body));
    t = t.replace(/\bf'([^']*)'/g, (_m, body: string) => toTemplate(body));
  } else {
    t = t.replace(/&&/g, ' AND ').replace(/\|\|/g, ' OR ');
    t = t.replace(/\band\b/g, 'AND').replace(/\bor\b/g, 'OR').replace(/\bnot\b/g, 'NOT');
  }
  return t.replace(/\s+/g, ' ').trim();
}

/**
 * Rewrites a for-loop header between the three iteration syntaxes.
 * Only the collection-iteration form is converted; a C-style three-clause
 * header has no clean equivalent, so it is passed through unchanged.
 */
function forHeader(text: string, to: Lang): string {
  const t = text.trim();
  const each = /^(?:const |let |var )?([A-Za-z_$][\w$]*)\s+(?:of|in)\s+(.+)$/.exec(t);
  if (!each) return expr(t, to);

  const [, name, iterable] = each;
  if (to === 'javascript') return `const ${name} of ${iterable}`;
  if (to === 'python') return `${name} in ${iterable}`;
  return `EACH ${name} IN ${iterable}`;
}

function emit(stmts: Stmt[], to: Lang, level: number): string[] {
  const out: string[] = [];
  const pad = to === 'python' ? '    '.repeat(level) : '  '.repeat(level);

  // Index-based rather than for-of: an `if` has to consume its trailing
  // elif/else siblings so that pseudocode's END IF lands after the whole
  // chain instead of splitting it.
  let i = 0;
  while (i < stmts.length) {
    const s = stmts[i];
    const body = () => emit(s.children, to, level + 1);
    const e = (x: string) => expr(x, to);

    switch (s.kind) {
      case 'comment':
        out.push(`${pad}${to === 'python' ? '#' : '//'} ${s.text}`);
        break;

      case 'func':
        if (to === 'python') out.push(`${pad}def ${s.text}:`);
        else if (to === 'javascript') out.push(`${pad}function ${s.text} {`);
        else out.push(`${pad}FUNCTION ${s.text}`);
        out.push(...body());
        if (to === 'javascript') out.push(`${pad}}`);
        if (to === 'pseudocode') out.push(`${pad}END FUNCTION`);
        break;

      case 'if': {
        const open = (kind: 'if' | 'elif' | 'else', cond: string) => {
          const word = {
            if: { python: 'if', javascript: 'if', pseudocode: 'IF' }[to],
            elif: { python: 'elif', javascript: 'else if', pseudocode: 'ELSE IF' }[to],
            else: { python: 'else', javascript: 'else', pseudocode: 'ELSE' }[to],
          }[kind];

          if (kind === 'else') {
            out.push(`${pad}${word}${to === 'python' ? ':' : to === 'javascript' ? ' {' : ''}`);
          } else if (to === 'python') out.push(`${pad}${word} ${expr(cond, to)}:`);
          else if (to === 'javascript') out.push(`${pad}${word} (${expr(cond, to)}) {`);
          else out.push(`${pad}${word} ${expr(cond, to)} THEN`);
        };

        open('if', s.text);
        out.push(...emit(s.children, to, level + 1));
        if (to === 'javascript') out.push(`${pad}}`);

        // Absorb the rest of the chain.
        while (i + 1 < stmts.length && (stmts[i + 1].kind === 'elif' || stmts[i + 1].kind === 'else')) {
          const branch = stmts[++i];
          open(branch.kind as 'elif' | 'else', branch.text);
          out.push(...emit(branch.children, to, level + 1));
          if (to === 'javascript') out.push(`${pad}}`);
        }

        if (to === 'pseudocode') out.push(`${pad}END IF`);
        break;
      }

      // Reached only if an elif/else appears without a preceding if; emitted
      // standalone rather than dropped.
      case 'elif':
      case 'else': {
        const word =
          s.kind === 'elif'
            ? { python: 'elif', javascript: 'else if', pseudocode: 'ELSE IF' }[to]
            : { python: 'else', javascript: 'else', pseudocode: 'ELSE' }[to];
        if (s.kind === 'else') {
          out.push(`${pad}${word}${to === 'python' ? ':' : to === 'javascript' ? ' {' : ''}`);
        } else if (to === 'python') out.push(`${pad}${word} ${e(s.text)}:`);
        else if (to === 'javascript') out.push(`${pad}${word} (${e(s.text)}) {`);
        else out.push(`${pad}${word} ${e(s.text)} THEN`);
        out.push(...body());
        if (to === 'javascript') out.push(`${pad}}`);
        break;
      }

      case 'for':
        if (to === 'python') out.push(`${pad}for ${forHeader(s.text, to)}:`);
        else if (to === 'javascript') out.push(`${pad}for (${forHeader(s.text, to)}) {`);
        else out.push(`${pad}FOR ${forHeader(s.text, to)} DO`);
        out.push(...body());
        if (to === 'javascript') out.push(`${pad}}`);
        if (to === 'pseudocode') out.push(`${pad}END FOR`);
        break;

      case 'while':
        if (to === 'python') out.push(`${pad}while ${e(s.text)}:`);
        else if (to === 'javascript') out.push(`${pad}while (${e(s.text)}) {`);
        else out.push(`${pad}WHILE ${e(s.text)} DO`);
        out.push(...body());
        if (to === 'javascript') out.push(`${pad}}`);
        if (to === 'pseudocode') out.push(`${pad}END WHILE`);
        break;

      case 'print':
        if (to === 'python') out.push(`${pad}print(${e(s.text)})`);
        else if (to === 'javascript') out.push(`${pad}console.log(${e(s.text)});`);
        else out.push(`${pad}PRINT ${e(s.text)}`);
        out.push(...body());
        break;

      case 'assign':
        if (to === 'python') out.push(`${pad}${e(s.text)}`);
        else if (to === 'javascript') out.push(`${pad}let ${e(s.text)};`);
        else out.push(`${pad}SET ${e(s.text)}`);
        out.push(...body());
        break;

      case 'return':
        if (to === 'pseudocode') out.push(`${pad}RETURN ${e(s.text)}`);
        else out.push(`${pad}return ${e(s.text)}${to === 'javascript' ? ';' : ''}`);
        out.push(...body());
        break;

      default:
        out.push(`${pad}${e(s.text)}${to === 'javascript' ? ';' : ''}`);
        out.push(...body());
    }
    i++;
  }
  return out;
}

export function generate(ast: Stmt[], to: Lang): string {
  if (ast.length === 0) return '';
  const lines = emit(ast, to, 0);
  if (to === 'pseudocode') return ['START', ...lines.map((l) => '  ' + l), 'END'].join('\n');
  return lines.join('\n');
}

/* ---------------------------------------------------------------- flowchart */

export interface FlowNode {
  id: string;
  label: string;
  type: 'start' | 'end' | 'process' | 'decision' | 'io';
}
export interface FlowEdge {
  from: string;
  to: string;
  label?: string;
}

function truncate(text: string, max = 28): string {
  return text.length <= max ? text : text.slice(0, max - 1) + '…';
}

function labelFor(s: Stmt): string {
  if (s.kind === 'print') return `Output ${s.text}`;
  if (s.kind === 'return') return `Return ${s.text}`;
  return s.text;
}

/**
 * Flattens the statement tree into flowchart nodes and edges.
 *
 * Branches rejoin at the next statement after the conditional, which is what
 * makes the output read as a flowchart rather than a tree.
 */
export function toFlowchart(ast: Stmt[]): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const nodes: FlowNode[] = [{ id: 'start', label: 'Start', type: 'start' }];
  const edges: FlowEdge[] = [];
  let seq = 0;
  const id = () => `n${++seq}`;

  /** Walks a block, returning the ids left dangling for the caller to join. */
  function walk(
    stmts: Stmt[],
    incoming: Array<{ id: string; label?: string }>,
  ): Array<{ id: string; label?: string }> {
    let open = incoming;

    for (const s of stmts) {
      if (s.kind === 'comment') continue;

      if (s.kind === 'if' || s.kind === 'while' || s.kind === 'for') {
        const d = id();
        // Loop headers are shown in the reader-friendly pseudocode form rather
        // than raw source syntax, since the diagram is language-neutral.
        const label =
          s.kind === 'if'
            ? s.text
            : s.kind === 'while'
              ? `while ${s.text}`
              : `for ${forHeader(s.text, 'pseudocode')}`;
        nodes.push({ id: d, label: truncate(label), type: 'decision' });
        for (const o of open) edges.push({ from: o.id, to: d, label: o.label });

        const trueEnds = walk(s.children, [{ id: d, label: 'yes' }]);

        if (s.kind === 'while' || s.kind === 'for') {
          // Loop body flows back to the test; the "no" branch continues on.
          for (const t of trueEnds) edges.push({ from: t.id, to: d, label: t.label });
          open = [{ id: d, label: 'no' }];
        } else {
          open = [...trueEnds, { id: d, label: 'no' }];
        }
        continue;
      }

      if (s.kind === 'elif' || s.kind === 'else') {
        // Attach to whichever branch is currently dangling as "no".
        const ends = walk(
          s.children,
          open.filter((o) => o.label === 'no'),
        );
        open = [...open.filter((o) => o.label !== 'no'), ...ends];
        continue;
      }

      if (s.kind === 'func') {
        open = walk(s.children, open);
        continue;
      }

      const nid = id();
      nodes.push({
        id: nid,
        label: truncate(labelFor(s)),
        type: s.kind === 'print' ? 'io' : 'process',
      });
      for (const o of open) edges.push({ from: o.id, to: nid, label: o.label });
      open = [{ id: nid }];

      if (s.children.length > 0) open = walk(s.children, open);
    }
    return open;
  }

  const tail = walk(ast, [{ id: 'start' }]);
  nodes.push({ id: 'end', label: 'End', type: 'end' });
  for (const t of tail) edges.push({ from: t.id, to: 'end', label: t.label });

  return { nodes, edges };
}

/** Convenience wrapper used by the UI. */
export function translate(src: string, from: Lang, to: Lang): string {
  return generate(parseCode(src, from), to);
}

/* --------------------------------------------------------- blocks / SPIKE */

/**
 * Two more output targets, both text-only.
 *
 * Neither has a parser: BlockPy-style block script and SPIKE Prime MicroPython
 * are generated FROM an AST, never read back into one. Faking a parser for
 * either would be worse than not having the feature, so `Target` only ever
 * appears on the "to" side of a conversion.
 */
export type Target = Lang | 'blocks' | 'spike';

/**
 * Turns an f-string into a "join" chain: `f"Hi, {name}"` becomes
 * `(join "Hi, " name)`. Anything that isn't an f-string literal falls back to
 * the plain pseudocode-style expression rendering.
 */
function toJoinExpr(text: string): string {
  const m = /^f(["'])([\s\S]*)\1$/.exec(text.trim());
  if (!m) return expr(text, 'pseudocode');

  const body = m[2];
  const parts: string[] = [];
  let last = 0;
  const hole = /\{([^}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = hole.exec(body))) {
    if (match.index > last) parts.push(JSON.stringify(body.slice(last, match.index)));
    parts.push(match[1].trim());
    last = match.index + match[0].length;
  }
  if (last < body.length) parts.push(JSON.stringify(body.slice(last)));

  if (parts.length === 0) return '""';
  if (parts.length === 1) return parts[0];
  return '(join ' + parts.join(' ') + ')';
}

/** `x = y` -> `set x to y`; anything else is passed through as a bare `set`. */
function blocksAssign(text: string): string {
  const m = /^([A-Za-z_$][\w$]*)\s*=\s*(.+)$/.exec(text);
  return m ? `set ${m[1]} to ${expr(m[2], 'pseudocode')}` : `set ${expr(text, 'pseudocode')}`;
}

function blocksForHeader(text: string): string {
  const each = /^(?:const |let |var )?([A-Za-z_$][\w$]*)\s+(?:of|in)\s+(.+)$/.exec(text.trim());
  return each ? `each ${each[1]} in ${each[2]}` : expr(text, 'pseudocode');
}

function emitBlocks(stmts: Stmt[], level: number): string[] {
  const out: string[] = [];
  const pad = '  '.repeat(level);

  let i = 0;
  while (i < stmts.length) {
    const s = stmts[i];
    const body = () => emitBlocks(s.children, level + 1);

    switch (s.kind) {
      case 'comment':
        out.push(`${pad}// ${s.text}`);
        break;

      case 'func':
        out.push(`${pad}define ${s.text}`);
        out.push(...body());
        out.push(`${pad}end define`);
        break;

      case 'if': {
        out.push(`${pad}if ${expr(s.text, 'pseudocode')} then`);
        out.push(...emitBlocks(s.children, level + 1));

        while (i + 1 < stmts.length && (stmts[i + 1].kind === 'elif' || stmts[i + 1].kind === 'else')) {
          const branch = stmts[++i];
          out.push(
            branch.kind === 'elif'
              ? `${pad}else if ${expr(branch.text, 'pseudocode')} then`
              : `${pad}else`,
          );
          out.push(...emitBlocks(branch.children, level + 1));
        }
        out.push(`${pad}end if`);
        break;
      }

      // Reached only if an elif/else has no preceding if; emitted standalone.
      case 'elif':
        out.push(`${pad}else if ${expr(s.text, 'pseudocode')} then`);
        out.push(...body());
        break;
      case 'else':
        out.push(`${pad}else`);
        out.push(...body());
        break;

      case 'for':
        out.push(`${pad}repeat for ${blocksForHeader(s.text)}`);
        out.push(...body());
        out.push(`${pad}end repeat`);
        break;

      case 'while':
        out.push(`${pad}repeat while ${expr(s.text, 'pseudocode')}`);
        out.push(...body());
        out.push(`${pad}end repeat`);
        break;

      case 'print':
        out.push(`${pad}say ${toJoinExpr(s.text)}`);
        out.push(...body());
        break;

      case 'assign':
        out.push(`${pad}${blocksAssign(s.text)}`);
        out.push(...body());
        break;

      case 'return':
        out.push(`${pad}report ${expr(s.text, 'pseudocode')}`);
        out.push(...body());
        break;

      default:
        out.push(`${pad}run ${expr(s.text, 'pseudocode')}`);
        out.push(...body());
    }
    i++;
  }
  return out;
}

export function generateBlocks(ast: Stmt[]): string {
  if (ast.length === 0) return '';
  return ['when program starts', ...emitBlocks(ast, 1)].join('\n');
}

/** `greet(name)` -> `name`; the piece a wrapping `async def main(...)` needs. */
function extractParams(signature: string): string {
  const m = /\(([^)]*)\)/.exec(signature);
  return m ? m[1] : '';
}

/** Fills an empty block with `pass` so the emitted Python stays valid. */
function pyBody(lines: string[], pad: string): string[] {
  return lines.length > 0 ? lines : [`${pad}    pass`];
}

/**
 * SPIKE Prime bodies are plain MicroPython, so this mirrors the python case in
 * emit() rather than reusing it directly — the two need different leaf
 * handling (print -> light_matrix.write) and duplicating the small
 * if/elif/else absorb logic here keeps the tested Lang path untouched.
 */
function emitSpikeBody(stmts: Stmt[], level: number): string[] {
  const out: string[] = [];
  const pad = '    '.repeat(level);
  const e = (x: string) => expr(x, 'python');

  let i = 0;
  while (i < stmts.length) {
    const s = stmts[i];
    const body = () => pyBody(emitSpikeBody(s.children, level + 1), pad);

    switch (s.kind) {
      case 'comment':
        out.push(`${pad}# ${s.text}`);
        break;

      case 'func':
        out.push(`${pad}def ${s.text}:`);
        out.push(...body());
        break;

      case 'if': {
        out.push(`${pad}if ${e(s.text)}:`);
        out.push(...pyBody(emitSpikeBody(s.children, level + 1), pad));

        while (i + 1 < stmts.length && (stmts[i + 1].kind === 'elif' || stmts[i + 1].kind === 'else')) {
          const branch = stmts[++i];
          out.push(branch.kind === 'elif' ? `${pad}elif ${e(branch.text)}:` : `${pad}else:`);
          out.push(...pyBody(emitSpikeBody(branch.children, level + 1), pad));
        }
        break;
      }

      case 'elif':
        out.push(`${pad}elif ${e(s.text)}:`);
        out.push(...body());
        break;
      case 'else':
        out.push(`${pad}else:`);
        out.push(...body());
        break;

      case 'for':
        out.push(`${pad}for ${forHeader(s.text, 'python')}:`);
        out.push(...body());
        break;

      case 'while':
        out.push(`${pad}while ${e(s.text)}:`);
        out.push(...body());
        break;

      case 'print':
        out.push(`${pad}light_matrix.write(${e(s.text)})`);
        out.push(...emitSpikeBody(s.children, level + 1));
        break;

      case 'assign':
        out.push(`${pad}${e(s.text)}`);
        out.push(...emitSpikeBody(s.children, level + 1));
        break;

      case 'return':
        out.push(`${pad}return ${e(s.text)}`);
        out.push(...emitSpikeBody(s.children, level + 1));
        break;

      default:
        out.push(`${pad}${e(s.text)}`);
        out.push(...emitSpikeBody(s.children, level + 1));
    }
    i++;
  }
  return out;
}

export function generateSpike(ast: Stmt[]): string {
  if (ast.length === 0) return '';

  const header = ['from hub import light_matrix, motion_sensor', 'import runloop', ''];

  // A single top-level function becomes the entry point; anything else runs
  // inside main() as-is, which covers both a `def greet(...):` script and a
  // flat sequence of statements.
  const isSingleFunc = ast.length === 1 && ast[0].kind === 'func';
  const body = isSingleFunc ? ast[0].children : ast;
  const params = isSingleFunc ? extractParams(ast[0].text) : '';

  const lines = [`async def main(${params}):`, ...pyBody(emitSpikeBody(body, 1), '')];

  return [...header, ...lines, '', 'runloop.run(main())'].join('\n');
}

export function generateTarget(ast: Stmt[], target: Target): string {
  if (target === 'blocks') return generateBlocks(ast);
  if (target === 'spike') return generateSpike(ast);
  return generate(ast, target);
}

/** Convenience wrapper covering all five targets, including blocks/SPIKE. */
export function translateTo(src: string, from: Lang, to: Target): string {
  return generateTarget(parseCode(src, from), to);
}
