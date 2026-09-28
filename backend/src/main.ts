import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { parseEnvironment } from './common/environment';

async function bootstrap() {
  const config = parseEnvironment(process.env);
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  await app.listen(config.PORT, config.HOST);
}

bootstrap().catch(() => {
  // Do not print environment values or secrets on startup failure.
  console.error('Backend startup failed. Check configuration and port availability.');
  process.exitCode = 1;
});
