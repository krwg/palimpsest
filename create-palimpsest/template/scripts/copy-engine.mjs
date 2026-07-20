import { cpSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const eng = dirname(require.resolve('@krwg/palimpsest/package.json'));
const vendor = join(root, 'vendor');
mkdirSync(vendor, { recursive: true });
cpSync(join(eng, 'dist'), vendor, { recursive: true });
console.log('copied @krwg/palimpsest dist → vendor/');
