import { Module } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import type { KafkaModuleOptions } from './kafka.interfaces.js';
import {
  ConfigurableModuleClass,
  KAFKA_CLIENT,
  KAFKA_MODULE_OPTIONS,
} from './kafka.module-definition.js';
import { KafkaProducerService } from './kafka-producer.service.js';

/**
 * Registers a Kafka producer client (`KafkaProducerService`) and exposes the
 * module options so `connectKafkaMicroservice(app)` can start consumers with
 * the same config.
 *
 * ```ts
 * KafkaModule.forRoot({ isGlobal: true, kafka: kafkaOptionsFromEnv() })
 * KafkaModule.forRootAsync({ inject: [ConfigService], useFactory: (config) => ({ kafka: ... }) })
 * ```
 */
@Module({
  providers: [
    {
      provide: KAFKA_CLIENT,
      inject: [KAFKA_MODULE_OPTIONS],
      useFactory: ({ kafka, requestReplyTopics = [] }: KafkaModuleOptions) =>
        new ClientKafka({
          ...kafka,
          // Without request/response topics the client's consumer would only
          // join a group and sit idle, so skip creating it.
          producerOnlyMode:
            kafka.producerOnlyMode ?? requestReplyTopics.length === 0,
        }),
    },
    KafkaProducerService,
  ],
  exports: [KAFKA_CLIENT, KAFKA_MODULE_OPTIONS, KafkaProducerService],
})
export class KafkaModule extends ConfigurableModuleClass {}
