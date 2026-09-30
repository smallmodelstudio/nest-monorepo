import { strings } from '@angular-devkit/core';
import {
  apply,
  forEach,
  mergeWith,
  move,
  applyTemplates,
  url,
  type Rule,
} from '@angular-devkit/schematics';

/**
 * Renders `templateDir` into `targetDir`, skipping (with a warning) any file
 * that already exists so re-running a schematic never clobbers user code.
 */
export function generateFiles(
  templateDir: string,
  targetDir: string,
  templateOptions: Record<string, unknown>,
): Rule {
  return (tree, context) =>
    mergeWith(
      apply(url(templateDir), [
        applyTemplates({ ...strings, ...templateOptions }),
        move(targetDir),
        forEach((entry) => {
          if (tree.exists(entry.path)) {
            context.logger.warn(`Skipped ${entry.path} (already exists)`);
            return null;
          }
          return entry;
        }),
      ]),
    );
}
