import type { Tree } from '@angular-devkit/schematics';
export declare const PACKAGE_NAME = "nest-monorepo-kafka";
/** This package's own version, so generated projects depend on the release that generated them. */
export declare function ownVersion(): string;
export interface PackageJson {
    name?: string;
    type?: string;
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    [key: string]: unknown;
}
export declare function readPackageJson(tree: Tree): PackageJson | null;
export declare function writePackageJson(tree: Tree, pkg: PackageJson): void;
/**
 * Nest 12 projects are ESM (`"type": "module"`) and need `.js` suffixes on
 * relative imports; older CommonJS projects must not have them.
 */
export declare function importExtension(tree: Tree): '.js' | '';
export type PackageManager = 'pnpm' | 'yarn' | 'npm';
export declare function detectPackageManager(tree: Tree): PackageManager;
export declare function runScriptCommand(pm: PackageManager, script: string): string;
//# sourceMappingURL=project.d.ts.map