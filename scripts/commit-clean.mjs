import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';

const arg = process.argv[2];
if (!arg) {
  console.error('usage: commit-clean.mjs <message|path-to-msg-file>');
  process.exit(1);
}
const msg = existsSync(arg) ? readFileSync(arg, 'utf8') : arg;
const file = '.git/COMMIT_EDITMSG_CLEAN';
writeFileSync(file, msg.endsWith('\n') ? msg : `${msg}\n`);
const env = {
  ...process.env,
  GIT_AUTHOR_NAME: 'krwg',
  GIT_AUTHOR_EMAIL: 'shevotsukov@icloud.com',
  GIT_COMMITTER_NAME: 'krwg',
  GIT_COMMITTER_EMAIL: 'shevotsukov@icloud.com',
};
const tree = execSync('git write-tree', { encoding: 'utf8', env }).trim();
const parent = execSync('git rev-parse HEAD', { encoding: 'utf8', env }).trim();
const commit = execSync(`git commit-tree ${tree} -p ${parent} -F "${file}"`, {
  encoding: 'utf8',
  env,
}).trim();
execSync(`git reset --hard ${commit}`, { stdio: 'inherit', env });
unlinkSync(file);
const body = execSync('git log -1 --format=%B', { encoding: 'utf8' });
if (/Co-authored-by/i.test(body)) {
  console.error('Co-authored-by leaked');
  process.exit(1);
}
process.stdout.write(execSync('git log -1 --oneline', { encoding: 'utf8' }));
