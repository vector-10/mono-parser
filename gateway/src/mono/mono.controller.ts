import {
  Controller,
  Request,
  Post,
  Get,
  Query,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { MonoService } from './mono.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { MonoApiKeyGuard } from 'src/auth/guards/mono-api-key.guard';

@Controller('mono')
@UseGuards(JwtAuthGuard, MonoApiKeyGuard)
export class MonoController {
  constructor(
    private readonly monoService: MonoService,
    private readonly prisma: PrismaService,
  ) {}

  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @Post('initiate/:applicantId')
  async initiate(@Request() req, @Param('applicantId') applicantId: string) {
    const applicant = await this.prisma.applicant.findFirst({
      where: {
        id: applicantId,
        fintechId: req.user.id,
      },
    });

    if (!applicant) {
      throw new BadRequestException('Applicant not found or unauthorized.');
    }

    return this.monoService.initiateAccountLinking(
      applicant.id,
      `${applicant.firstName} ${applicant.lastName}`,
      applicant.email,
      req.monoApiKey,
    );
  }

  @SkipThrottle()
  @Public()
  @Get('auth/callback')
  async handleMonoCallback(
    @Query('status') status: string,
    @Query('code') code: string,
  ) {
    if (status === 'linked') {
      return `
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #0052cc;"> Success!</h1>
        <p>Your bank account has been successfully linked for Mono Parser.</p>
        <p>You can close this window and return to the app.</p>
      </div>
    `;
    }

    return { message: 'Link process incomplete', status };
  }

  @Get('account/:accountId')
  async getDetails(@Request() req, @Param('accountId') accountId: string) {
    return this.monoService.getAccountDetails(accountId, req.monoApiKey);
  }

  @Get('account/:accountId/balance')
  async getBalance(@Request() req, @Param('accountId') accountId: string) {
    return this.monoService.getAccountBalance(accountId, req.monoApiKey);
  }

  @Get('account/:accountId/income')
  async getIncome(@Request() req, @Param('accountId') accountId: string) {
    return this.monoService.getIncome(accountId, req.monoApiKey);
  }

  @Get('account/:accountId/transactions')
  async getTransactions(@Request() req, @Param('accountId') accountId: string) {
    return this.monoService.getTransactions(accountId, req.monoApiKey);
  }

  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @Post('account/:accountId/creditworthiness')
  async checkCredit(
    @Request() req,
    @Param('accountId') accountId: string,
    @Body() loanData: any,
  ) {
    return this.monoService.getCreditWorthiness(
      accountId,
      req.monoApiKey,
      loanData,
    );
  }

  @Get('account/:accountId/identity')
  async getIdentity(@Request() req, @Param('accountId') accountId: string) {
    return this.monoService.getIdentity(accountId, req.monoApiKey);
  }

  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @Post('lookup/credit-history')
  async getHistory(@Request() req, @Body('bvn') bvn: string) {
    return this.monoService.getCreditHistory(bvn, req.monoApiKey);
  }

  @Get('accounts')
  async getAllAccounts(@Request() req, @Query('page') page?: string) {
    return this.monoService.getAllAccounts(
      req.monoApiKey,
      page ? parseInt(page) : 1,
    );
  }

  @Post('account/:accountId/unlink')
  async unlink(@Request() req, @Param('accountId') accountId: string) {
    return this.monoService.unlinkAccount(accountId, req.monoApiKey);
  }
}
