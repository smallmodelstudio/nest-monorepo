# nest-monorepo

A pnpm workspace of drop-in NestJS packages. Each package is published to npm on its own and ships Nest CLI schematics, so adding it to an app takes one `nest add` command.

| Package | Description |
| --- | --- |
| [`nest-monorepo-kafka`](packages/kafka) | Kafka for NestJS 12: module, producer client, consumer wiring, docker compose, `nest add` + generators |

## Using a package in your Nest app

### Kafka

Requires Node.js `^22.22.3 || ^24.15.0`, a NestJS 12 project, and Docker for the local broker.

```bash
# 1. In your Nest project: install + scaffold everything
nest add nest-monorepo-kafka

# 2. Start a local Kafka broker (localhost:9092) and Kafka UI (http://localhost:8080)
pnpm kafka:up

# 3. Run the app
pnpm start:dev

# 4. Send a message through Kafka and watch ExampleConsumer log it
curl -X POST localhost:3000/kafka/example/events \
  -H 'content-type: application/json' -d '{"message":"hello"}'
```

Generate more consumers and producers:

```bash
nest g -c nest-monorepo-kafka consumer orders
nest g -c nest-monorepo-kafka producer orders
```

See the [package README](packages/kafka/README.md) for everything `nest add` changes, its options, configuration (env vars, SSL/SASL, `@nestjs/config`), the API, and production notes.

## Working on this repo

### Setup

```bash
corepack enable          # uses the pnpm version pinned in package.json
pnpm install
pnpm build               # build all packages
pnpm test                # run all package tests
pnpm typecheck
```

### Layout

```text
nest-monorepo/
├── package.json             # workspace scripts (run across all packages)
├── pnpm-workspace.yaml
├── tsconfig.base.json       # shared compiler options (ESM / NodeNext, decorators)
└── packages/
    └── kafka/               # nest-monorepo-kafka
        ├── src/             # runtime library (KafkaModule, KafkaProducerService, ...)
        ├── schematics/      # Nest CLI schematics: nest-add, consumer, producer
        │   └── */files/     # templates rendered into the user's project
        ├── scripts/         # build helpers
        └── test/            # vitest: library unit tests + schematic tests
```

Packages are ESM-only and target NestJS 12, which is itself ESM-only. Generated code detects `"type": "module"` in the target app and adds `.js` import suffixes only when they're needed.

### Trying a package in a real Nest app before publishing

```bash
# in this repo
pnpm --filter nest-monorepo-kafka pack --pack-destination /tmp

# in a scratch Nest app (nest new my-app)
pnpm add /tmp/nest-monorepo-kafka-0.1.0.tgz
nest add nest-monorepo-kafka --skip-install    # --skip-install: already installed from the tarball
pnpm install && pnpm build
```

Or point the Nest CLI at the built collection to try schematic changes without re-packing. The library itself still has to be installed in the app for the result to compile:

```bash
pnpm --filter nest-monorepo-kafka build
cd /path/to/nest-app
nest g -c /path/to/nest-monorepo/packages/kafka/dist/schematics/collection.json init
nest g -c /path/to/nest-monorepo/packages/kafka/dist/schematics/collection.json consumer orders --dry-run
```

### How the Nest CLI integration works

- `nest add <pkg>` installs the package, then runs the schematic named **`nest-add`** from the collection listed in the package's `"schematics"` field in `package.json`.
- `nest g -c <pkg> <schematic>` runs any other schematic in that collection.
- Schematic factories are compiled from `schematics/**/index.ts`. Templates in `schematics/**/files/` are copied to `dist/` as-is by `scripts/copy-schematic-assets.mjs`.
- Schematic tests (`test/*.schematic.spec.ts`) run the compiled collection against an in-memory Nest project, so `pnpm test` builds first.

### Publishing

```bash
cd packages/kafka
pnpm version patch       # or minor / major
pnpm publish             # prepack runs the build
```

### Adding a new package

1. Create `packages/<name>/` with its own `package.json` (name, `"type": "module"`, `exports`, and `"schematics"` if it has any).
2. Extend `../../tsconfig.base.json` from the package's `tsconfig.json`.
3. Give it `build`, `test`, `typecheck` and `clean` scripts. The root scripts run them across every package.
