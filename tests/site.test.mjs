import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate } from '../scripts/build-site.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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
  assert.match(code, /https:\/\/github\.com\/DaneshJoy\/machine_learning\/blob\/main\/codes\/01_regression_synthetic_data\.ipynb/);
  assert.match(code, /01_regression_synthetic_data\.ipynb/);

  for (const page of [index, code]) {
    const css = page.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
    assert.doesNotMatch(css, /\b(left|right)\s*:/);
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
  await Promise.all(['contents', 'codes'].map((name) => cp(path.join(root, name), path.join(sourceDir, name), { recursive: true })));
  const manifest = JSON.parse(await readFile(path.join(root, 'course.json'), 'utf8'));
  manifest.schemaVersion = '0.0.0';
  await writeFile(path.join(sourceDir, 'course.json'), JSON.stringify(manifest));

  await assert.rejects(generate({ sourceDir, outputDir }), /invalid manifest/);
});

test('pairs lessons and codes with lectures by id', async (t) => {
  const sourceDir = await tempDirectory();
  const outputDir = await tempDirectory();
  t.after(() => Promise.all([rm(sourceDir, { recursive: true, force: true }), rm(outputDir, { recursive: true, force: true })]));
  await Promise.all(['contents', 'codes'].map((name) => cp(path.join(root, name), path.join(sourceDir, name), { recursive: true })));
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
