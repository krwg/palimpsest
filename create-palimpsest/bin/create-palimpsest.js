#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templateDir = join(__dirname, '..', 'template');

const targetArg = process.argv[2] || 'palst-reader';
const target = resolve(process.cwd(), targetArg);

if (existsSync(target) && existsSync(join(target, 'package.json'))) {
  console.error(`Refusing to overwrite existing project at ${target}`);
  process.exit(1);
}

mkdirSync(target, { recursive: true });
cpSync(templateDir, target, { recursive: true });

const pkgPath = join(target, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
pkg.name = targetArg.replace(/\\/g, '/').split('/').filter(Boolean).pop() || 'palst-reader';
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

console.log(`PalST reader scaffolded in ${target}`);
console.log('');
console.log('  cd ' + targetArg);
console.log('  npm install');
console.log('  npm run build');
console.log('  npm start');
console.log('');
console.log('Engine: @krwg/palimpsest (PalST)');
