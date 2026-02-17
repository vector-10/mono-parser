import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateApplicantDto {
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

  @IsString()
  @MinLength(10)
  @MaxLength(15)
  phone?: string;

  @IsString()
  @MinLength(11)
  @MaxLength(11)
  bvn?: string;
}