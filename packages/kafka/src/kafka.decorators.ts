import { EventPattern, MessagePattern, Transport } from '@nestjs/microservices';

/**
 * `@EventPattern(topic)` bound to the Kafka transport, so the handler is never
 * registered on another transport in a multi-transport app.
 *
 * It also sidesteps Nest 12's typed `EventPattern` overload: with a plain string
 * topic that overload types extra handler arguments as `unknown`, which rejects
 * `@Ctx() context: KafkaContext`.
 */
export function KafkaEventPattern(
  topic: string,
  extras?: Record<string, unknown>,
): MethodDecorator {
  return extras
    ? EventPattern<string>(topic, Transport.KAFKA, extras)
    : EventPattern<string>(topic, Transport.KAFKA);
}

/** `@MessagePattern(topic)` (request/response) bound to the Kafka transport. */
export function KafkaMessagePattern(
  topic: string,
  extras?: Record<string, unknown>,
): MethodDecorator {
  return extras
    ? MessagePattern<string>(topic, Transport.KAFKA, extras)
    : MessagePattern<string>(topic, Transport.KAFKA);
}
