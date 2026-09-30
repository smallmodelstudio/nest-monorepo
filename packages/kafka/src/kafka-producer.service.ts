import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationShutdown,
  type OnModuleInit,
} from '@nestjs/common';
import type { ClientKafka } from '@nestjs/microservices';
import type { RecordMetadata } from 'kafkajs';
import { lastValueFrom, timeout } from 'rxjs';
import type {
  KafkaModuleOptions,
  KafkaOutgoingMessage,
  KafkaPublishOptions,
  KafkaSendOptions,
} from './kafka.interfaces.js';
import {
  KAFKA_CLIENT,
  KAFKA_MODULE_OPTIONS,
} from './kafka.module-definition.js';

const DEFAULT_SEND_TIMEOUT_MS = 30_000;

/**
 * Publishes messages to Kafka. Inject it anywhere once `KafkaModule` is imported.
 */
@Injectable()
export class KafkaProducerService
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(KafkaProducerService.name);
  private readonly requestReplyTopics: ReadonlySet<string>;

  constructor(
    @Inject(KAFKA_CLIENT) private readonly kafkaClient: ClientKafka,
    @Inject(KAFKA_MODULE_OPTIONS) private readonly options: KafkaModuleOptions,
  ) {
    this.requestReplyTopics = new Set(options.requestReplyTopics ?? []);
  }

  /** The underlying Nest `ClientKafka`, for anything this service doesn't cover. */
  get client(): ClientKafka {
    return this.kafkaClient;
  }

  async onModuleInit(): Promise<void> {
    for (const topic of this.requestReplyTopics) {
      this.kafkaClient.subscribeToResponseOf(topic);
    }
    if (this.options.connectOnInit !== false) {
      await this.kafkaClient.connect();
      this.logger.log('Kafka producer connected');
    }
  }

  async onApplicationShutdown(): Promise<void> {
    await this.kafkaClient.close();
  }

  /** Fire-and-forget publish (Nest `@EventPattern` on the consuming side). */
  async emit<T>(
    topic: string,
    value: T,
    options: KafkaPublishOptions = {},
  ): Promise<RecordMetadata[]> {
    const result = this.kafkaClient.emit<RecordMetadata[]>(topic, {
      ...options,
      value,
    });
    return lastValueFrom(result, { defaultValue: [] });
  }

  /** Publishes several messages to one topic in a single request. */
  async emitBatch<T>(
    topic: string,
    messages: KafkaOutgoingMessage<T>[],
  ): Promise<RecordMetadata[]> {
    const result = this.kafkaClient.emitBatch<RecordMetadata[]>(topic, {
      messages,
    });
    return lastValueFrom(result, { defaultValue: [] });
  }

  /**
   * Request/response publish (Nest `@MessagePattern` on the consuming side).
   * The topic must be listed in `KafkaModuleOptions.requestReplyTopics`.
   */
  async send<TResult = unknown, TInput = unknown>(
    topic: string,
    value: TInput,
    { timeoutMs = DEFAULT_SEND_TIMEOUT_MS, ...options }: KafkaSendOptions = {},
  ): Promise<TResult> {
    if (!this.requestReplyTopics.has(topic)) {
      throw new Error(
        `Topic "${topic}" is not registered for request/response. ` +
          `Add it to KafkaModule.forRoot({ requestReplyTopics: [...] }).`,
      );
    }
    const result = this.kafkaClient
      .send<TResult>(topic, { ...options, value })
      .pipe(timeout(timeoutMs));
    return lastValueFrom(result);
  }
}
