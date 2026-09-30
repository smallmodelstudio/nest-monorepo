export type PatchMainResult = {
    status: 'patched';
    content: string;
} | {
    status: 'already-patched';
} | {
    status: 'unrecognised';
};
/**
 * Turns the default `NestFactory.create()` bootstrap into a hybrid HTTP + Kafka
 * app by inserting, right after the app is created:
 *
 *   app.enableShutdownHooks();
 *   connectKafkaMicroservice(app);
 *   await app.startAllMicroservices();
 */
export declare function patchMainFile(content: string): PatchMainResult;
export declare const MANUAL_MAIN_INSTRUCTIONS = "import { connectKafkaMicroservice } from 'nest-monorepo-kafka';\n\n  const app = await NestFactory.create(AppModule);\n  app.enableShutdownHooks();\n  connectKafkaMicroservice(app);\n  await app.startAllMicroservices();\n  await app.listen(3000);";
//# sourceMappingURL=main-file.d.ts.map