/**
 * Minimal, dependency-free, XSS-safe markdown renderer.
 * Escapes HTML first, then applies a small subset of inline + block syntax.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(s: string): string {
  return s
    .replace(/`([^`]+)`/g, (_m, c) => `<code>${c}</code>`)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

export function renderMarkdown(src: string): string {
  if (!src || !src.trim()) return "";

  const lines = escapeHtml(src).split(/\r?\n/);
  const html: string[] = [];
  let listOpen = false;
  const para: string[] = [];

  const closeList = () => {
    if (listOpen) {
      html.push("</ul>");
      listOpen = false;
    }
  };
  const flushPara = () => {
    if (para.length) {
      html.push(`<p>${inline(para.join(" "))}</p>`);
      para.length = 0;
    }
  };

  for (const raw of lines) {
    if (/^\s*$/.test(raw)) {
      closeList();
      flushPara();
      continue;
    }

    let m: RegExpMatchArray | null;
    if ((m = raw.match(/^(#{1,3})\s+(.*)$/))) {
      closeList();
      flushPara();
      const lvl = m[1].length;
      html.push(`<h${lvl}>${inline(m[2])}</h${lvl}>`);
      continue;
    }
    if ((m = raw.match(/^>\s?(.*)$/))) {
      closeList();
      flushPara();
      html.push(`<blockquote>${inline(m[1])}</blockquote>`);
      continue;
    }
    if (/^(\s*[-]){3,}\s*$/.test(raw) || /^(\s*\*){3,}\s*$/.test(raw)) {
      closeList();
      flushPara();
      html.push("<hr/>");
      continue;
    }
    if ((m = raw.match(/^\s*[-*]\s+(.*)$/))) {
      flushPara();
      if (!listOpen) {
        html.push("<ul>");
        listOpen = true;
      }
      html.push(`<li>${inline(m[1])}</li>`);
      continue;
    }

    para.push(raw);
  }

  closeList();
  flushPara();
  return html.join("\n");
}

/** Plain-text preview (first ~N chars) for note cards. */
export function plainText(md: string, max = 160): string {
  const t = md
    .replace(/[#>*_`-]/g, " ")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return t.length > max ? t.slice(0, max).trim() + "…" : t;
}
