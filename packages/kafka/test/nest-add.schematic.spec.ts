import { createNestProject, createRunner } from './fixtures.js';

describe('nest-add schematic', () => {
  const runner = createRunner();

  it('wires Kafka into an ESM (Nest 12) project', async () => {
    const tree = await runner.runSchematic('nest-add', {}, createNestProject());

    expect(tree.files).toEqual(
      expect.arrayContaining([
        '/src/kafka/app-kafka.module.ts',
        '/src/kafka/kafka.topics.ts',
        '/src/kafka/example/example.consumer.ts',
        '/src/kafka/example/example.controller.ts',
        '/src/kafka/example/example.messages.ts',
        '/src/kafka/example/example.producer.ts',
        '/docker-compose.kafka.yml',
        '/.env.example',
      ]),
    );

    const appModule = tree.readText('/src/app.module.ts');
    expect(appModule).toContain(
      "import { AppKafkaModule } from './kafka/app-kafka.module.js';",
    );
    expect(appModule).toContain('imports: [AppKafkaModule]');

    expect(tree.readText('/src/kafka/app-kafka.module.ts')).toContain(
      "from './example/example.consumer.js'",
    );

    const main = tree.readText('/src/main.ts');
    expect(main).toContain(
      "import { connectKafkaMicroservice } from 'nest-monorepo-kafka';",
    );
    expect(main).toContain(`  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  connectKafkaMicroservice(app);
  await app.startAllMicroservices();
  await app.listen(`);

    const pkg = JSON.parse(tree.readText('/package.json'));
    expect(pkg.dependencies).toMatchObject({
      '@nestjs/microservices': '^12.0.1',
      kafkajs: '^2.2.4',
      'nest-monorepo-kafka': expect.stringMatching(/^\^\d+\.\d+\.\d+/),
    });
    expect(pkg.scripts['kafka:up']).toBe(
      'docker compose -f docker-compose.kafka.yml up -d --wait',
    );

    expect(tree.readText('/.env.example')).toContain(
      'KAFKA_BROKERS=localhost:9092',
    );
    expect(tree.readText('/docker-compose.kafka.yml')).toContain(
      'pnpm kafka:up',
    );
    expect(runner.tasks.map((task) => task.name)).toContain('node-package');
  });

  it('omits .js import suffixes in a CommonJS project', async () => {
    const tree = await runner.runSchematic(
      'nest-add',
      {},
      createNestProject({ esm: false }),
    );

    expect(tree.readText('/src/app.module.ts')).toContain(
      "import { AppKafkaModule } from './kafka/app-kafka.module';",
    );
    expect(tree.readText('/src/kafka/app-kafka.module.ts')).not.toMatch(
      /\.js'/,
    );
  });

  it('is idempotent', async () => {
    const once = await runner.runSchematic('nest-add', {}, createNestProject());
    const snapshot = Object.fromEntries(
      once.files.map((f) => [f, once.readText(f)]),
    );

    const twice = await runner.runSchematic('nest-add', {}, once);

    for (const file of twice.files) {
      expect(twice.readText(file), file).toBe(snapshot[file]);
    }
  });

  it('can skip the example, docker and main.ts changes', async () => {
    const tree = await runner.runSchematic(
      'nest-add',
      { example: false, docker: false, main: false },
      createNestProject(),
    );

    expect(tree.files.some((f) => f.includes('/example/'))).toBe(false);
    expect(tree.exists('/docker-compose.kafka.yml')).toBe(false);
    expect(tree.readText('/src/main.ts')).not.toContain(
      'connectKafkaMicroservice',
    );
    const kafkaModule = tree.readText('/src/kafka/app-kafka.module.ts');
    expect(kafkaModule).not.toContain('controllers');
    expect(kafkaModule).toContain('requestReplyTopics: []');
  });

  it('appends only missing variables to an existing .env', async () => {
    const project = createNestProject();
    project.create('.env', 'PORT=4000\nKAFKA_BROKERS=broker:9092');

    const tree = await runner.runSchematic('nest-add', {}, project);
    const env = tree.readText('/.env');

    expect(env.startsWith('PORT=4000\nKAFKA_BROKERS=broker:9092\n\n')).toBe(
      true,
    );
    expect(env.match(/KAFKA_BROKERS=/g)).toHaveLength(1);
    expect(env).toContain('KAFKA_CLIENT_ID=nest-app');
  });

  it('leaves an unrecognised main.ts untouched', async () => {
    const project = createNestProject();
    const customMain = `import { bootstrap } from './bootstrap.js';\nawait bootstrap();\n`;
    project.overwrite('/src/main.ts', customMain);

    const tree = await runner.runSchematic('nest-add', {}, project);

    expect(tree.readText('/src/main.ts')).toBe(customMain);
  });
});
