import { type Rule } from '@angular-devkit/schematics';
export interface ComponentOptions {
    name: string;
    topic?: string;
    path?: string;
    sourceRoot?: string;
    flat?: boolean;
    spec?: boolean;
    specFileSuffix?: string;
    skipImport?: boolean;
}
type Kind = 'consumer' | 'producer';
/** Generates `<name>.<kind>.ts` (+ spec) and registers it in the nearest module. */
export declare function componentRule(kind: Kind, options: ComponentOptions): Rule;
export {};
//# sourceMappingURL=component.d.ts.map