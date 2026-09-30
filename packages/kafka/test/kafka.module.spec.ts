import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { ClientKafka, Transport } from '@nestjs/microservices';
import { of } from 'rxjs';
import {
  KAFKA_CLIENT,
  KafkaModule,
  KafkaProducerService,
  kafkaMicroserviceOptions,
  type KafkaModuleOptions,
} from '../src/index.js';

function createFakeClient() {
  const calls: Record<string, unknown[][]> = {};
  const record =
    (name: string, result: unknown = undefined) =>
    (...args: unknown[]) => {
      (calls[name] ??= []).push(args);
      return result;
    };
  return {
    calls,
    client: {
      connect: record('connect', Promise.resolve()),
      close: record('close', Promise.resolve()),
      subscribeToResponseOf: record('subscribeToResponseOf'),
      emit: record(
        'emit',
        of([{ topicName: 't', partition: 0, errorCode: 0 }]),
      ),
      emitBatch: record('emitBatch', of([])),
      send: record('send', of({ ok: true })),
    },
  };
}

async function createProducer(options: Partial<KafkaModuleOptions> = {}) {
  const fake = createFakeClient();
  const moduleRef = await Test.createTestingModule({
    imports: [KafkaModule.forRoot({ kafka: {}, ...options })],
  })
    .overrideProvider(KAFKA_CLIENT)
    .useValue(fake.client)
    .compile();
  await moduleRef.init();
  return { moduleRef, fake, producer: moduleRef.get(KafkaProducerService) };
}

describe('KafkaModule', () => {
  it('connects on init and subscribes to reply topics first', async () => {
    const { fake, moduleRef } = await createProducer({
      requestReplyTopics: ['a', 'b'],
    });

    expect(fake.calls.subscribeToResponseOf).toEqual([['a'], ['b']]);
    expect(fake.calls.connect).toHaveLength(1);

    await moduleRef.close();
    expect(fake.calls.close).toHaveLength(1);
  });

  it('skips connecting on init when connectOnInit is false', async () => {
    const { fake } = await createProducer({ connectOnInit: false });
    expect(fake.calls.connect).toBeUndefined();
  });

  it('emits messages with key and headers', async () => {
    const { fake, producer } = await createProducer();

    const metadata = await producer.emit(
      'orders',
      { id: 1 },
      { key: 'k', headers: { h: 'v' } },
    );

    expect(fake.calls.emit).toEqual([
      ['orders', { key: 'k', headers: { h: 'v' }, value: { id: 1 } }],
    ]);
    expect(metadata).toEqual([{ topicName: 't', partition: 0, errorCode: 0 }]);
  });

  it('only allows send() on registered request/response topics', async () => {
    const { fake, producer } = await createProducer({
      requestReplyTopics: ['rpc'],
    });

    await expect(producer.send('rpc', { q: 1 })).resolves.toEqual({ ok: true });
    expect(fake.calls.send).toEqual([['rpc', { value: { q: 1 } }]]);
    await expect(producer.send('other', {})).rejects.toThrow(
      /not registered for request\/response/,
    );
  });

  it('builds a producer-only ClientKafka unless reply topics are registered', async () => {
    const clientOptions = async (options: Partial<KafkaModuleOptions>) => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          KafkaModule.forRoot({
            kafka: { client: { brokers: ['x:1'] } },
            ...options,
          }),
        ],
      }).compile();
      const client = moduleRef.get<ClientKafka>(KAFKA_CLIENT);
      expect(client).toBeInstanceOf(ClientKafka);
      return (client as unknown as { options: { producerOnlyMode: boolean } })
        .options;
    };

    expect((await clientOptions({})).producerOnlyMode).toBe(true);
    expect(
      (await clientOptions({ requestReplyTopics: ['rpc'] })).producerOnlyMode,
    ).toBe(false);
  });

  it('supports forRootAsync and isGlobal', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        KafkaModule.forRootAsync({
          isGlobal: true,
          useFactory: async () => ({ kafka: {}, connectOnInit: false }),
        }),
      ],
    }).compile();

    expect(moduleRef.get(KafkaProducerService)).toBeInstanceOf(
      KafkaProducerService,
    );
  });
});

describe('kafkaMicroserviceOptions', () => {
  it('drops the client-only producerOnlyMode flag', () => {
    expect(
      kafkaMicroserviceOptions({
        client: { brokers: ['b'] },
        producerOnlyMode: true,
      }),
    ).toEqual({
      transport: Transport.KAFKA,
      options: { client: { brokers: ['b'] } },
    });
  });
});
