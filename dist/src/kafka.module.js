var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { ConfigurableModuleClass, KAFKA_CLIENT, KAFKA_MODULE_OPTIONS, } from './kafka.module-definition.js';
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
let KafkaModule = class KafkaModule extends ConfigurableModuleClass {
};
KafkaModule = __decorate([
    Module({
        providers: [
            {
                provide: KAFKA_CLIENT,
                inject: [KAFKA_MODULE_OPTIONS],
                useFactory: ({ kafka, requestReplyTopics = [] }) => new ClientKafka({
                    ...kafka,
                    // Without request/response topics the client's consumer would only
                    // join a group and sit idle, so skip creating it.
                    producerOnlyMode: kafka.producerOnlyMode ?? requestReplyTopics.length === 0,
                }),
            },
            KafkaProducerService,
        ],
        exports: [KAFKA_CLIENT, KAFKA_MODULE_OPTIONS, KafkaProducerService],
    })
], KafkaModule);
export { KafkaModule };
//# sourceMappingURL=kafka.module.js.map