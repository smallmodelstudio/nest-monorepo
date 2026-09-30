# nest-monorepo-kafka

Drop-in Kafka for NestJS 12. It wraps [`@nestjs/microservices` Kafka](https://docs.nestjs.com/microservices/kafka) and adds a Nest CLI schematic that sets up a working producer, consumer, local broker and config in one command:

```bash
nest add nest-monorepo-kafka
```

## What you get

- **`KafkaModule`**: `forRoot` / `forRootAsync` (optionally global). Registers a Kafka producer client and shares its config with the consumer.
- **`KafkaProducerService`**: typed `emit()`, `emitBatch()` and request/response `send()` that return promises, not observables.
- **`connectKafkaMicroservice(app)`**: one line to turn an HTTP app into a hybrid HTTP + Kafka consumer app, using the same config.
- **`KafkaEventPattern` / `KafkaMessagePattern`**: Nest's `EventPattern` / `MessagePattern` bound to the Kafka transport.
- **`getKafkaMessageMeta(ctx)`**: decoded key, headers, topic, partition and offset for an incoming message.
- **`kafkaOptionsFromEnv()`**: builds all connection config from `KAFKA_*` env vars, including SSL and SASL.
- **Schematics**: `nest add` for full setup, plus `consumer` and `producer` generators.
- **Docker Compose**: single-node Kafka (KRaft, no ZooKeeper) and [Kafka UI](https://github.com/kafbat/kafka-ui).

## Requirements

- Node.js `^22.22.3 || ^24.15.0 || >=26`
- NestJS 12 (`@nestjs/common`, `@nestjs/core`, `@nestjs/microservices` `^12`)
- Docker with Compose v2, for the local broker

## Install

### Option A: `nest add` (recommended)

From the root of a Nest project:

```bash
nest add nest-monorepo-kafka
```

This installs the package, then:

| Change | Details |
| --- | --- |
| `package.json` | adds `@nestjs/microservices` (same version range as `@nestjs/core`), `kafkajs`, and `kafka:up` / `kafka:down` / `kafka:logs` scripts |
| `src/kafka/app-kafka.module.ts` | `AppKafkaModule`, which registers `KafkaModule.forRootAsync({ isGlobal: true, ... })` |
| `src/kafka/kafka.topics.ts` | a `KafkaTopics` map, the single place topic names live |
| `src/kafka/example/*` | example consumer (event + request/response), typed producer, and HTTP endpoints to trigger them |
| `src/app.module.ts` | imports `AppKafkaModule` |
| `src/main.ts` | adds `enableShutdownHooks()`, `connectKafkaMicroservice(app)` and `startAllMicroservices()` |
| `docker-compose.kafka.yml` | Kafka broker + Kafka UI |
| `.env.example` (and `.env` if it exists) | `KAFKA_*` variables; existing values are never touched |

Then try it:

```bash
pnpm kafka:up        # Kafka on localhost:9092, Kafka UI on http://localhost:8080
pnpm start:dev

# fire-and-forget event -> ExampleConsumer logs it
curl -X POST localhost:3000/kafka/example/events \
  -H 'content-type: application/json' -d '{"message":"hello"}'

# request/response -> returns the consumer's reply
curl -X POST localhost:3000/kafka/example/requests \
  -H 'content-type: application/json' -d '{"message":"ping"}'
```

The schematic is safe to re-run: files that already exist are skipped and edits are never duplicated.

**Options** (pass them as `--name=value`; the `--no-name` form is not forwarded by `nest add`):

| Option | Default | Effect |
| --- | --- | --- |
| `--example=false` | `true` | skip the example consumer/producer/controller |
| `--docker=false` | `true` | skip `docker-compose.kafka.yml` and the `kafka:*` scripts |
| `--main=false` | `true` | leave `main.ts` alone (for producer-only apps, or custom bootstraps) |
| `--skip-install` | `false` | install nothing: neither this package nor `@nestjs/microservices` / `kafkajs` |

If your `main.ts` or `app.module.ts` doesn't look like the Nest default, the schematic leaves the file untouched and prints the lines to add by hand.

### Option B: manual install

```bash
pnpm add nest-monorepo-kafka @nestjs/microservices kafkajs
```

```ts
// app.module.ts
import { KafkaModule, kafkaOptionsFromEnv } from 'nest-monorepo-kafka';

@Module({
  imports: [
    KafkaModule.forRootAsync({
      isGlobal: true,
      useFactory: () => ({ kafka: kafkaOptionsFromEnv() }),
    }),
  ],
})
export class AppModule {}
```

```ts
// main.ts: only needed if this app consumes messages
import { connectKafkaMicroservice } from 'nest-monorepo-kafka';

const app = await NestFactory.create(AppModule);
app.enableShutdownHooks();
connectKafkaMicroservice(app);
await app.startAllMicroservices();
await app.listen(3000);
```

## Generators

The Nest CLI can run this package's schematics with `-c` (`--collection`):

```bash
nest g -c nest-monorepo-kafka consumer orders            # alias: kc
nest g -c nest-monorepo-kafka producer orders            # alias: kp
nest g -c nest-monorepo-kafka producer order-created kafka   # 3rd arg = path under src/
nest g -c nest-monorepo-kafka init                       # re-run the nest-add setup
```

`consumer orders` creates `src/orders/orders.consumer.ts` (+ spec), adds `ORDERS: 'orders'` to `KafkaTopics`, and registers the consumer in the nearest module's `controllers`. `producer` does the same with an injectable registered in `providers`. If the topic is already in `KafkaTopics`, its existing key is reused.

The topic defaults to the name. To use a different topic, change its value in `src/kafka/kafka.topics.ts`. Producers and consumers reference the constant, so that one edit covers both.

`nest g` forwards its standard flags: `--flat`, `--no-spec`, `--skip-import`, `--dry-run`, `--project`. (It rejects any other option, so `nest g` can't pass a custom `--topic`.)

Don't set `"collection": "nest-monorepo-kafka"` in `nest-cli.json`. That replaces `@nestjs/schematics`, and `nest g controller` etc. would stop working.

## Local Kafka

`docker-compose.kafka.yml` runs a single-node KRaft broker and Kafka UI:

| | Address |
| --- | --- |
| Broker, from your app on the host | `localhost:9092` |
| Broker, from other containers on the compose network | `kafka:29092` |
| Kafka UI | <http://localhost:8080> |

Override with env vars when starting it: `KAFKA_PORT`, `KAFKA_UI_PORT`, `KAFKA_IMAGE_TAG` (default `3.9.2`), `KAFKA_UI_IMAGE_TAG`.

Topics are auto-created on first use (3 partitions each). Data is ephemeral: `kafka:down` wipes it.

> **Why Kafka 3.9 by default?** Nest's Kafka transport is built on KafkaJS 2.x, which hasn't been updated in several years. Kafka 4.x removed a number of old protocol versions, so the default stays on the last 3.x line, where KafkaJS is known to work. If you want to try 4.x: `KAFKA_IMAGE_TAG=4.3.1 pnpm kafka:up`.

## Configuration

`kafkaOptionsFromEnv()` reads:

| Variable | Default | Notes |
| --- | --- | --- |
| `KAFKA_BROKERS` | `localhost:9092` | comma-separated |
| `KAFKA_CLIENT_ID` | `nest-app` | Nest appends `-client` / `-server` |
| `KAFKA_GROUP_ID` | `KAFKA_CLIENT_ID` | consumer group; Nest appends `-server` (and `-client` for the reply consumer) |
| `KAFKA_SSL` | `false` | `true` / `false` |
| `KAFKA_SASL_MECHANISM` | unset | `plain`, `scram-sha-256` or `scram-sha-512` |
| `KAFKA_SASL_USERNAME` / `KAFKA_SASL_PASSWORD` | | required when a SASL mechanism is set |
| `KAFKA_CONNECTION_TIMEOUT_MS` | `3000` | |
| `KAFKA_RETRIES` | `5` | KafkaJS connection retries |

Invalid values throw at startup with a message naming the variable.

**Loading `.env`**: Nest doesn't read `.env` files by itself. Either use `@nestjs/config` (`ConfigModule.forRoot()`; the generated `forRootAsync` factory runs after it has loaded the file), or run Node with `--env-file-if-exists=.env`. The defaults already match the local compose broker, so you can skip `.env` for local development.

Anything else goes in the first argument, merged section by section over the env config:

```ts
kafkaOptionsFromEnv({
  consumer: { sessionTimeout: 45_000 },
  subscribe: { fromBeginning: true },
  run: { partitionsConsumedConcurrently: 3 },
});
```

With `@nestjs/config`:

```ts
KafkaModule.forRootAsync({
  isGlobal: true,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    kafka: {
      client: { clientId: 'orders-api', brokers: config.getOrThrow<string>('KAFKA_BROKERS').split(',') },
      consumer: { groupId: 'orders-api' },
    },
  }),
});
```

### `KafkaModuleOptions`

| Option | Default | |
| --- | --- | --- |
| `kafka` | required | Nest Kafka transport options (`client`, `consumer`, `producer`, `run`, `subscribe`, `send`, `serializer`, ...) |
| `requestReplyTopics` | `[]` | topics you call `send()` on. Nest subscribes to their `<topic>.reply` topics at startup. With none, the client runs in producer-only mode and doesn't join a consumer group. |
| `connectOnInit` | `true` | connect the producer during bootstrap (fail fast). Set `false` to connect on first publish. |
| `isGlobal` | `false` | make `KafkaProducerService` injectable everywhere |

## Usage

### Producing

```ts
@Injectable()
export class OrdersService {
  constructor(private readonly kafka: KafkaProducerService) {}

  async placeOrder(order: Order) {
    // Same key -> same partition -> ordered per order.
    await this.kafka.emit(KafkaTopics.ORDERS, order, { key: order.id, headers: { source: 'api' } });
  }

  async placeMany(orders: Order[]) {
    await this.kafka.emitBatch(KafkaTopics.ORDERS, orders.map((o) => ({ key: o.id, value: o })));
  }

  async getQuote(sku: string) {
    // The topic must be in requestReplyTopics; rejects after 30s by default.
    return this.kafka.send<Quote>(KafkaTopics.QUOTES, { sku }, { timeoutMs: 5_000 });
  }
}
```

`kafka.client` exposes the underlying `ClientKafka` for anything else. You can also inject it with `@Inject(KAFKA_CLIENT)`.

### Consuming

```ts
@Controller()
export class OrdersConsumer {
  @KafkaEventPattern(KafkaTopics.ORDERS)
  async onOrder(@Payload() order: Order, @Ctx() ctx: KafkaContext) {
    const { key, headers, partition, offset } = getKafkaMessageMeta(ctx);
    // ...
  }

  @KafkaMessagePattern(KafkaTopics.QUOTES)
  quote(@Payload() { sku }: { sku: string }): Quote {
    return { sku, price: 42 }; // the return value is sent back as the reply
  }
}
```

Consumers are controllers, so list them in a module's `controllers`.

> Nest 12's `@EventPattern('topic')` has a typed overload that makes TypeScript reject `@Ctx() ctx: KafkaContext` as a second parameter. `KafkaEventPattern` avoids that (so does `@EventPattern<string>('topic')`).

**Errors and retries.** If an event handler throws, Nest logs the error and the offset is still committed, so the message is not retried. To have it redelivered, throw `KafkaRetriableException` from `@nestjs/microservices`. For poison messages, catch the error and publish the message to a dead-letter topic yourself.

### Standalone consumer (worker process)

For a worker with no HTTP server:

```ts
import { kafkaMicroserviceOptions, kafkaOptionsFromEnv } from 'nest-monorepo-kafka';

const app = await NestFactory.createMicroservice(WorkerModule, kafkaMicroserviceOptions(kafkaOptionsFromEnv()));
app.enableShutdownHooks();
await app.listen();
```

### Testing

Swap in a fake producer so unit tests never need a broker:

```ts
await Test.createTestingModule({
  providers: [OrdersService, { provide: KafkaProducerService, useValue: { emit: async () => [] } }],
}).compile();
```

The generated `*.producer.spec.ts` files show this pattern.

## Production notes

- Create topics explicitly, with the partitions and replication you need, and turn off auto-creation on the broker.
- For request/response, the `<topic>.reply` topics must exist too.
- Each app instance with the same `KAFKA_GROUP_ID` shares the partitions of the topics it consumes. Different services should use different group IDs.
- Set `KAFKA_SSL=true` and SASL variables for managed Kafka (Confluent Cloud, MSK, Aiven, Redpanda Cloud, ...).

## API reference

| Export | Kind |
| --- | --- |
| `KafkaModule` | module (`forRoot`, `forRootAsync`) |
| `KafkaProducerService` | injectable: `emit`, `emitBatch`, `send`, `client` |
| `KafkaEventPattern`, `KafkaMessagePattern` | method decorators |
| `connectKafkaMicroservice(app, { kafka?, inheritAppConfig? })` | attach a consumer to a hybrid app |
| `kafkaMicroserviceOptions(options)` | options for `NestFactory.createMicroservice` |
| `kafkaOptionsFromEnv(overrides?, env?)` | env-driven transport options |
| `getKafkaMessageMeta(ctx)` | decoded message metadata |
| `KAFKA_CLIENT`, `KAFKA_MODULE_OPTIONS` | injection tokens |
| `KafkaModuleOptions`, `KafkaTransportOptions`, `KafkaPublishOptions`, `KafkaSendOptions`, `KafkaOutgoingMessage`, `KafkaMessageMeta` | types |
