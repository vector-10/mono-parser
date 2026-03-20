import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RiskPolicyService } from './risk-policy.service';
import { RiskPolicyController } from './risk-policy.controller';

@Module({
  imports: [PrismaModule],
  controllers: [RiskPolicyController],
  providers: [RiskPolicyService],
  exports: [RiskPolicyService],
})
export class RiskPolicyModule {}
