import type { INestApplication, INestMicroservice } from '@nestjs/common';
import { type KafkaOptions } from '@nestjs/microservices';
import type { KafkaTransportOptions } from './kafka.interfaces.js';
/** Wraps transport options as Nest microservice options for `Transport.KAFKA`. */
export declare function kafkaMicroserviceOptions(options: KafkaTransportOptions): KafkaOptions;
export interface ConnectKafkaMicroserviceOptions {
    /** Shallow-merged over the options given to `KafkaModule.forRoot()`. */
    kafka?: KafkaTransportOptions;
    /** Apply the HTTP app's global pipes/filters/guards/interceptors to consumers (default `true`). */
    inheritAppConfig?: boolean;
}
/**
 * Attaches a Kafka consumer to a hybrid (HTTP + Kafka) app, reusing the
 * options passed to `KafkaModule.forRoot()`. Call `app.startAllMicroservices()`
 * afterwards.
 */
export declare function connectKafkaMicroservice(app: INestApplication, { kafka, inheritAppConfig }?: ConnectKafkaMicroserviceOptions): INestMicroservice;
//# sourceMappingURL=kafka.microservice.d.ts.map