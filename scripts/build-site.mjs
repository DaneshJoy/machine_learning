import Ajv from 'ajv';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lessonPages = {
  'regression-concepts': '01_regression_concepts.html',
  'sklearn-datasets': 'sklearn_datasets.html',
};
const lessonCodes = {
  'regression-concepts': ['01_regression_synthetic_data.ipynb'],
};

const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const fa = (value) => String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[digit]);

const themeScript = `<script>(function(){var t;try{t=localStorage.getItem('theme')}catch(e){}if(t!=='light'&&t!=='dark')t=(window.matchMedia&&matchMedia('(prefers-color-scheme: light)').matches)?'light':'dark';document.documentElement.setAttribute('data-theme',t);})();</script>`;
const themeToggle = `<button class="theme-toggle" type="button" aria-label="تغییر پوسته"><svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41"/></svg><svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5 6.5 6.5 0 0 0 20.5 14.5Z"/></svg></button>`;

const style = `<style>
:root{color-scheme:dark;--navy:#0D1B2A;--navy-light:#152234;--navy-card:#1A2B3C;--cyan:#00D4FF;--cyan-dim:rgba(0,212,255,.12);--text:#E2EAF4;--text-muted:#8AA0B8;--border:rgba(255,255,255,.07);--hero-bg:linear-gradient(135deg,#0D1B2A 0%,#0a2540 50%,#0D1B2A 100%);--shadow:0 8px 24px rgba(0,0,0,.28);--radius:12px;--font:'Vazirmatn',system-ui,sans-serif}
:root[data-theme="light"]{color-scheme:light;--navy:#F4F7FB;--navy-light:#E8EEF6;--navy-card:#FFF;--cyan:#0369A1;--cyan-dim:rgba(3,105,161,.09);--text:#14263A;--text-muted:#526579;--border:rgba(15,35,60,.12);--hero-bg:linear-gradient(135deg,#F4F7FB 0%,#DCEBFA 50%,#F4F7FB 100%);--shadow:0 8px 24px rgba(30,40,70,.1)}
*{box-sizing:border-box}body{margin-block:0;margin-inline:0;min-block-size:100dvh;background:var(--navy);color:var(--text);font-family:var(--font);line-height:1.8}a{color:inherit}.shell{max-inline-size:75rem;margin-inline:auto;padding-block:1.5rem;padding-inline:1.25rem}.catalog-tabs{display:flex;gap:0;overflow-inline:auto;border-block-end:2px solid var(--border)}.catalog-tabs a{flex:1 0 auto;max-inline-size:20rem;display:flex;align-items:center;justify-content:center;border-block-end:2px solid transparent;color:var(--text-muted);padding-block:.75rem calc(.75rem + 2px);padding-inline:1rem;font-weight:600;text-decoration:none;transition:color .2s,border-color .2s}.catalog-tabs a:hover{color:var(--text)}.catalog-tabs a[aria-current=page]{border-block-end-color:var(--cyan);color:var(--cyan)}.theme-toggle{position:fixed;inset-block-start:14px;inset-inline-end:16px;z-index:110;display:grid;place-items:center;inline-size:40px;block-size:40px;padding-block:0;padding-inline:0;border:1px solid var(--border);border-radius:50%;background:var(--navy-card);color:var(--text);cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.15)}.theme-toggle:hover{color:var(--cyan);border-color:var(--cyan)}.theme-toggle svg{inline-size:20px;block-size:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}:root[data-theme="light"] .icon-moon,:root[data-theme="dark"] .icon-sun{display:none}:root[data-theme="light"] .icon-sun,:root[data-theme="dark"] .icon-moon{display:block}.theme-toggle:focus-visible,.catalog-tabs a:focus-visible,.session-card:focus-visible{outline:2px solid var(--cyan);outline-offset:3px}.hero{margin-block:2.5rem 3rem;margin-inline:0;padding-block:clamp(1.5rem,5vw,3.5rem);padding-inline:clamp(1.5rem,5vw,3.5rem);background:var(--hero-bg);border:1px solid var(--border);border-radius:var(--radius);text-align:center}.hero-badge{display:inline-block;margin-block-end:1rem;padding-block:.2rem;padding-inline:.85rem;border:1px solid var(--cyan);border-radius:99px;background:var(--cyan-dim);color:var(--cyan);font-size:.85rem}.hero h1{margin-block:.25rem .75rem;font-size:clamp(2rem,6vw,3.5rem);line-height:1.2}.hero p{max-inline-size:42rem;margin-block:0;margin-inline:auto;color:var(--text-muted)}.meta-row{display:flex;justify-content:center;margin-block-start:1.5rem}.meta-pill{padding-block:.35rem;padding-inline:.9rem;border:1px solid var(--border);border-radius:8px;background:var(--navy-light);color:var(--text-muted)}.meta-pill span{color:var(--cyan);font-weight:700}.section-title{margin-block:0 1rem;font-size:1.5rem}.session-list,.code-list{display:grid;gap:1rem;list-style:none;margin-block:0 2rem;margin-inline:0;padding-block:0;padding-inline:0}.session-list{grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))}.session-card,.code-list li{display:flex;align-items:center;gap:.875rem;padding-block:1rem;padding-inline:1.25rem;border:1px solid var(--border);border-radius:var(--radius);background:var(--navy-card);text-decoration:none}.session-card{transition:transform .2s,border-color .2s}.session-card:hover{border-color:var(--cyan);transform:translateY(-3px);box-shadow:var(--shadow)}.step-num{display:grid;place-items:center;flex:none;inline-size:2.25rem;block-size:2.25rem;border-radius:.625rem;background:var(--cyan-dim);color:var(--cyan);font-weight:800}.page-title{margin-block:2.5rem 1.5rem;font-size:clamp(2rem,6vw,3rem)}.code-list li{color:var(--text-muted)}.code-list a{color:var(--cyan);font-family:ui-monospace,monospace}@media (max-width:40rem){.shell{padding-inline:1rem}.session-list{grid-template-columns:1fr}}
</style>`;

function page({ title, body, active, base }) {
  const tabs = `<nav class="catalog-tabs" aria-label="ناوبری دوره"><a href="${base}"${active === 'content' ? ' aria-current="page"' : ''}>محتوا</a><a href="${active === 'code' ? './' : `${base}code/`}"${active === 'code' ? ' aria-current="page"' : ''}>کدها</a></nav>`;
  return `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="color-scheme" content="dark light"><title>${escape(title)}</title>${themeScript}${style}</head><body><main class="shell">${tabs}${themeToggle}${body}</main><script>document.querySelector('.theme-toggle').addEventListener('click',function(){var root=document.documentElement,next=root.dataset.theme==='light'?'dark':'light';root.dataset.theme=next;try{localStorage.setItem('theme',next)}catch(e){}});</script></body></html>`;
}

async function validateManifest(manifest) {
  const schema = JSON.parse(await readFile(path.join(root, 'schemas/course-manifest.schema.json'), 'utf8'));
  const ajv = new Ajv({ allErrors: true });
  ajv.addFormat('bcp47', /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i);
  ajv.addFormat('iso-date', (value) => /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value) && !Number.isNaN(Date.parse(value)));
  const validate = ajv.compile(schema);
  if (!validate(manifest)) throw new Error(`invalid manifest: ${ajv.errorsText(validate.errors)}`);
}

export async function generate({ sourceDir = root, outputDir = path.join(root, 'dist') } = {}) {
  const manifest = JSON.parse(await readFile(path.join(sourceDir, 'course.json'), 'utf8'));
  await validateManifest(manifest);
  const lectureIds = new Set(manifest.lectures.map((lecture) => lecture.id));
  for (const lecture of manifest.lectures) if (!Object.hasOwn(lessonPages, lecture.id)) throw new Error(`lesson page missing for lecture ${lecture.id}`);
  for (const id of Object.keys(lessonPages)) if (!lectureIds.has(id)) throw new Error(`lesson page ${id} has no matching lecture`);
  for (const id of Object.keys(lessonCodes)) if (!lectureIds.has(id)) throw new Error(`lesson code ${id} has no matching lecture`);
  await Promise.all(Object.values(lessonPages).map(async (file) => readFile(path.join(sourceDir, 'contents', file))));
  const codes = await Promise.all(manifest.lectures.flatMap((lecture) => (lessonCodes[lecture.id] ?? []).map(async (file) => {
    await readFile(path.join(sourceDir, 'codes', file));
    return { session: lecture.order, file, href: `../code/files/${encodeURIComponent(file)}` };
  })));
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(path.join(outputDir, 'code'), { recursive: true });
  const sessions = manifest.lectures.map((lecture) => `<li><a class="session-card" href="contents/${lessonPages[lecture.id]}"><span class="step-num">${fa(lecture.order)}</span><span>${escape(lecture.title)}</span></a></li>`).join('');
  const home = `<section class="hero"><span class="hero-badge">🎓 دورهٔ آموزشی</span><h1>${escape(manifest.title)}</h1><p>${escape(manifest.description)}</p><div class="meta-row"><span class="meta-pill">📚 تعداد جلسات: <span>${fa(manifest.lectures.length)}</span></span></div></section><section><h2 class="section-title">💬 جلسه‌ها</h2><ol class="session-list">${sessions}</ol></section>`;
  const code = `<h1 class="page-title">کدها</h1><ul class="code-list">${codes.map((item) => `<li>جلسه ${fa(item.session)} · <a dir="ltr" href="${item.href}">${escape(item.file)}</a></li>`).join('')}</ul>`;
  await Promise.all([
    writeFile(path.join(outputDir, 'index.html'), page({ title: manifest.title, body: home, active: 'content', base: './' })),
    writeFile(path.join(outputDir, 'code', 'index.html'), page({ title: 'کدها', body: code, active: 'code', base: '../' })),
    cp(path.join(sourceDir, 'codes'), path.join(outputDir, 'code', 'files'), { recursive: true }),
    cp(path.join(sourceDir, 'contents'), path.join(outputDir, 'contents'), { recursive: true }),
    cp(path.join(sourceDir, 'assets'), path.join(outputDir, 'assets'), { recursive: true }),
    cp(path.join(sourceDir, 'course.json'), path.join(outputDir, 'course.json')),
  ]);
  return manifest;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const validateOnly = process.argv.includes('--validate');
  const outputDir = validateOnly ? await mkdtemp(path.join(tmpdir(), 'machine-learning-site-')) : path.join(root, 'dist');
  try {
    await generate({ outputDir });
    console.log(`site generated: ${validateOnly ? 'validation passed' : outputDir}`);
  } finally {
    if (validateOnly) await rm(outputDir, { recursive: true, force: true });
  }
}
