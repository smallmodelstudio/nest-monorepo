import { join, normalize, strings, type Path } from '@angular-devkit/core';
import {
  apply,
  chain,
  filter,
  mergeWith,
  move,
  noop,
  applyTemplates,
  url,
  type Rule,
  type SchematicContext,
  type Tree,
} from '@angular-devkit/schematics';
import { NameParser } from '@nestjs/schematics/dist/utils/index.js';
import { registerInModule, relativeImportPath } from './module-registration.js';
import { importExtension, PACKAGE_NAME } from './project.js';
import { ensureTopic, topicsFilePath } from './topics.js';

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

const REGISTER_AS: Record<Kind, 'controllers' | 'providers'> = {
  consumer: 'controllers',
  producer: 'providers',
};

/** Generates `<name>.<kind>.ts` (+ spec) and registers it in the nearest module. */
export function componentRule(kind: Kind, options: ComponentOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const sourceRoot = options.sourceRoot ?? 'src';
    const location = new NameParser().parse({
      name: options.name,
      path: join(normalize(sourceRoot), options.path ?? '') as Path,
    });
    const name = strings.dasherize(location.name);
    const dir = options.flat ? location.path : join(location.path, name);
    const className = `${strings.classify(name)}${strings.classify(kind)}`;
    const ext = importExtension(tree);
    const topic = options.topic ?? name;

    const topicKey = ensureTopic(
      tree,
      sourceRoot,
      strings.underscore(name).toUpperCase(),
      topic,
    );
    let topicRef = `'${topic}'`;
    let topicsImport = '';
    if (topicKey) {
      const topicsFile = topicsFilePath(sourceRoot).replace(/\.ts$/, '');
      const relative = relativeImportPath(
        join(dir, `${name}.${kind}.ts`),
        topicsFile,
      );
      topicRef = `KafkaTopics.${topicKey}`;
      topicsImport = `import { KafkaTopics } from '${relative}${ext}';\n`;
    } else {
      context.logger.warn(
        `No ${topicsFilePath(sourceRoot)} found, so the topic is inlined. ` +
          `Run \`nest add ${PACKAGE_NAME}\` first to set up KafkaModule.`,
      );
    }

    const source = apply(url('./files'), [
      options.spec === false
        ? filter((path) => !path.includes('__specFileSuffix__'))
        : noop(),
      applyTemplates({
        ...strings,
        name,
        className,
        topic,
        topicRef,
        topicsImport,
        ext,
        specFileSuffix: options.specFileSuffix ?? 'spec',
      }),
      move(dir),
    ]);

    return chain([
      mergeWith(source),
      options.skipImport
        ? noop()
        : (host: Tree) => {
            const edited = registerInModule(host, {
              searchFrom: dir,
              metadata: REGISTER_AS[kind],
              symbol: className,
              symbolFile: join(dir, `${name}.${kind}`),
              importExtension: ext,
            });
            if (!edited) {
              context.logger.warn(
                `Did not register ${className}; add it to a module's ${REGISTER_AS[kind]} manually.`,
              );
            }
          },
    ]);
  };
}
