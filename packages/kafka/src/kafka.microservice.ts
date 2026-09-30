import type { INestApplication, INestMicroservice } from '@nestjs/common';
import { Transport, type KafkaOptions } from '@nestjs/microservices';
import type {
  KafkaModuleOptions,
  KafkaTransportOptions,
} from './kafka.interfaces.js';
import { KAFKA_MODULE_OPTIONS } from './kafka.module-definition.js';

/** Wraps transport options as Nest microservice options for `Transport.KAFKA`. */
export function kafkaMicroserviceOptions(
  options: KafkaTransportOptions,
): KafkaOptions {
  // producerOnlyMode is a client-side flag; a consumer must never inherit it.
  const { producerOnlyMode: _producerOnlyMode, ...serverOptions } = options;
  return { transport: Transport.KAFKA, options: serverOptions };
}

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
export function connectKafkaMicroservice(
  app: INestApplication,
  { kafka, inheritAppConfig = true }: ConnectKafkaMicroserviceOptions = {},
): INestMicroservice {
  const moduleOptions = app.get<KafkaModuleOptions>(KAFKA_MODULE_OPTIONS, {
    strict: false,
  });
  return app.connectMicroservice<KafkaOptions>(
    kafkaMicroserviceOptions({ ...moduleOptions.kafka, ...kafka }),
    { inheritAppConfig },
  );
}
