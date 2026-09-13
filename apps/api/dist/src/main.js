"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
process.on('uncaughtException', (err) => {
    console.error('💥 [uncaughtException] Process sẽ thoát để được restart:', err);
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    console.error('💥 [unhandledRejection] Process sẽ thoát để được restart:', reason);
    process.exit(1);
});
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { rawBody: true });
    app.setGlobalPrefix('api/v1');
    app.enableCors({
        origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('NCN Academy API')
        .setDescription('API for NCN Academy career guidance platform')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.PORT ?? 3001;
    await app.listen(port);
    console.log(`🚀 NCN Academy API running on http://localhost:${port}`);
    console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap().catch((err) => {
    console.error('💥 [bootstrap] Không khởi động được API, thoát để được restart:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map