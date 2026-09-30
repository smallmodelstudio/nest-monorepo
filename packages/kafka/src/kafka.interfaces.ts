import type { KafkaOptions } from '@nestjs/microservices';
import type { IHeaders } from 'kafkajs';

/**
 * The options object Nest's Kafka transport accepts (`client`, `consumer`,
 * `producer`, `run`, `subscribe`, `send`, serializers, ...). The same object
 * configures both the producer client and the consumer microservice.
 */
export type KafkaTransportOptions = NonNullable<KafkaOptions['options']>;

export interface KafkaModuleOptions {
  /** Passed straight through to Nest's Kafka transport. See `kafkaOptionsFromEnv()`. */
  kafka: KafkaTransportOptions;
  /**
   * Topics you call `KafkaProducerService.send()` on (request/response).
   * Nest must subscribe to their `<topic>.reply` topics before connecting,
   * so every request/response topic has to be listed here.
   */
  requestReplyTopics?: string[];
  /**
   * Connect the producer while the app boots (default `true`), so a broken
   * broker config fails fast. When `false` the producer connects on first use.
   */
  connectOnInit?: boolean;
}

export interface KafkaPublishOptions {
  /** Message key. Messages with the same key always land on the same partition. */
  key?: string | Buffer | null;
  headers?: IHeaders;
  partition?: number;
  timestamp?: string;
}

export interface KafkaSendOptions extends KafkaPublishOptions {
  /** How long to wait for a reply before rejecting (default 30s). */
  timeoutMs?: number;
}

export interface KafkaOutgoingMessage<T = unknown> extends KafkaPublishOptions {
  value: T;
}

/** Decoded metadata for an incoming message. See `getKafkaMessageMeta()`. */
export interface KafkaMessageMeta {
  topic: string;
  partition: number;
  offset: string;
  timestamp: string;
  key: string | null;
  headers: Record<string, string | undefined>;
}
