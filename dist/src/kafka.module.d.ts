import { ConfigurableModuleClass } from './kafka.module-definition.js';
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
export declare class KafkaModule extends ConfigurableModuleClass {
}
//# sourceMappingURL=kafka.module.d.ts.map