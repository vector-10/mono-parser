import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { PrismaService } from 'src/prisma/prisma.service';

const mockPrisma = { user: { findUnique: jest.fn() } };

function makeContext(headers: Record<string, string>): ExecutionContext {
  const req: any = { headers };
  return { switchToHttp: () => ({ getRequest: () => req }) } as unknown as ExecutionContext;
}

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    guard = module.get<ApiKeyGuard>(ApiKeyGuard);
  });

  it('throws when the x-api-key header is absent', async () => {
    await expect(guard.canActivate(makeContext({}))).rejects.toThrow(UnauthorizedException);
  });

  it('throws when the API key hash is not found in the database', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(guard.canActivate(makeContext({ 'x-api-key': 'bad-key' }))).rejects.toThrow(UnauthorizedException);
  });

  it('throws when the user has no Mono API key configured', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', monoApiKey: null });
    await expect(guard.canActivate(makeContext({ 'x-api-key': 'key' }))).rejects.toThrow(UnauthorizedException);
  });

  it('attaches user and monoApiKey to the request and returns true on a valid key', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', monoApiKey: 'mk-secret' });
    const req: any = { headers: { 'x-api-key': 'valid-key' } };
    const ctx = { switchToHttp: () => ({ getRequest: () => req }) } as unknown as ExecutionContext;

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(req.user).toEqual({ id: 'u1' });
    expect(req.monoApiKey).toBe('mk-secret');
  });
});
