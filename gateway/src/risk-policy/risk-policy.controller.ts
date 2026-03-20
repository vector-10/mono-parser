import { Controller, Get, Put, Body, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RiskPolicyService } from './risk-policy.service';
import { UpsertRiskPolicyDto } from './dto/upsert-risk-policy.dto';

@Controller('risk-policy')
@UseGuards(JwtAuthGuard)
export class RiskPolicyController {
  constructor(private readonly riskPolicyService: RiskPolicyService) {}

  @Get()
  async get(@Request() req) {
    return this.riskPolicyService.findByFintechId(req.user.id);
  }

  @Put()
  async upsert(@Request() req, @Body() dto: UpsertRiskPolicyDto) {
    return this.riskPolicyService.upsert(req.user.id, dto);
  }
}
