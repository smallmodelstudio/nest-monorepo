import type { Tree } from '@angular-devkit/schematics';
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
export declare function registerInModule(tree: Tree, options: RegisterInModuleOptions): string | null;
/**
 * Relative import specifier (no extension) from one project file to another,
 * e.g. `src/app.module.ts` -> `src/kafka/app-kafka.module` gives `./kafka/app-kafka.module`.
 */
export declare function relativeImportPath(fromFile: string, toFile: string): string;
/** Inserts an import statement after the last existing top-level import. */
export declare function insertImport(content: string, importLine: string): string;
//# sourceMappingURL=module-registration.d.ts.map