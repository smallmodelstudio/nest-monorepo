// tsc only emits .js/.d.ts, so copy the schematic collection, schemas and
// template files (schematics/**/files/**) into dist/ alongside the compiled factories.
import { cpSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const srcRoot = 'schematics';
const outRoot = join('dist', 'schematics');

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const target = join(outRoot, relative(srcRoot, path));
    if (statSync(path).isDirectory()) {
      if (entry === 'files') {
        cpSync(path, target, { recursive: true });
      } else {
        walk(path);
      }
    } else if (entry.endsWith('.json')) {
      cpSync(path, target);
    }
  }
}

walk(srcRoot);
console.log(`Copied schematic assets to ${outRoot}`);
