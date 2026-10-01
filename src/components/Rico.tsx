// Texto com formatação leve: **negrito**, `código`, $fórmula$ (KaTeX), listas com "- " e parágrafos.
import katex from 'katex';
import type { ReactNode } from 'react';
import { SELOS, type Selo } from '../engine/types';

export function Tex({ children, bloco }: { children: string; bloco?: boolean }) {
  const html = katex.renderToString(children, { throwOnError: false, displayMode: !!bloco, output: 'html' });
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function inline(bruto: string, kp: string): ReactNode[] {
  // "R$ 25" não é fórmula: protege o cifrão de dinheiro antes de procurar $...$.
  const txt = bruto.replace(/R\$/g, 'R');
  const volta = (s: string) => s.replace(//g, '$');
  const out: ReactNode[] = [];
  const re = /(\$[^$]+\$|\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0, m: RegExpExecArray | null, k = 0;
  while ((m = re.exec(txt))) {
    if (m.index > last) out.push(volta(txt.slice(last, m.index)));
    const t = m[0];
    if (t[0] === '$') out.push(<Tex key={kp + k++}>{t.slice(1, -1)}</Tex>);
    else if (t[0] === '*') out.push(<strong key={kp + k++}>{inline(volta(t.slice(2, -2)), kp + k + 'b')}</strong>);
    else out.push(<code key={kp + k++}>{volta(t.slice(1, -1))}</code>);
    last = m.index + t.length;
  }
  if (last < txt.length) out.push(volta(txt.slice(last)));
  return out;
}

export function Rico({ children, className }: { children: string; className?: string }) {
  const blocos = children.trim().split(/\n\s*\n/);
  return (
    <div className={'rico ' + (className ?? '')}>
      {blocos.map((b, i) => {
        const linhas = b.split('\n').map((l) => l.trim()).filter(Boolean);
        if (linhas.every((l) => l.startsWith('- '))) {
          return <ul key={i}>{linhas.map((l, j) => <li key={j}>{inline(l.slice(2), `${i}-${j}-`)}</li>)}</ul>;
        }
        if (linhas.length === 1 && linhas[0].startsWith('$$') && linhas[0].endsWith('$$')) {
          // Fórmulas lado a lado (separadas por \qquad) viram uma embaixo da outra: cabe no celular.
          const tex = linhas[0].slice(2, -2);
          const partes = tex.includes('\\begin') ? [tex] : tex.split(/(?:\\qquad\s*)+/).map((t) => t.trim()).filter(Boolean);
          return <div key={i} className="regra">{partes.map((t, j) => <div key={j}><Tex bloco>{t}</Tex></div>)}</div>;
        }
        return <p key={i}>{inline(linhas.join(' '), `${i}-`)}</p>;
      })}
    </div>
  );
}

/** Linha única com formatação (para rótulos, alternativas, títulos). */
export function Txt({ children }: { children: string }) {
  return <>{inline(children, 't')}</>;
}

export function SeloTag({ tipo, nota }: { tipo: Selo; nota?: string }) {
  return (
    <>
      <span className={'selo ' + tipo} title={SELOS[tipo].explica}>{SELOS[tipo].rotulo}</span>
      {nota && <div className={'selo-nota ' + tipo}><Txt>{nota}</Txt></div>}
    </>
  );
}
