// Publishes a workspace package to GitHub as an installable git ref, without npm.
//
//   node scripts/release-github.mjs packages/kafka [--no-push] [--trailer "Key: value"]
//
// Builds and packs the package, commits exactly the packed files (package.json,
// dist/, README) to the `dist/<dir>` branch, and tags it `<dir>-v<version>`.
// Consumers then install with:
//
//   pnpm add github:<owner>/<repo>#<dir>-v<version>
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';

const args = process.argv.slice(2);
const pkgDir = args.find(
  (arg) => !arg.startsWith('--') && args[args.indexOf(arg) - 1] !== '--trailer',
);
const push = !args.includes('--no-push');
const trailer = args.includes('--trailer')
  ? args[args.indexOf('--trailer') + 1]
  : undefined;
if (!pkgDir) {
  console.error(
    'Usage: node scripts/release-github.mjs <package-dir> [--no-push] [--trailer "Key: value"]',
  );
  process.exit(1);
}

const run = (cmd, cmdArgs, opts = {}) =>
  execFileSync(cmd, cmdArgs, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    ...opts,
  }).trim();
const git = (gitArgs, opts) => run('git', gitArgs, opts);

const root = git(['rev-parse', '--show-toplevel']);
const pkgPath = resolve(root, pkgDir);
const pkg = JSON.parse(readFileSync(join(pkgPath, 'package.json'), 'utf8'));
const short = basename(pkgPath);
const branch = `dist/${short}`;
const tag = `${short}-v${pkg.version}`;

if (git(['status', '--porcelain'])) {
  throw new Error(
    'Working tree is not clean; commit or stash first so the release matches a commit.',
  );
}
if (
  git(['tag', '--list', tag]) ||
  git(['ls-remote', '--tags', 'origin', tag])
) {
  throw new Error(
    `Tag ${tag} already exists. Bump "version" in ${pkgDir}/package.json first.`,
  );
}
const sourceSha = git(['rev-parse', '--short', 'HEAD']);

// Pack exactly what npm would publish (prepack runs the build).
const work = mkdtempSync(join(tmpdir(), `release-${short}-`));
run('pnpm', ['pack', '--pack-destination', work], {
  cwd: pkgPath,
  stdio: ['ignore', 'ignore', 'inherit'],
});
const tarball = readdirSync(work).find((file) => file.endsWith('.tgz'));
run('tar', ['-xzf', join(work, tarball), '-C', work]);
const packed = join(work, 'package');

// Git installs run lifecycle scripts; the packed package is already built.
const releasePkg = JSON.parse(
  readFileSync(join(packed, 'package.json'), 'utf8'),
);
delete releasePkg.scripts;
delete releasePkg.devDependencies;
writeFileSync(
  join(packed, 'package.json'),
  JSON.stringify(releasePkg, null, 2) + '\n',
);

const worktree = join(work, 'worktree');
const remoteHasBranch = Boolean(
  git(['ls-remote', '--heads', 'origin', branch]),
);
try {
  if (remoteHasBranch) {
    git(['fetch', '-q', 'origin', branch]);
    git(['worktree', 'add', '-q', '-B', branch, worktree, `origin/${branch}`]);
  } else {
    git(['worktree', 'add', '-q', '--detach', worktree]);
    git(['checkout', '-q', '--orphan', branch], { cwd: worktree });
  }
  for (const entry of readdirSync(worktree)) {
    if (entry !== '.git')
      rmSync(join(worktree, entry), { recursive: true, force: true });
  }
  cpSync(packed, worktree, { recursive: true });

  git(['add', '-A'], { cwd: worktree });
  const message = [
    `${pkg.name} ${pkg.version}`,
    '',
    `Built from ${sourceSha}.`,
  ];
  if (trailer) message.push('', trailer);
  git(['commit', '-q', '-m', message.join('\n')], { cwd: worktree });
  git(['tag', '-a', tag, '-m', `${pkg.name} ${pkg.version}`], {
    cwd: worktree,
  });

  if (push) {
    git(['push', '-q', 'origin', branch, tag], {
      cwd: worktree,
      stdio: ['ignore', 'pipe', 'inherit'],
    });
  }
} finally {
  git(['worktree', 'remove', '--force', worktree]);
  rmSync(work, { recursive: true, force: true });
}

const remote = git(['remote', 'get-url', 'origin']).match(
  /github\.com[:/](.+?)(\.git)?$/,
)?.[1];
console.log(
  `\n${push ? 'Published' : 'Created (not pushed)'} ${tag} on branch ${branch}.`,
);
console.log(
  `Install with:\n  pnpm add github:${remote ?? '<owner>/<repo>'}#${tag}`,
);
