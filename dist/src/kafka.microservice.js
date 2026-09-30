import { Transport } from '@nestjs/microservices';
import { KAFKA_MODULE_OPTIONS } from './kafka.module-definition.js';
/** Wraps transport options as Nest microservice options for `Transport.KAFKA`. */
export function kafkaMicroserviceOptions(options) {
    // producerOnlyMode is a client-side flag; a consumer must never inherit it.
    const { producerOnlyMode: _producerOnlyMode, ...serverOptions } = options;
    return { transport: Transport.KAFKA, options: serverOptions };
}
/**
 * Attaches a Kafka consumer to a hybrid (HTTP + Kafka) app, reusing the
 * options passed to `KafkaModule.forRoot()`. Call `app.startAllMicroservices()`
 * afterwards.
 */
export function connectKafkaMicroservice(app, { kafka, inheritAppConfig = true } = {}) {
    const moduleOptions = app.get(KAFKA_MODULE_OPTIONS, {
        strict: false,
    });
    return app.connectMicroservice(kafkaMicroserviceOptions({ ...moduleOptions.kafka, ...kafka }), { inheritAppConfig });
}
//# sourceMappingURL=kafka.microservice.js.map