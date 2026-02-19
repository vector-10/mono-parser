import {
  IsString,
  IsNumber,
  IsOptional,
  IsEmail,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';

export class InitiateApplicationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(15)
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(11)
  @MaxLength(11)
  bvn?: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsNumber()
  @Min(1)
  tenor: number;

  @IsNumber()
  @Min(0)
  interestRate: number;

  @IsOptional()
  @IsString()
  purpose?: string;
}
