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
export function getKafkaMessageMeta(context) {
    const message = context.getMessage();
    const headers = {};
    for (const [name, value] of Object.entries(message.headers ?? {})) {
        headers[name] = decodeHeader(value);
    }
    return {
        topic: context.getTopic(),
        partition: context.getPartition(),
        offset: message.offset,
        timestamp: message.timestamp,
        key: message.key == null ? null : message.key.toString(),
        headers,
    };
}
function decodeHeader(value) {
    if (value == null)
        return undefined;
    if (Array.isArray(value))
        return value.map(String).join(',');
    return value.toString();
}
//# sourceMappingURL=kafka.utils.js.map