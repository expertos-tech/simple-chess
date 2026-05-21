#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function rewriteDocsPath(href) {
  if (!href) return href;
  if (typeof href !== 'string') return href;
  if (href.startsWith('docs/')) return href.slice('docs/'.length);
  return href;
}

function buildHtml({ title, bodyHtml }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #0f1220;
        --panel: #16213e;
        --border: #2a2a4a;
        --text: #e9e9ee;
        --muted: #b7b7c6;
        --accent: #e0c88a;
        --link: #8aa8e0;
        --code-bg: rgba(255, 255, 255, 0.06);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        line-height: 1.55;
      }

      .topbar {
        width: min(920px, 94vw);
        margin: 20px auto 0;
        display: flex;
        justify-content: flex-end;
      }

      .github-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9rem;
      }

      .github-link svg {
        width: 18px;
        height: 18px;
        fill: currentColor;
      }

      .wrap {
        width: min(920px, 94vw);
        margin: 28px auto 48px;
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 24px 22px;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.55);
      }

      a {
        color: var(--link);
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }

      h1,
      h2,
      h3,
      h4 {
        color: var(--accent);
        margin-top: 1.2em;
      }

      h1 {
        margin-top: 0;
        font-size: 1.9rem;
        letter-spacing: 0.5px;
      }

      code {
        background: var(--code-bg);
        padding: 0.15em 0.35em;
        border-radius: 6px;
        color: #fff;
      }

      pre {
        background: var(--code-bg);
        padding: 14px 16px;
        border-radius: 10px;
        overflow: auto;
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      pre code {
        background: transparent;
        padding: 0;
      }

      hr {
        border: none;
        border-top: 1px solid var(--border);
        margin: 22px 0;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        overflow: hidden;
        border-radius: 10px;
      }

      th,
      td {
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 8px 10px;
        text-align: left;
        vertical-align: top;
      }

      th {
        background: rgba(255, 255, 255, 0.06);
      }

      img {
        max-width: 100%;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      .footer {
        margin-top: 18px;
        color: var(--muted);
        font-size: 0.9rem;
      }
    </style>
  </head>
  <body>
    <header class="topbar">
      <a
        class="github-link"
        href="https://github.com/expertos-tech/simple-chess"
        target="_blank"
        rel="noopener"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M8 0.5C3.86 0.5 0.5 3.86 0.5 8c0 3.32 2.17 6.13 5.17 7.12.38.07.52-.17.52-.38 0-.19-.01-.82-.01-1.48-1.89.35-2.38-.46-2.53-.88-.09-.22-.48-.88-.82-1.06-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.53.28-.87.5-1.07-1.68-.19-3.44-.84-3.44-3.73 0-.82.29-1.49.77-2.02-.08-.19-.34-.96.07-2 0 0 .63-.2 2.06.77A7.14 7.14 0 0 1 8 4.77c.64 0 1.28.09 1.88.26 1.43-.97 2.06-.77 2.06-.77.41 1.04.15 1.81.07 2 .48.53.77 1.2.77 2.02 0 2.9-1.77 3.54-3.45 3.73.29.25.54.74.54 1.49 0 1.08-.01 1.95-.01 2.22 0 .21.14.46.52.38A7.52 7.52 0 0 0 15.5 8C15.5 3.86 12.14 0.5 8 0.5Z"
          />
        </svg>
        github.com/expertos-tech/simple-chess
      </a>
    </header>
    <main class="wrap">
      ${bodyHtml}
      <div class="footer">Generated from <code>README.md</code>.</div>
    </main>
  </body>
</html>
`;
}

async function main() {
  const { marked } = await import('marked');

  const repoRoot = path.join(__dirname, '..');
  const readmePath = path.join(repoRoot, 'README.md');
  const outPath = path.join(repoRoot, 'docs', 'index.html');

  marked.use({
    renderer: {
      link(href, title, text) {
        if (href && typeof href === 'object') {
          return this.link(href.href, href.title, href.text);
        }
        const safeHref = rewriteDocsPath(href);
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        return `<a href="${escapeHtml(safeHref)}"${titleAttr}>${text}</a>`;
      },
      image(href, title, text) {
        if (href && typeof href === 'object') {
          return this.image(href.href, href.title, href.text);
        }
        const safeHref = rewriteDocsPath(href);
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        const alt = escapeHtml(text || '');
        return `<img src="${escapeHtml(safeHref)}" alt="${alt}"${titleAttr} />`;
      },
    },
  });

  let readmeMd = fs.readFileSync(readmePath, 'utf8');
  // Convert "Image: docs/images/..." lines into actual embedded images for the docs site export.
  readmeMd = readmeMd.replaceAll(
    /^- Image:\s+(docs\/images\/[^\s]+)$/gm,
    (m, p1) => `- Image: ${p1}\n\n  ![](${p1})`
  );

  const htmlBody = marked.parse(readmeMd);
  const html = buildHtml({ title: 'Simple Chess 5x8', bodyHtml: htmlBody });

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf8');
  process.stdout.write(`Wrote ${outPath}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
