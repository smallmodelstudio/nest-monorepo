import type { Tree } from '@angular-devkit/schematics';
export declare const KAFKA_ENV_VARS: ReadonlyArray<[name: string, value: string]>;
/**
 * Appends any missing `KAFKA_*` variables to an env file, creating it when
 * `create` is set. Existing values are never touched.
 */
export declare function upsertEnvFile(tree: Tree, path: string, vars: ReadonlyArray<[string, string]>, { create }: {
    create: boolean;
}): boolean;
//# sourceMappingURL=env-file.d.ts.map