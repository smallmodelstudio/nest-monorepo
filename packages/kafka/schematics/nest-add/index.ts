import { join, normalize } from '@angular-devkit/core';
import {
  chain,
  noop,
  type Rule,
  type SchematicContext,
  type Tree,
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks/index.js';
import { KAFKA_ENV_VARS, upsertEnvFile } from '../utils/env-file.js';
import { generateFiles } from '../utils/files.js';
import { MANUAL_MAIN_INSTRUCTIONS, patchMainFile } from '../utils/main-file.js';
import { registerInModule } from '../utils/module-registration.js';
import {
  detectPackageManager,
  importExtension,
  ownVersion,
  PACKAGE_NAME,
  readPackageJson,
  runScriptCommand,
  writePackageJson,
  type PackageManager,
} from '../utils/project.js';
import type { NestAddOptions } from './schema.js';

const KAFKAJS_VERSION = '^2.2.4';
const FALLBACK_NEST_VERSION = '^12.0.0';
const COMPOSE_FILE = 'docker-compose.kafka.yml';

export function main(rawOptions: NestAddOptions): Rule {
  const options: Required<NestAddOptions> = {
    sourceRoot: 'src',
    example: true,
    docker: true,
    main: true,
    skipInstall: false,
    ...rawOptions,
  };

  return (tree: Tree) => {
    const pm = detectPackageManager(tree);
    const ext = importExtension(tree);
    const sourceRoot = normalize(options.sourceRoot);
    const kafkaDir = join(sourceRoot, 'kafka');
    const templateOptions = {
      ext,
      example: options.example,
      runScript: (script: string) => runScriptCommand(pm, script),
    };

    return chain([
      addDependencies(options.skipInstall, pm),
      generateFiles('./files/kafka', kafkaDir, templateOptions),
      options.example
        ? generateFiles(
            './files/example',
            join(kafkaDir, 'example'),
            templateOptions,
          )
        : noop(),
      options.docker
        ? generateFiles('./files/docker', '/', templateOptions)
        : noop(),
      options.docker ? addScripts() : noop(),
      addEnvVars(),
      registerKafkaModule(sourceRoot, ext),
      options.main ? patchMain(sourceRoot) : noop(),
      printNextSteps(options, pm),
    ]);
  };
}

function addDependencies(skipInstall: boolean, pm: PackageManager): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const pkg = readPackageJson(tree);
    if (!pkg) {
      context.logger.warn(
        'No package.json found; add @nestjs/microservices and kafkajs manually.',
      );
      return;
    }
    const deps = (pkg.dependencies ??= {});
    // Keep @nestjs/microservices on the same range as the rest of Nest.
    const nestVersion = deps['@nestjs/core'] ?? FALLBACK_NEST_VERSION;
    const wanted: Record<string, string> = {
      '@nestjs/microservices': nestVersion,
      kafkajs: KAFKAJS_VERSION,
    };
    if (!deps[PACKAGE_NAME] && !pkg.devDependencies?.[PACKAGE_NAME]) {
      wanted[PACKAGE_NAME] = `^${ownVersion()}`;
    }

    let changed = false;
    for (const [name, version] of Object.entries(wanted)) {
      if (!deps[name]) {
        deps[name] = version;
        changed = true;
      }
    }
    if (!changed) {
      return;
    }
    pkg.dependencies = Object.fromEntries(
      Object.entries(deps).sort(([a], [b]) => a.localeCompare(b)),
    );
    writePackageJson(tree, pkg);
    if (!skipInstall) {
      context.addTask(new NodePackageInstallTask({ packageManager: pm }));
    }
  };
}

function addScripts(): Rule {
  return (tree: Tree) => {
    const pkg = readPackageJson(tree);
    if (!pkg) return;
    const scripts = (pkg.scripts ??= {});
    const compose = `docker compose -f ${COMPOSE_FILE}`;
    const wanted: Record<string, string> = {
      'kafka:up': `${compose} up -d --wait`,
      'kafka:down': `${compose} down`,
      'kafka:logs': `${compose} logs -f kafka`,
    };
    let changed = false;
    for (const [name, command] of Object.entries(wanted)) {
      if (!scripts[name]) {
        scripts[name] = command;
        changed = true;
      }
    }
    if (changed) writePackageJson(tree, pkg);
  };
}

function addEnvVars(): Rule {
  return (tree: Tree) => {
    upsertEnvFile(tree, '.env.example', KAFKA_ENV_VARS, { create: true });
    upsertEnvFile(tree, '.env', KAFKA_ENV_VARS, { create: false });
  };
}

function registerKafkaModule(sourceRoot: string, ext: string): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const appModule = join(normalize(sourceRoot), 'app.module.ts');
    const content = tree.exists(appModule) ? tree.readText(appModule) : null;
    if (content?.includes('AppKafkaModule')) {
      return;
    }
    const edited = content
      ? registerInModule(tree, {
          modulePath: appModule,
          metadata: 'imports',
          symbol: 'AppKafkaModule',
          symbolFile: join(normalize(sourceRoot), 'kafka', 'app-kafka.module'),
          importExtension: ext,
        })
      : null;
    if (!edited) {
      context.logger.warn(
        `Could not update ${appModule}. Import AppKafkaModule from './kafka/app-kafka.module${ext}' into your root module.`,
      );
    }
  };
}

function patchMain(sourceRoot: string): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const mainPath = join(normalize(sourceRoot), 'main.ts');
    const result = tree.exists(mainPath)
      ? patchMainFile(tree.readText(mainPath))
      : ({ status: 'unrecognised' } as const);
    if (result.status === 'patched') {
      tree.overwrite(mainPath, result.content);
    } else if (result.status === 'unrecognised') {
      context.logger.warn(
        `Could not patch ${mainPath}. To start consuming, update your bootstrap:\n\n${MANUAL_MAIN_INSTRUCTIONS}\n`,
      );
    }
  };
}

function printNextSteps(
  options: Required<NestAddOptions>,
  pm: PackageManager,
): Rule {
  return (_tree: Tree, context: SchematicContext) => {
    const steps = [
      options.docker &&
        `${runScriptCommand(pm, 'kafka:up')}      # start Kafka on localhost:9092 and Kafka UI on http://localhost:8080`,
      `${runScriptCommand(pm, 'start:dev')}`,
      options.example &&
        `curl -X POST localhost:3000/kafka/example/events -H 'content-type: application/json' -d '{"message":"hello"}'`,
    ].filter(Boolean);
    context.logger.info(
      `\nKafka added. Next steps:\n\n  ${steps.join('\n  ')}\n`,
    );
  };
}
