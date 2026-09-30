import { patchMainFile } from '../schematics/utils/main-file.js';

describe('patchMainFile', () => {
  it('handles multi-line create calls with options', () => {
    const result = patchMainFile(`import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
    const server = await NestFactory.create<NestExpressApplication>(AppModule, {
        logger: ['error', 'warn'],
    });
    server.enableShutdownHooks();
    await server.listen(3000);
}
bootstrap();
`);

    expect(result.status).toBe('patched');
    const content = result.status === 'patched' ? result.content : '';
    expect(content).toContain(`    });
    connectKafkaMicroservice(server);
    await server.startAllMicroservices();
    server.enableShutdownHooks();`);
    expect(content.match(/enableShutdownHooks/g)).toHaveLength(1);
    expect(content).toContain(
      "import { AppModule } from './app.module';\nimport { connectKafkaMicroservice } from 'nest-monorepo-kafka';",
    );
  });

  it('reports already-patched and unrecognised files', () => {
    expect(patchMainFile('connectKafkaMicroservice(app);').status).toBe(
      'already-patched',
    );
    expect(
      patchMainFile(
        'const app = await NestFactory.createMicroservice(AppModule);',
      ).status,
    ).toBe('unrecognised');
  });
});
