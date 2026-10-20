// Builds the Webflow script (terms baked in) and a click-through preview page.
// Usage: node build.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(root, p), 'utf8');

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) => escapeHtml(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

// Just enough Markdown for the terms file: headings, paragraphs, bold and bullet lists.
export function markdownToHtml(md) {
  const out = [];
  let list = null;
  const closeList = () => { if (list) { out.push(`<ul>${list.join('')}</ul>`); list = null; } };
  for (const block of md.split(/\n\s*\n/)) {
    const lines = block.trim().split('\n');
    if (!lines[0]) continue;
    for (const line of lines) {
      const h = line.match(/^(#{1,3})\s+(.*)$/);
      const li = line.match(/^-\s+(.*)$/);
      if (h) { closeList(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); }
      else if (li) { (list ||= []).push(`<li>${inline(li[1])}</li>`); }
      else { closeList(); out.push(`<p>${inline(line)}</p>`); }
    }
    closeList();
  }
  return out.join('');
}

const termsHtml = markdownToHtml(read('terms/monthly-partnership-terms.md'));
const script = read('webflow/src/hp-checkout.js').replace("/*__TERMS_HTML__*/''", JSON.stringify(termsHtml));
if (script === read('webflow/src/hp-checkout.js')) throw new Error('terms placeholder not found');

mkdirSync(join(root, 'webflow/dist'), { recursive: true });
writeFileSync(join(root, 'webflow/dist/hp-checkout.js'), script);
writeFileSync(join(root, 'webflow/dist/monthly-terms.html'), termsHtml);
const sri = 'sha384-' + createHash('sha384').update(script).digest('base64');
writeFileSync(join(root, 'webflow/dist/hp-checkout.sri.txt'), sri + '\n');

// Preview: the home page pricing card as it is live today, with the script in demo mode.
const preview = read('preview/template.html')
  .replace('/*__SCRIPT__*/', () => 'window.HP_CHECKOUT={demo:true};\n' + script.replace(/<\/script/gi, '<\\/script'));
mkdirSync(join(root, 'preview/dist'), { recursive: true });
writeFileSync(join(root, 'preview/dist/index.html'), preview);

console.log('built webflow/dist/hp-checkout.js', script.length, 'bytes', sri);
