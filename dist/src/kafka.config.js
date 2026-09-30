import { Partitioners } from 'kafkajs';
const SASL_MECHANISMS = ['plain', 'scram-sha-256', 'scram-sha-512'];
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
export function kafkaOptionsFromEnv(overrides = {}, env = process.env) {
    const clientId = env.KAFKA_CLIENT_ID || 'nest-app';
    const brokers = (env.KAFKA_BROKERS || 'localhost:9092')
        .split(',')
        .map((broker) => broker.trim())
        .filter(Boolean);
    const { client, consumer, producer, ...rest } = overrides;
    return {
        ...rest,
        client: {
            clientId,
            brokers,
            ssl: parseBoolean(env.KAFKA_SSL, 'KAFKA_SSL'),
            sasl: parseSasl(env),
            connectionTimeout: parseInteger(env.KAFKA_CONNECTION_TIMEOUT_MS, 3000, 'KAFKA_CONNECTION_TIMEOUT_MS'),
            retry: {
                retries: parseInteger(env.KAFKA_RETRIES, 5, 'KAFKA_RETRIES'),
            },
            ...client,
        },
        consumer: {
            groupId: env.KAFKA_GROUP_ID || clientId,
            ...consumer,
        },
        producer: {
            // Choosing the (already default) partitioner explicitly silences KafkaJS's
            // "switched default partitioner" warning on every startup.
            createPartitioner: Partitioners.DefaultPartitioner,
            ...producer,
        },
    };
}
function parseSasl(env) {
    const mechanism = env.KAFKA_SASL_MECHANISM?.trim().toLowerCase();
    if (!mechanism) {
        return undefined;
    }
    if (!SASL_MECHANISMS.includes(mechanism)) {
        throw new Error(`KAFKA_SASL_MECHANISM must be one of ${SASL_MECHANISMS.join(', ')} (got "${mechanism}")`);
    }
    const username = env.KAFKA_SASL_USERNAME;
    const password = env.KAFKA_SASL_PASSWORD;
    if (!username || !password) {
        throw new Error('KAFKA_SASL_USERNAME and KAFKA_SASL_PASSWORD are required when KAFKA_SASL_MECHANISM is set');
    }
    return {
        mechanism: mechanism,
        username,
        password,
    };
}
function parseBoolean(value, name) {
    if (value === undefined || value === '') {
        return false;
    }
    const normalised = value.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalised))
        return true;
    if (['false', '0', 'no'].includes(normalised))
        return false;
    throw new Error(`${name} must be a boolean (got "${value}")`);
}
function parseInteger(value, fallback, name) {
    if (value === undefined || value === '') {
        return fallback;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) {
        throw new Error(`${name} must be a non-negative integer (got "${value}")`);
    }
    return parsed;
}
//# sourceMappingURL=kafka.config.js.map