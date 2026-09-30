import { readFileSync } from 'node:fs';
export const PACKAGE_NAME = 'nest-monorepo-kafka';
/** This package's own version, so generated projects depend on the release that generated them. */
export function ownVersion() {
    // Compiled to dist/schematics/utils/project.js, three levels below the package root.
    const pkgUrl = new URL('../../../package.json', import.meta.url);
    return JSON.parse(readFileSync(pkgUrl, 'utf8'))
        .version;
}
export function readPackageJson(tree) {
    const buffer = tree.read('package.json');
    if (!buffer) {
        return null;
    }
    return JSON.parse(buffer.toString());
}
export function writePackageJson(tree, pkg) {
    tree.overwrite('package.json', JSON.stringify(pkg, null, 2) + '\n');
}
/**
 * Nest 12 projects are ESM (`"type": "module"`) and need `.js` suffixes on
 * relative imports; older CommonJS projects must not have them.
 */
export function importExtension(tree) {
    return readPackageJson(tree)?.type === 'module' ? '.js' : '';
}
export function detectPackageManager(tree) {
    if (tree.exists('pnpm-lock.yaml'))
        return 'pnpm';
    if (tree.exists('yarn.lock'))
        return 'yarn';
    return 'npm';
}
export function runScriptCommand(pm, script) {
    return pm === 'npm' ? `npm run ${script}` : `${pm} ${script}`;
}
//# sourceMappingURL=project.js.map