import { IsInt, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class UpsertRiskPolicyDto {
  @IsOptional() @IsInt() @Min(350) @Max(849) scoreRejectFloor?: number;
  @IsOptional() @IsInt() @Min(351) @Max(849) scoreManualFloor?: number;
  @IsOptional() @IsInt() @Min(352) @Max(850) scoreApproveFloor?: number;
  @IsOptional() @IsInt() @Min(0)  @Max(100)  manualReviewBuffer?: number;
  @IsOptional() @IsNumber() @Min(0)          highValueThreshold?: number;

  @IsOptional() @IsNumber() @Min(0.10) @Max(0.80) affordabilityCap?: number;
  @IsOptional() @IsNumber() @Min(0.10) @Max(1.00) minViableOfferRatio?: number;

  @IsOptional() @IsInt() @Min(1) @Max(10) thinFileIncomeMultiple?: number;
  @IsOptional() @IsInt() @Min(1) @Max(24) thinFileMaxTenor?: number;

  @IsOptional() @IsNumber() @Min(0) minimumMonthlyIncome?: number;
  @IsOptional() @IsInt()   @Min(1)  incomeStalenessdays?: number;
  @IsOptional() @IsInt()   @Min(1)  minAccountAgeMonths?: number;
  @IsOptional() @IsInt()   @Min(0)  maxOverdrafts?: number;
  @IsOptional() @IsInt()   @Min(0)  maxBouncedPayments?: number;
  @IsOptional() @IsInt()   @Min(1)  maxConsecutiveFailures?: number;
}
