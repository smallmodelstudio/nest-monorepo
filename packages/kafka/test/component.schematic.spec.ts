import { createNestProject, createRunner } from './fixtures.js';

describe('consumer / producer schematics', () => {
  const runner = createRunner();

  async function projectWithKafka() {
    return runner.runSchematic(
      'nest-add',
      { skipInstall: true },
      createNestProject(),
    );
  }

  it('generates a consumer that uses a shared KafkaTopics entry', async () => {
    const tree = await runner.runSchematic(
      'consumer',
      { name: 'orders' },
      await projectWithKafka(),
    );

    const consumer = tree.readText('/src/orders/orders.consumer.ts');
    expect(consumer).toContain(
      "import { KafkaTopics } from '../kafka/kafka.topics.js';",
    );
    expect(consumer).toContain('@KafkaEventPattern(KafkaTopics.ORDERS)');
    expect(consumer).toContain('export class OrdersConsumer');
    expect(tree.exists('/src/orders/orders.consumer.spec.ts')).toBe(true);

    expect(tree.readText('/src/kafka/kafka.topics.ts')).toContain(
      "  ORDERS: 'orders',\n} as const;",
    );

    const appModule = tree.readText('/src/app.module.ts');
    expect(appModule).toContain(
      "import { OrdersConsumer } from './orders/orders.consumer.js';",
    );
    expect(appModule).toMatch(/controllers: \[AppController, OrdersConsumer\]/);
  });

  it('generates a producer for an explicit topic, reusing an existing topic key', async () => {
    const tree = await runner.runSchematic(
      'producer',
      { name: 'demo', topic: 'example.events', flat: true, spec: false },
      await projectWithKafka(),
    );

    const producer = tree.readText('/src/demo.producer.ts');
    expect(producer).toContain(
      "import { KafkaTopics } from './kafka/kafka.topics.js';",
    );
    expect(producer).toContain(
      'this.kafka.emit(KafkaTopics.EXAMPLE_EVENTS, message, options)',
    );
    expect(tree.exists('/src/demo.producer.spec.ts')).toBe(false);
    expect(tree.readText('/src/app.module.ts')).toMatch(
      /providers: \[AppService, DemoProducer\]/,
    );
    expect(
      tree.readText('/src/kafka/kafka.topics.ts').match(/example\.events/g),
    ).toHaveLength(1);
  });

  it('registers into the nearest module under --path', async () => {
    const project = await projectWithKafka();
    const tree = await runner.runSchematic(
      'producer',
      { name: 'order-created', path: 'kafka' },
      project,
    );

    expect(
      tree.exists('/src/kafka/order-created/order-created.producer.ts'),
    ).toBe(true);
    expect(tree.readText('/src/kafka/app-kafka.module.ts')).toContain(
      "import { OrderCreatedProducer } from './order-created/order-created.producer.js';",
    );
    expect(tree.readText('/src/kafka/kafka.topics.ts')).toContain(
      "ORDER_CREATED: 'order-created',",
    );
  });

  it('inlines the topic when nest-add has not been run', async () => {
    const tree = await runner.runSchematic(
      'consumer',
      { name: 'payments' },
      createNestProject(),
    );

    const consumer = tree.readText('/src/payments/payments.consumer.ts');
    expect(consumer).toContain("@KafkaEventPattern('payments')");
    expect(consumer).not.toContain('KafkaTopics');
  });
});
