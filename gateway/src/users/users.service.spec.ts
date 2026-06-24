import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from 'src/prisma/prisma.service';

const mockPrisma = {
  user: {
    create:     jest.fn(),
    findUnique: jest.fn(),
    update:     jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  // ── create ───────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('hashes the password before persisting — never stores plaintext', async () => {
      mockPrisma.user.create.mockResolvedValue({ id: 'u1', email: 'a@b.com' });

      await service.create('a@b.com', 'plaintext', 'Ada', 'Acme');

      const storedPassword = mockPrisma.user.create.mock.calls[0][0].data.password;
      expect(storedPassword).not.toBe('plaintext');
      expect(storedPassword).toMatch(/^\$2[aby]\$/);
    });
  });

  // ── findById ─────────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('returns null when user is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      expect(await service.findById('missing')).toBeNull();
    });

    it('strips sensitive fields and replaces them with boolean flags', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: 'a@b.com', name: 'Ada', companyName: 'Acme',
        apiKey: 'hashed-key', monoApiKey: 'mk', webhookSecret: 'ws', webhookUrl: 'https://x.com',
      });

      const result = await service.findById('u1');

      expect(result).not.toHaveProperty('apiKey');
      expect(result).not.toHaveProperty('monoApiKey');
      expect(result).not.toHaveProperty('webhookSecret');
      expect(result!.hasApiKey).toBe(true);
      expect(result!.hasMonoApiKey).toBe(true);
      expect(result!.hasWebhookSecret).toBe(true);
    });

    it('sets boolean flags to false when the corresponding fields are null', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: 'a@b.com', name: 'Ada', companyName: 'Acme',
        apiKey: null, monoApiKey: null, webhookSecret: null, webhookUrl: null,
      });

      const result = await service.findById('u1');

      expect(result!.hasApiKey).toBe(false);
      expect(result!.hasMonoApiKey).toBe(false);
      expect(result!.hasWebhookSecret).toBe(false);
    });
  });

  // ── generateAndStoreApiKey ───────────────────────────────────────────────────

  describe('generateAndStoreApiKey', () => {
    it('returns a plaintext key prefixed with mp_live_ for the caller to display', async () => {
      mockPrisma.user.update.mockResolvedValue({});

      const { apiKey } = await service.generateAndStoreApiKey('u1');

      expect(apiKey).toMatch(/^mp_live_/);
    });

    it('stores a hash — not the plaintext key', async () => {
      mockPrisma.user.update.mockResolvedValue({});

      const { apiKey } = await service.generateAndStoreApiKey('u1');
      const storedHash = mockPrisma.user.update.mock.calls[0][0].data.apiKey;

      expect(storedHash).not.toBe(apiKey);
      expect(storedHash).toHaveLength(64);
    });
  });
});
