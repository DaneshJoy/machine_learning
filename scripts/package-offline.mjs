import { execFile } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const offlineDir = path.join(root, 'offline');
const execFileAsync = promisify(execFile);

await execFileAsync('npm', ['run', 'build'], { cwd: root });
await rm(offlineDir, { recursive: true, force: true });
await mkdir(offlineDir);
await execFileAsync('python3', ['scripts/create-zip.py', 'dist', 'offline/machine-learning-offline.zip'], { cwd: root });
