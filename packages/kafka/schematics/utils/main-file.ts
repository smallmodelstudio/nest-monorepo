import { insertImport } from './module-registration.js';
import { PACKAGE_NAME } from './project.js';

export type PatchMainResult =
  | { status: 'patched'; content: string }
  | { status: 'already-patched' }
  | { status: 'unrecognised' };

/**
 * Turns the default `NestFactory.create()` bootstrap into a hybrid HTTP + Kafka
 * app by inserting, right after the app is created:
 *
 *   app.enableShutdownHooks();
 *   connectKafkaMicroservice(app);
 *   await app.startAllMicroservices();
 */
export function patchMainFile(content: string): PatchMainResult {
  if (content.includes('connectKafkaMicroservice')) {
    return { status: 'already-patched' };
  }

  const create =
    /^([ \t]*)(?:const|let)\s+(\w+)\s*=\s*await\s+NestFactory\.create\s*(?:<[^>]*>)?\s*\(/m.exec(
      content,
    );
  if (!create) {
    return { status: 'unrecognised' };
  }
  const [, indent, appVar] = create;
  const statementEnd = findStatementEnd(
    content,
    create.index + create[0].length,
  );
  if (statementEnd === -1) {
    return { status: 'unrecognised' };
  }

  const lines = [
    '',
    ...(content.includes(`${appVar}.enableShutdownHooks(`)
      ? []
      : [`${indent}${appVar}.enableShutdownHooks();`]),
    `${indent}connectKafkaMicroservice(${appVar});`,
    `${indent}await ${appVar}.startAllMicroservices();`,
  ];
  const patched =
    content.slice(0, statementEnd) +
    lines.join('\n') +
    content.slice(statementEnd);

  return {
    status: 'patched',
    content: insertImport(
      patched,
      `import { connectKafkaMicroservice } from '${PACKAGE_NAME}';`,
    ),
  };
}

/**
 * Given an index just inside `NestFactory.create(`, returns the index after the
 * end of that statement (past the closing paren and an optional semicolon).
 */
function findStatementEnd(content: string, fromIndex: number): number {
  let depth = 1;
  let quote: string | null = null;
  for (let i = fromIndex; i < content.length; i++) {
    const char = content[i];
    if (quote) {
      if (char === '\\') i++;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') quote = char;
    else if (char === '(') depth++;
    else if (char === ')' && --depth === 0) {
      return content[i + 1] === ';' ? i + 2 : i + 1;
    }
  }
  return -1;
}

export const MANUAL_MAIN_INSTRUCTIONS = `import { connectKafkaMicroservice } from '${PACKAGE_NAME}';

  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  connectKafkaMicroservice(app);
  await app.startAllMicroservices();
  await app.listen(3000);`;
