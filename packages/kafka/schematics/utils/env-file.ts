import type { Tree } from '@angular-devkit/schematics';

export const KAFKA_ENV_VARS: ReadonlyArray<[name: string, value: string]> = [
  ['KAFKA_BROKERS', 'localhost:9092'],
  ['KAFKA_CLIENT_ID', 'nest-app'],
  ['KAFKA_GROUP_ID', 'nest-app'],
  ['KAFKA_SSL', 'false'],
  ['KAFKA_SASL_MECHANISM', ''],
  ['KAFKA_SASL_USERNAME', ''],
  ['KAFKA_SASL_PASSWORD', ''],
];

/**
 * Appends any missing `KAFKA_*` variables to an env file, creating it when
 * `create` is set. Existing values are never touched.
 */
export function upsertEnvFile(
  tree: Tree,
  path: string,
  vars: ReadonlyArray<[string, string]>,
  { create }: { create: boolean },
): boolean {
  const existing = tree.exists(path) ? tree.readText(path) : null;
  if (existing === null && !create) {
    return false;
  }
  const content = existing ?? '';
  const defined = new Set(
    content
      .split(/\r?\n/)
      .map(
        (line) =>
          /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(line)?.[1],
      )
      .filter(Boolean),
  );
  const missing = vars.filter(([name]) => !defined.has(name));
  if (missing.length === 0) {
    return false;
  }

  const block = [
    '# Kafka (nest-monorepo-kafka)',
    ...missing.map(([name, value]) => `${name}=${value}`),
  ].join('\n');
  const separator =
    content.length === 0 ? '' : content.endsWith('\n') ? '\n' : '\n\n';
  const next = `${content}${separator}${block}\n`;

  if (existing === null) {
    tree.create(path, next);
  } else {
    tree.overwrite(path, next);
  }
  return true;
}
