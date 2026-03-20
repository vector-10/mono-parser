import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpsertRiskPolicyDto } from './dto/upsert-risk-policy.dto';

const DEFAULTS = {
  scoreRejectFloor:      500,
  scoreManualFloor:      600,
  scoreApproveFloor:     700,
  manualReviewBuffer:    20,
  highValueThreshold:    500000,
  affordabilityCap:      0.35,
  minViableOfferRatio:   0.30,
  thinFileIncomeMultiple: 2,
  thinFileMaxTenor:      6,
  minimumMonthlyIncome:  30000,
  incomeStalenessdays:   90,
  minAccountAgeMonths:   3,
  maxOverdrafts:         10,
  maxBouncedPayments:    3,
  maxConsecutiveFailures: 3,
};

@Injectable()
export class RiskPolicyService {
  constructor(private readonly prisma: PrismaService) {}

  async findByFintechId(fintechId: string) {
    const policy = await this.prisma.riskPolicy.findUnique({
      where: { fintechId },
    });
    return policy ?? { ...DEFAULTS, fintechId, id: null, createdAt: null, updatedAt: null };
  }

  async upsert(fintechId: string, dto: UpsertRiskPolicyDto) {
    return this.prisma.riskPolicy.upsert({
      where:  { fintechId },
      update: dto,
      create: { fintechId, ...dto },
    });
  }

  async toSnakeCasePayload(fintechId: string) {
    const p = await this.findByFintechId(fintechId);
    return {
      score_reject_floor:       p.scoreRejectFloor,
      score_manual_floor:       p.scoreManualFloor,
      score_approve_floor:      p.scoreApproveFloor,
      manual_review_buffer:     p.manualReviewBuffer,
      high_value_threshold:     p.highValueThreshold,
      affordability_cap:        p.affordabilityCap,
      min_viable_offer_ratio:   p.minViableOfferRatio,
      thin_file_income_multiple: p.thinFileIncomeMultiple,
      thin_file_max_tenor:      p.thinFileMaxTenor,
      minimum_monthly_income:   p.minimumMonthlyIncome,
      income_staleness_days:    p.incomeStalenessdays,
      min_account_age_months:   p.minAccountAgeMonths,
      max_overdrafts:           p.maxOverdrafts,
      max_bounced_payments:     p.maxBouncedPayments,
      max_consecutive_failures: p.maxConsecutiveFailures,
    };
  }
}
