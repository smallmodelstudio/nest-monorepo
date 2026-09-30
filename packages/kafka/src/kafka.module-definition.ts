import { ConfigurableModuleBuilder } from '@nestjs/common';
import type { KafkaModuleOptions } from './kafka.interfaces.js';

export const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN: KAFKA_MODULE_OPTIONS,
  OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<KafkaModuleOptions>()
  .setClassMethodName('forRoot')
  .setExtras({ isGlobal: false }, (definition, extras) => ({
    ...definition,
    global: extras.isGlobal,
  }))
  .build();

/** Injection token for the underlying Nest `ClientKafka` instance. */
export const KAFKA_CLIENT = Symbol('KAFKA_CLIENT');
