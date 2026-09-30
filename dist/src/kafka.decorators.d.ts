/**
 * `@EventPattern(topic)` bound to the Kafka transport, so the handler is never
 * registered on another transport in a multi-transport app.
 *
 * It also sidesteps Nest 12's typed `EventPattern` overload: with a plain string
 * topic that overload types extra handler arguments as `unknown`, which rejects
 * `@Ctx() context: KafkaContext`.
 */
export declare function KafkaEventPattern(topic: string, extras?: Record<string, unknown>): MethodDecorator;
/** `@MessagePattern(topic)` (request/response) bound to the Kafka transport. */
export declare function KafkaMessagePattern(topic: string, extras?: Record<string, unknown>): MethodDecorator;
//# sourceMappingURL=kafka.decorators.d.ts.map