import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { WebhooksController } from './webhooks.controller';
import { MonoWebhookService } from './webhook.service';

describe('WebhooksController', () => {
  let controller: WebhooksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers: [
        { provide: MonoWebhookService, useValue: {} },
        { provide: PinoLogger,         useValue: { setContext: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() } },
        { provide: ConfigService,      useValue: { get: jest.fn().mockReturnValue('test-webhook-secret') } },
      ],
    }).compile();

    controller = module.get<WebhooksController>(WebhooksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
