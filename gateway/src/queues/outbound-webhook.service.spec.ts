import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { PinoLogger } from 'nestjs-pino';
import { OutboundWebhookService } from './outbound-webhook.service';
import { PrismaService } from 'src/prisma/prisma.service';

const mockPrisma = {
  user:            { findUnique:       jest.fn() },
  webhookDelivery: { create:           jest.fn() },
};

const mockWebhooksQueue = { add: jest.fn() };
const mockLogger        = { setContext: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };

describe('OutboundWebhookService', () => {
  let service: OutboundWebhookService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutboundWebhookService,
        { provide: PrismaService,              useValue: mockPrisma        },
        { provide: PinoLogger,                 useValue: mockLogger        },
        { provide: getQueueToken('webhooks'),  useValue: mockWebhooksQueue },
      ],
    }).compile();

    service = module.get<OutboundWebhookService>(OutboundWebhookService);
  });

  describe('dispatch', () => {
    it('does nothing when the fintech has no webhook URL configured', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ webhookUrl: null });

      await service.dispatch('fintech-1', 'application.decision', { applicationId: 'app-1' });

      expect(mockPrisma.webhookDelivery.create).not.toHaveBeenCalled();
      expect(mockWebhooksQueue.add).not.toHaveBeenCalled();
    });

    it('creates a delivery record and queues it when a webhook URL is configured', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ webhookUrl: 'https://fintech.io/webhook' });
      mockPrisma.webhookDelivery.create.mockResolvedValue({ id: 'del-1' });

      await service.dispatch('fintech-1', 'application.decision', { applicationId: 'app-1' });

      expect(mockPrisma.webhookDelivery.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fintechId:  'fintech-1',
            event:      'application.decision',
            webhookUrl: 'https://fintech.io/webhook',
            status:     'PENDING',
          }),
        }),
      );
      expect(mockWebhooksQueue.add).toHaveBeenCalledWith(
        'deliver-webhook',
        { deliveryId: 'del-1' },
      );
    });
  });
});
