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
import { MonoService } from './mono.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('mono')
@UseGuards(JwtAuthGuard)
export class MonoController {
  constructor(private readonly monoService: MonoService) {}

  @Post('initiate')
  async initiate(@Request() req) {
    if (!req.user.monoApiKey) {
      throw new BadRequestException('Mono API key not configured.');
    }

    return this.monoService.initiateAccountLinking(
      req.user.id,
      req.user.name,
      req.user.email,
      req.user.monoApiKey,
    );
  }

  @Get('auth/callback')
  async handleMonoCallback(
    @Query('status') status: string,
    @Query('code') code: string,
  ) {
    if (status === 'linked') {
      // This is a simple HTML response to show the user it worked
      return `
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #0052cc;">✅ Success!</h1>
        <p>Your bank account has been successfully linked.</p>
        <p>You can close this window and return to the app.</p>
      </div>
    `;
    }

    return { message: 'Link process incomplete', status };
  }

  @Get('account/:accountId')
  async getDetails(@Request() req, @Param('accountId') accountId: string) {
    return this.monoService.getAccountDetails(accountId, req.user.monoApiKey);
  }

  @Get('account/:accountId/balance')
  async getBalance(@Request() req, @Param('accountId') accountId: string) {
    return this.monoService.getAccountBalance(accountId, req.user.monoApiKey);
  }

  @Get('account/:accountId/income')
  async getIncome(@Request() req, @Param('accountId') accountId: string) {
    return this.monoService.getIncome(accountId, req.user.monoApiKey);
  }

  @Get('account/:accountId/insights')
  async getInsights(@Request() req, @Param('accountId') accountId: string) {
    return this.monoService.getStatementInsights(
      accountId,
      req.user.monoApiKey,
    );
  }

  @Get('account/:accountId/transactions')
  async getTransactions(@Request() req, @Param('accountId') accountId: string) {
    return this.monoService.getTransactions(accountId, req.user.monoApiKey);
  }

  @Post('account/:accountId/creditworthiness')
  async checkCredit(
    @Request() req,
    @Param('accountId') accountId: string,
    @Body() loanData: any,
  ) {
    return this.monoService.getCreditWorthiness(
      accountId,
      req.user.monoApiKey,
      loanData,
    );
  }

  @Post('lookup/credit-history')
  async getHistory(@Request() req, @Body('bvn') bvn: string) {
    return this.monoService.getCreditHistory(bvn, req.user.monoApiKey);
  }

  @Post('account/:accountId/unlink')
  async unlink(@Request() req, @Param('accountId') accountId: string) {
    return this.monoService.unlinkAccount(accountId, req.user.monoApiKey);
  }
}
