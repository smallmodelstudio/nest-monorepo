import type { KafkaModuleOptions } from './kafka.interfaces.js';
export declare const ConfigurableModuleClass: import("@nestjs/common").ConfigurableModuleCls<KafkaModuleOptions, "forRoot", "create", {
    isGlobal: boolean;
}>, KAFKA_MODULE_OPTIONS: string | symbol, OPTIONS_TYPE: KafkaModuleOptions & Partial<{
    isGlobal: boolean;
}>, ASYNC_OPTIONS_TYPE: import("@nestjs/common").ConfigurableModuleAsyncOptions<KafkaModuleOptions, "create"> & Partial<{
    isGlobal: boolean;
}>;
/** Injection token for the underlying Nest `ClientKafka` instance. */
export declare const KAFKA_CLIENT: unique symbol;
//# sourceMappingURL=kafka.module-definition.d.ts.map