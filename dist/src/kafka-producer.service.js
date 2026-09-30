var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var KafkaProducerService_1;
import { Inject, Injectable, Logger, } from '@nestjs/common';
import { lastValueFrom, timeout } from 'rxjs';
import { KAFKA_CLIENT, KAFKA_MODULE_OPTIONS, } from './kafka.module-definition.js';
const DEFAULT_SEND_TIMEOUT_MS = 30_000;
/**
 * Publishes messages to Kafka. Inject it anywhere once `KafkaModule` is imported.
 */
let KafkaProducerService = KafkaProducerService_1 = class KafkaProducerService {
    kafkaClient;
    options;
    logger = new Logger(KafkaProducerService_1.name);
    requestReplyTopics;
    constructor(kafkaClient, options) {
        this.kafkaClient = kafkaClient;
        this.options = options;
        this.requestReplyTopics = new Set(options.requestReplyTopics ?? []);
    }
    /** The underlying Nest `ClientKafka`, for anything this service doesn't cover. */
    get client() {
        return this.kafkaClient;
    }
    async onModuleInit() {
        for (const topic of this.requestReplyTopics) {
            this.kafkaClient.subscribeToResponseOf(topic);
        }
        if (this.options.connectOnInit !== false) {
            await this.kafkaClient.connect();
            this.logger.log('Kafka producer connected');
        }
    }
    async onApplicationShutdown() {
        await this.kafkaClient.close();
    }
    /** Fire-and-forget publish (Nest `@EventPattern` on the consuming side). */
    async emit(topic, value, options = {}) {
        const result = this.kafkaClient.emit(topic, {
            ...options,
            value,
        });
        return lastValueFrom(result, { defaultValue: [] });
    }
    /** Publishes several messages to one topic in a single request. */
    async emitBatch(topic, messages) {
        const result = this.kafkaClient.emitBatch(topic, {
            messages,
        });
        return lastValueFrom(result, { defaultValue: [] });
    }
    /**
     * Request/response publish (Nest `@MessagePattern` on the consuming side).
     * The topic must be listed in `KafkaModuleOptions.requestReplyTopics`.
     */
    async send(topic, value, { timeoutMs = DEFAULT_SEND_TIMEOUT_MS, ...options } = {}) {
        if (!this.requestReplyTopics.has(topic)) {
            throw new Error(`Topic "${topic}" is not registered for request/response. ` +
                `Add it to KafkaModule.forRoot({ requestReplyTopics: [...] }).`);
        }
        const result = this.kafkaClient
            .send(topic, { ...options, value })
            .pipe(timeout(timeoutMs));
        return lastValueFrom(result);
    }
};
KafkaProducerService = KafkaProducerService_1 = __decorate([
    Injectable(),
    __param(0, Inject(KAFKA_CLIENT)),
    __param(1, Inject(KAFKA_MODULE_OPTIONS)),
    __metadata("design:paramtypes", [Function, Object])
], KafkaProducerService);
export { KafkaProducerService };
//# sourceMappingURL=kafka-producer.service.js.map