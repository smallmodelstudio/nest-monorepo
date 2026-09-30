import { Partitioners } from 'kafkajs';
import { kafkaOptionsFromEnv } from '../src/index.js';

describe('kafkaOptionsFromEnv', () => {
  it('defaults to the local docker compose broker', () => {
    expect(kafkaOptionsFromEnv({}, {})).toEqual({
      client: {
        clientId: 'nest-app',
        brokers: ['localhost:9092'],
        ssl: false,
        sasl: undefined,
        connectionTimeout: 3000,
        retry: { retries: 5 },
      },
      consumer: { groupId: 'nest-app' },
      producer: { createPartitioner: Partitioners.DefaultPartitioner },
    });
  });

  it('reads brokers, ids, SSL and SASL from env', () => {
    const options = kafkaOptionsFromEnv(
      {},
      {
        KAFKA_BROKERS: 'a:9092, b:9092,,',
        KAFKA_CLIENT_ID: 'orders-api',
        KAFKA_GROUP_ID: 'orders-workers',
        KAFKA_SSL: 'true',
        KAFKA_SASL_MECHANISM: 'SCRAM-SHA-512',
        KAFKA_SASL_USERNAME: 'user',
        KAFKA_SASL_PASSWORD: 'pass',
        KAFKA_RETRIES: '10',
      },
    );

    expect(options.client).toMatchObject({
      clientId: 'orders-api',
      brokers: ['a:9092', 'b:9092'],
      ssl: true,
      sasl: { mechanism: 'scram-sha-512', username: 'user', password: 'pass' },
      retry: { retries: 10 },
    });
    expect(options.consumer).toEqual({ groupId: 'orders-workers' });
  });

  it('merges overrides per section', () => {
    const options = kafkaOptionsFromEnv(
      {
        client: { clientId: 'override' },
        consumer: { groupId: 'g', sessionTimeout: 45_000 },
        subscribe: { fromBeginning: true },
      },
      { KAFKA_BROKERS: 'kafka:29092' },
    );

    expect(options.client).toMatchObject({
      clientId: 'override',
      brokers: ['kafka:29092'],
    });
    expect(options.consumer).toEqual({ groupId: 'g', sessionTimeout: 45_000 });
    expect(options.subscribe).toEqual({ fromBeginning: true });
  });

  it.each([
    [
      { KAFKA_SASL_MECHANISM: 'oauthbearer' },
      /KAFKA_SASL_MECHANISM must be one of/,
    ],
    [
      { KAFKA_SASL_MECHANISM: 'plain' },
      /KAFKA_SASL_USERNAME and KAFKA_SASL_PASSWORD are required/,
    ],
    [{ KAFKA_SSL: 'maybe' }, /KAFKA_SSL must be a boolean/],
    [{ KAFKA_RETRIES: '-1' }, /KAFKA_RETRIES must be a non-negative integer/],
  ])('rejects invalid config %o', (env, error) => {
    expect(() => kafkaOptionsFromEnv({}, env)).toThrow(error);
  });
});
