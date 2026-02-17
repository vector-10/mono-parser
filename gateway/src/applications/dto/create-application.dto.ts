import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateApplicationDto {
  @IsString()
  applicantId: string;

  @IsNumber()
  amount: number;

  @IsNumber()
  tenor: number;

  @IsNumber()
  interestRate: number;

  @IsOptional()
  @IsString()
  purpose?: string;
}
