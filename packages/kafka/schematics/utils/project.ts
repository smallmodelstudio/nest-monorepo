import type { Tree } from '@angular-devkit/schematics';
import { readFileSync } from 'node:fs';

export const PACKAGE_NAME = 'nest-monorepo-kafka';

/** This package's own version, so generated projects depend on the release that generated them. */
export function ownVersion(): string {
  // Compiled to dist/schematics/utils/project.js, three levels below the package root.
  const pkgUrl = new URL('../../../package.json', import.meta.url);
  return (JSON.parse(readFileSync(pkgUrl, 'utf8')) as { version: string })
    .version;
}

export interface PackageJson {
  name?: string;
  type?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

export function readPackageJson(tree: Tree): PackageJson | null {
  const buffer = tree.read('package.json');
  if (!buffer) {
    return null;
  }
  return JSON.parse(buffer.toString()) as PackageJson;
}

export function writePackageJson(tree: Tree, pkg: PackageJson): void {
  tree.overwrite('package.json', JSON.stringify(pkg, null, 2) + '\n');
}

/**
 * Nest 12 projects are ESM (`"type": "module"`) and need `.js` suffixes on
 * relative imports; older CommonJS projects must not have them.
 */
export function importExtension(tree: Tree): '.js' | '' {
  return readPackageJson(tree)?.type === 'module' ? '.js' : '';
}

export type PackageManager = 'pnpm' | 'yarn' | 'npm';

export function detectPackageManager(tree: Tree): PackageManager {
  if (tree.exists('pnpm-lock.yaml')) return 'pnpm';
  if (tree.exists('yarn.lock')) return 'yarn';
  return 'npm';
}

export function runScriptCommand(pm: PackageManager, script: string): string {
  return pm === 'npm' ? `npm run ${script}` : `${pm} ${script}`;
}
