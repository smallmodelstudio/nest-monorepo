import type { KafkaContext } from '@nestjs/microservices';
import type { KafkaMessageMeta } from './kafka.interfaces.js';
/**
 * Pulls decoded topic/partition/offset/key/headers out of a `KafkaContext`.
 *
 * ```ts
 * @EventPattern('orders.created')
 * handle(@Payload() order: Order, @Ctx() ctx: KafkaContext) {
 *   const { key, headers, offset } = getKafkaMessageMeta(ctx);
 * }
 * ```
 */
export declare function getKafkaMessageMeta(context: KafkaContext): KafkaMessageMeta;
//# sourceMappingURL=kafka.utils.d.ts.map