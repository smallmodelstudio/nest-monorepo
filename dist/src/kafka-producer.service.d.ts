import { type OnApplicationShutdown, type OnModuleInit } from '@nestjs/common';
import type { ClientKafka } from '@nestjs/microservices';
import type { RecordMetadata } from 'kafkajs';
import type { KafkaModuleOptions, KafkaOutgoingMessage, KafkaPublishOptions, KafkaSendOptions } from './kafka.interfaces.js';
/**
 * Publishes messages to Kafka. Inject it anywhere once `KafkaModule` is imported.
 */
export declare class KafkaProducerService implements OnModuleInit, OnApplicationShutdown {
    private readonly kafkaClient;
    private readonly options;
    private readonly logger;
    private readonly requestReplyTopics;
    constructor(kafkaClient: ClientKafka, options: KafkaModuleOptions);
    /** The underlying Nest `ClientKafka`, for anything this service doesn't cover. */
    get client(): ClientKafka;
    onModuleInit(): Promise<void>;
    onApplicationShutdown(): Promise<void>;
    /** Fire-and-forget publish (Nest `@EventPattern` on the consuming side). */
    emit<T>(topic: string, value: T, options?: KafkaPublishOptions): Promise<RecordMetadata[]>;
    /** Publishes several messages to one topic in a single request. */
    emitBatch<T>(topic: string, messages: KafkaOutgoingMessage<T>[]): Promise<RecordMetadata[]>;
    /**
     * Request/response publish (Nest `@MessagePattern` on the consuming side).
     * The topic must be listed in `KafkaModuleOptions.requestReplyTopics`.
     */
    send<TResult = unknown, TInput = unknown>(topic: string, value: TInput, { timeoutMs, ...options }?: KafkaSendOptions): Promise<TResult>;
}
//# sourceMappingURL=kafka-producer.service.d.ts.map