import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

// ── Crash resilience ─────────────────────────────────────────────────────
// Trước đây process không có handler cho lỗi không bắt được: một exception
// hoặc promise rejection lọt lưới có thể khiến tiến trình Node treo im lặng
// (vẫn "chạy" nhưng không phản hồi request) thay vì thoát hẳn. Khi đó
// Oneshield/reverse-proxy nhận 502 vì origin không trả lời, nhưng vì process
// chưa chết nên không có process manager nào tự khởi động lại nó — lỗi cứ
// treo vĩnh viễn cho tới khi có người vào restart tay.
//
// Giải pháp: log rõ lỗi rồi CHỦ ĐỘNG thoát tiến trình (process.exit(1)).
// Kết hợp với restart policy ở tầng hạ tầng (Docker `restart: unless-stopped`,
// PM2 `--restart-delay`, hoặc systemd `Restart=always`), process sẽ tự được
// khởi động lại trong vài giây thay vì đứng yên gây 502 kéo dài.
process.on('uncaughtException', (err) => {
  console.error('💥 [uncaughtException] Process sẽ thoát để được restart:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 [unhandledRejection] Process sẽ thoát để được restart:', reason);
  process.exit(1);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('NCN Academy API')
    .setDescription('API for NCN Academy career guidance platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 NCN Academy API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  console.error('💥 [bootstrap] Không khởi động được API, thoát để được restart:', err);
  process.exit(1);
});
