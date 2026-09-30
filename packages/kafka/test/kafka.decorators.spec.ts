import 'reflect-metadata';
import { Transport } from '@nestjs/microservices';
import { KafkaEventPattern, KafkaMessagePattern } from '../src/index.js';

const PATTERN = 'microservices:pattern';
const TRANSPORT = 'microservices:transport';
const HANDLER_TYPE = 'microservices:handler_type';

class Handlers {
  @KafkaEventPattern('orders.created')
  onEvent(): void {}

  @KafkaMessagePattern('orders.get', { note: 1 })
  onRequest(): void {}
}

describe('Kafka pattern decorators', () => {
  it.each([
    ['onEvent', 'orders.created'],
    ['onRequest', 'orders.get'],
  ] as const)('%s registers %s on the Kafka transport', (method, topic) => {
    const handler = Handlers.prototype[method];
    expect(Reflect.getMetadata(PATTERN, handler)).toEqual([topic]);
    expect(Reflect.getMetadata(TRANSPORT, handler)).toBe(Transport.KAFKA);
  });

  it('marks events and requests with different handler types', () => {
    expect(
      Reflect.getMetadata(HANDLER_TYPE, Handlers.prototype.onEvent),
    ).not.toBe(Reflect.getMetadata(HANDLER_TYPE, Handlers.prototype.onRequest));
  });
});
