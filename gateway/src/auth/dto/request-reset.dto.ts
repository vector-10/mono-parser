import { IsEmail } from 'class-validator';

export class RequestResetDto {
  @IsEmail()
  email: string;
}
