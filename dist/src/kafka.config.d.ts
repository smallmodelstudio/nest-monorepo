import type { KafkaTransportOptions } from './kafka.interfaces.js';
type Env = Record<string, string | undefined>;
/** Like the transport options, but `client` may be partial since env supplies the rest. */
export type KafkaEnvOverrides = Omit<KafkaTransportOptions, 'client'> & {
    client?: Partial<NonNullable<KafkaTransportOptions['client']>>;
};
/**
 * Builds Nest Kafka transport options from environment variables:
 *
 * | Variable                    | Default                 |
 * | --------------------------- | ----------------------- |
 * | KAFKA_BROKERS               | localhost:9092          |
 * | KAFKA_CLIENT_ID             | nest-app                |
 * | KAFKA_GROUP_ID              | `${KAFKA_CLIENT_ID}`    |
 * | KAFKA_SSL                   | false                   |
 * | KAFKA_SASL_MECHANISM        | (unset: no SASL)        |
 * | KAFKA_SASL_USERNAME         |                         |
 * | KAFKA_SASL_PASSWORD         |                         |
 * | KAFKA_CONNECTION_TIMEOUT_MS | 3000                    |
 * | KAFKA_RETRIES               | 5                       |
 *
 * `overrides` are shallow-merged per section (client/consumer/producer/...).
 */
export declare function kafkaOptionsFromEnv(overrides?: KafkaEnvOverrides, env?: Env): KafkaTransportOptions;
export {};
//# sourceMappingURL=kafka.config.d.ts.map