import { normalize, type Path } from '@angular-devkit/core';
import type { Tree } from '@angular-devkit/schematics';
import {
  MetadataManager,
  ModuleFinder,
  PathSolver,
} from '@nestjs/schematics/dist/utils/index.js';

export interface RegisterInModuleOptions {
  /** Module file to edit; when omitted, the nearest `*.module.ts` above `searchFrom` is used. */
  modulePath?: string;
  searchFrom?: string;
  metadata: 'imports' | 'controllers' | 'providers';
  symbol: string;
  /** File the symbol is exported from, without extension (e.g. `src/kafka/app-kafka.module`). */
  symbolFile: string;
  importExtension: string;
}

/**
 * Adds `symbol` to a `@Module()` metadata array and imports it. Returns the
 * edited module path, or `null` when no module was found or it was already registered.
 */
export function registerInModule(
  tree: Tree,
  options: RegisterInModuleOptions,
): string | null {
  const modulePath =
    options.modulePath ??
    new ModuleFinder(tree).find({
      path: normalize(options.searchFrom ?? '/') as Path,
    });
  if (!modulePath || !tree.exists(modulePath)) {
    return null;
  }

  const content = tree.readText(modulePath);
  if (new RegExp(`\\b${options.symbol}\\b`).test(content)) {
    return null;
  }

  const withMetadata = new MetadataManager(content).insert(
    options.metadata,
    options.symbol,
  );
  if (!withMetadata) {
    return null;
  }

  const relativePath = relativeImportPath(modulePath, options.symbolFile);
  const importLine = `import { ${options.symbol} } from '${relativePath}${options.importExtension}';`;
  tree.overwrite(modulePath, insertImport(withMetadata, importLine));
  return modulePath;
}

/**
 * Relative import specifier (no extension) from one project file to another,
 * e.g. `src/app.module.ts` -> `src/kafka/app-kafka.module` gives `./kafka/app-kafka.module`.
 */
export function relativeImportPath(fromFile: string, toFile: string): string {
  // PathSolver only produces correct results for root-anchored paths.
  const anchor = (path: string) => normalize(`/${path}`) as Path;
  return new PathSolver().relative(anchor(fromFile), anchor(toFile));
}

/** Inserts an import statement after the last existing top-level import. */
export function insertImport(content: string, importLine: string): string {
  if (content.includes(importLine)) {
    return content;
  }
  const importRegex = /^import\s[\s\S]*?from\s+['"][^'"]+['"];?[ \t]*$/gm;
  let lastImportEnd = -1;
  for (const match of content.matchAll(importRegex)) {
    lastImportEnd = match.index + match[0].length;
  }
  if (lastImportEnd === -1) {
    return `${importLine}\n${content}`;
  }
  return (
    content.slice(0, lastImportEnd) +
    `\n${importLine}` +
    content.slice(lastImportEnd)
  );
}
