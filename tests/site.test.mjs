import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { generate } from '../scripts/build-site.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const execFileAsync = promisify(execFile);

async function tempDirectory() {
  return mkdtemp(path.join(os.tmpdir(), 'machine-learning-site-'));
}

test('generates the course and code indexes', async (t) => {
  const outputDir = await tempDirectory();
  t.after(() => rm(outputDir, { recursive: true, force: true }));
  await generate({ sourceDir: root, outputDir });

  const index = await readFile(path.join(outputDir, 'index.html'), 'utf8');
  assert.match(index, /رگرسیون با داده‌های مصنوعی/);
  assert.match(index, /توابع ایجاد دیتاست در scikit-learn/);
  assert.match(index, /href="contents\/01_regression_concepts.html"/);
  assert.match(index, /href="contents\/sklearn_datasets.html"/);
  assert.match(index, /محتوا/);
  assert.match(index, /کدها/);
  assert.equal((index.match(/aria-current="page"/g) ?? []).length, 1);

  const code = await readFile(path.join(outputDir, 'code/index.html'), 'utf8');
  assert.match(code, /href="\.\.\/code\/files\/01_regression_synthetic_data\.ipynb"/);
  assert.match(code, /01_regression_synthetic_data\.ipynb/);
  await readFile(path.join(outputDir, 'code', 'files', '01_regression_synthetic_data.ipynb'));
  await readFile(path.join(outputDir, 'assets', 'fonts.css'));
  await readFile(path.join(outputDir, 'assets', 'chart.umd.min.js'));

  for (const page of [index, code]) {
    const css = page.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
    assert.doesNotMatch(css, /\b(left|right)\s*:/);
  }
});

test('packages site files at the ZIP root', async (t) => {
  const fixtureDir = await tempDirectory();
  const courseDir = path.join(fixtureDir, 'machine_learning');
  t.after(() => rm(fixtureDir, { recursive: true, force: true }));
  await mkdir(courseDir, { recursive: true });
  await Promise.all(['assets', 'codes', 'contents', 'schemas', 'scripts', 'course.json', 'package.json', 'package-lock.json'].map((name) => cp(path.join(root, name), path.join(courseDir, name), { recursive: true })));
  await symlink(path.join(root, 'node_modules'), path.join(courseDir, 'node_modules'), 'dir');
  await execFileAsync('node', ['scripts/package-offline.mjs'], { cwd: courseDir });
  const zipPath = path.join(courseDir, 'offline', 'machine-learning-offline.zip');
  const { stdout } = await execFileAsync('python3', ['-c', 'import sys, zipfile; print("\\n".join(zipfile.ZipFile(sys.argv[1]).namelist()))', zipPath]);
  const entries = stdout.trim().split('\n');

  assert(entries.includes('index.html'));
  assert(entries.includes('code/index.html'));
  assert(entries.includes('code/files/01_regression_synthetic_data.ipynb'));
  assert(entries.every((entry) => !entry.startsWith('dist/')));
});

test('packages lessons with local rendered resources', async (t) => {
  const outputDir = await tempDirectory();
  t.after(() => rm(outputDir, { recursive: true, force: true }));
  await generate({ sourceDir: root, outputDir });

  for (const file of ['01_regression_concepts.html', 'sklearn_datasets.html']) {
    const html = await readFile(path.join(outputDir, 'contents', file), 'utf8');
    assert.doesNotMatch(html, /https?:\/\//);
    assert.match(html, /href="\.\.\/assets\/fonts\.css"/);
    assert.match(html, /src="\.\.\/assets\/chart\.umd\.min\.js"/);
  }
  for (const file of ['fonts.css', 'chart.umd.min.js', 'fonts/Dxx78j6PP2D_kU2muijPEe1n2vVbfJRklWgzORc.ttf', 'fonts/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPQ.ttf']) {
    await readFile(path.join(outputDir, 'assets', file));
  }
});

test('explainer sources place the theme toggle and mobile tabs with logical properties', async (t) => {
  for (const file of ['01_regression_concepts.html', 'sklearn_datasets.html']) {
    const html = await readFile(path.join(root, 'contents', file), 'utf8');
    assert.match(html, /\.theme-toggle\s*\{[^}]*inset-block-start:\s*14px[^}]*inset-inline-end:\s*16px/);
    assert.doesNotMatch(html, /\.theme-toggle\s*\{[^}]*\btop:\s*14px/);
    assert.doesNotMatch(html, /\.theme-toggle\s*\{[^}]*\bright:\s*16px/);
    assert.match(html, /\.tabs-wrap\s*\{[^}]*padding-inline-end:\s*52px/);
    assert.doesNotMatch(html, /\.tabs-wrap\s*\{[^}]*padding-right:\s*52px/);
  }
});

test('rejects an invalid manifest', async (t) => {
  const sourceDir = await tempDirectory();
  const outputDir = await tempDirectory();
  t.after(() => Promise.all([rm(sourceDir, { recursive: true, force: true }), rm(outputDir, { recursive: true, force: true })]));
  await Promise.all(['assets', 'contents', 'codes'].map((name) => cp(path.join(root, name), path.join(sourceDir, name), { recursive: true })));
  const manifest = JSON.parse(await readFile(path.join(root, 'course.json'), 'utf8'));
  manifest.schemaVersion = '0.0.0';
  await writeFile(path.join(sourceDir, 'course.json'), JSON.stringify(manifest));

  await assert.rejects(generate({ sourceDir, outputDir }), /invalid manifest/);
});

test('pairs lessons and codes with lectures by id', async (t) => {
  const sourceDir = await tempDirectory();
  const outputDir = await tempDirectory();
  t.after(() => Promise.all([rm(sourceDir, { recursive: true, force: true }), rm(outputDir, { recursive: true, force: true })]));
  await Promise.all(['assets', 'contents', 'codes'].map((name) => cp(path.join(root, name), path.join(sourceDir, name), { recursive: true })));
  const manifest = JSON.parse(await readFile(path.join(root, 'course.json'), 'utf8'));

  manifest.lectures.reverse();
  await writeFile(path.join(sourceDir, 'course.json'), JSON.stringify(manifest));
  await generate({ sourceDir, outputDir });
  const index = await readFile(path.join(outputDir, 'index.html'), 'utf8');
  const cards = index.match(/<a class="session-card"[\s\S]*?<\/a>/g) ?? [];
  assert.equal(cards.length, 2);
  assert.match(cards[0], /href="contents\/sklearn_datasets\.html"/);
  assert.match(cards[0], /توابع ایجاد دیتاست در scikit-learn/);
  assert.match(cards[1], /href="contents\/01_regression_concepts\.html"/);
  assert.match(cards[1], /رگرسیون با داده‌های مصنوعی/);

  manifest.lectures[0].id = 'renamed-lecture';
  await writeFile(path.join(sourceDir, 'course.json'), JSON.stringify(manifest));
  await assert.rejects(generate({ sourceDir, outputDir }), /lesson page missing for lecture renamed-lecture/);
});
