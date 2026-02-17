import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { execSync } from 'child_process';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  if (process.env.NODE_ENV === 'production') {
    try {
      console.log('Running database migrations...');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('Migrations completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  }

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);

  app.useLogger(app.get(Logger));
  app.flushLogs();
  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.enableCors({
    origin: configService.get('CORS_ORIGIN') || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api');
  const port = configService.get('PORT') || 5000;
  await app.listen(port);

  console.log(` Server running on http://localhost:${port}`);
}
bootstrap();
