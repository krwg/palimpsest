import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const destDir = join(root, 'dist', 'styles');
mkdirSync(destDir, { recursive: true });
copyFileSync(
  join(root, 'src', 'styles', 'palimpsest.css'),
  join(destDir, 'palimpsest.css'),
);
console.log('copied styles → dist/styles/palimpsest.css');
