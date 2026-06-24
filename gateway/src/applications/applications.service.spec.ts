import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ApplicationsService } from './applications.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MonoService } from 'src/mono/mono.service';
import { OutboundWebhookService } from 'src/queues/outbound-webhook.service';

const mockPrisma = {
  applicant:   { upsert: jest.fn() },
  application: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
  user:        { findUnique: jest.fn() },
  bankAccount: { findMany: jest.fn() },
};

const mockMonoService     = { initiateAccountLinking: jest.fn() };
const mockWebhookService  = { dispatch: jest.fn() };
const mockLogger          = { setContext: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };

describe('ApplicationsService', () => {
  let service: ApplicationsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: PrismaService,          useValue: mockPrisma         },
        { provide: MonoService,            useValue: mockMonoService    },
        { provide: OutboundWebhookService, useValue: mockWebhookService },
        { provide: PinoLogger,             useValue: mockLogger         },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
  });

  // ── findOne ──────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('throws NotFoundException when application does not belong to the fintech', async () => {
      mockPrisma.application.findFirst.mockResolvedValue(null);
      await expect(service.findOne('app-1', 'fintech-1')).rejects.toThrow(NotFoundException);
    });

    it('returns the application when found', async () => {
      const app = { id: 'app-1', status: 'LINKED', applicant: { bankAccounts: [] } };
      mockPrisma.application.findFirst.mockResolvedValue(app);

      const result = await service.findOne('app-1', 'fintech-1');

      expect(result).toBe(app);
    });
  });

  // ── linkAccount ──────────────────────────────────────────────────────────────

  describe('linkAccount', () => {
    it('throws NotFoundException when application is not found or belongs to a different fintech', async () => {
      mockPrisma.application.findFirst.mockResolvedValue(null);
      await expect(service.linkAccount('app-1', 'fintech-1')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException for a terminal application status', async () => {
      for (const status of ['COMPLETED', 'FAILED', 'ABANDONED']) {
        mockPrisma.application.findFirst.mockResolvedValue({ status, applicant: {} });
        await expect(service.linkAccount('app-1', 'fintech-1')).rejects.toThrow(BadRequestException);
      }
    });

    it('returns a widgetUrl on success', async () => {
      const app = { id: 'app-1', status: 'LINKED', applicant: { id: 'ap-1', firstName: 'Ada', lastName: 'L', email: 'a@b.com' } };
      mockPrisma.application.findFirst.mockResolvedValue(app);
      mockPrisma.user.findUnique.mockResolvedValue({ monoApiKey: 'mk' });
      mockMonoService.initiateAccountLinking.mockResolvedValue({ widgetUrl: 'https://connect.mono.co/xyz' });

      const result = await service.linkAccount('app-1', 'fintech-1');

      expect(result.widgetUrl).toBe('https://connect.mono.co/xyz');
    });
  });

  // ── finalizeAccountLinking ───────────────────────────────────────────────────

  describe('finalizeAccountLinking', () => {
    it('throws NotFoundException when application is not found', async () => {
      mockPrisma.application.findFirst.mockResolvedValue(null);
      await expect(service.finalizeAccountLinking('app-1', 'fintech-1')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when the application is not in LINKED status', async () => {
      mockPrisma.application.findFirst.mockResolvedValue({ status: 'PENDING_LINKING', bankAccountIds: [], applicant: {} });
      await expect(service.finalizeAccountLinking('app-1', 'fintech-1')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when no accounts have been linked yet', async () => {
      mockPrisma.application.findFirst.mockResolvedValue({ status: 'LINKED', bankAccountIds: [], applicant: {} });
      await expect(service.finalizeAccountLinking('app-1', 'fintech-1')).rejects.toThrow(BadRequestException);
    });

    it('dispatches ready_for_analysis immediately when all accounts are already enriched', async () => {
      mockPrisma.application.findFirst.mockResolvedValue({
        id: 'app-1', status: 'LINKED', bankAccountIds: ['ba-1'], applicantId: 'ap-1', applicant: {},
      });
      mockPrisma.application.update.mockResolvedValue({});
      mockPrisma.bankAccount.findMany.mockResolvedValue([{ enrichmentStatus: 'READY' }]);

      const result = await service.finalizeAccountLinking('app-1', 'fintech-1');

      expect(mockWebhookService.dispatch).toHaveBeenCalledWith(
        'fintech-1',
        'application.ready_for_analysis',
        expect.objectContaining({ applicationId: 'app-1' }),
      );
      expect(result.allReady).toBe(true);
    });

    it('does not dispatch ready_for_analysis when enrichment is still pending', async () => {
      mockPrisma.application.findFirst.mockResolvedValue({
        id: 'app-1', status: 'LINKED', bankAccountIds: ['ba-1'], applicantId: 'ap-1', applicant: {},
      });
      mockPrisma.application.update.mockResolvedValue({});
      mockPrisma.bankAccount.findMany.mockResolvedValue([{ enrichmentStatus: 'PENDING' }]);

      const result = await service.finalizeAccountLinking('app-1', 'fintech-1');

      expect(mockWebhookService.dispatch).not.toHaveBeenCalled();
      expect(result.allReady).toBe(false);
    });
  });

  // ── manualDecision ───────────────────────────────────────────────────────────

  describe('manualDecision', () => {
    it('throws NotFoundException when application is not in MANUAL_REVIEW', async () => {
      mockPrisma.application.findFirst.mockResolvedValue(null);
      await expect(service.manualDecision('app-1', 'fintech-1', 'APPROVE')).rejects.toThrow(NotFoundException);
    });

    it('sets status to COMPLETED and records the decision on approval', async () => {
      mockPrisma.application.findFirst.mockResolvedValue({ id: 'app-1', decision: {} });
      mockPrisma.application.update.mockResolvedValue({});

      await service.manualDecision('app-1', 'fintech-1', 'APPROVE');

      expect(mockPrisma.application.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'COMPLETED',
            decision: expect.objectContaining({ decision: 'APPROVED', manually_reviewed: true }),
          }),
        }),
      );
    });

    it('records REJECTED decision on decline', async () => {
      mockPrisma.application.findFirst.mockResolvedValue({ id: 'app-1', decision: {} });
      mockPrisma.application.update.mockResolvedValue({});

      await service.manualDecision('app-1', 'fintech-1', 'DECLINE');

      expect(mockPrisma.application.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            decision: expect.objectContaining({ decision: 'REJECTED' }),
          }),
        }),
      );
    });
  });
});
