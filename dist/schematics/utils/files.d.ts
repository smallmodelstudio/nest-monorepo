import { type Rule } from '@angular-devkit/schematics';
/**
 * Renders `templateDir` into `targetDir`, skipping (with a warning) any file
 * that already exists so re-running a schematic never clobbers user code.
 */
export declare function generateFiles(templateDir: string, targetDir: string, templateOptions: Record<string, unknown>): Rule;
//# sourceMappingURL=files.d.ts.map