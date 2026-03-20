import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ApplicationsService } from './applications.service';
import { AIService } from 'src/ai/ai.service';
import { CreateApplicationDto } from 'src/applications/dto/create-application.dto';
import { InitiateApplicationDto } from 'src/applications/dto/initiate-application.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiKeyGuard } from 'src/auth/guards/api-key.guard';

@Controller('applications')
export class ApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly aiService: AIService,
    @InjectQueue('applications') private readonly applicationsQueue: Queue,
  ) {}



  @Post('initiate')
  @UseGuards(ApiKeyGuard)
  async initiateApplication(@Request() req, @Body() body: InitiateApplicationDto) {
    return this.applicationsService.initiateApplication(req.user.id, body);
  }

  @Post(':id/link-account')
  @UseGuards(ApiKeyGuard)
  async linkAccount(@Request() req, @Param('id') id: string) {
    return this.applicationsService.linkAccount(id, req.user.id);
  }

  @Post(':id/finalize-linking')
  @UseGuards(ApiKeyGuard)
  async finalizeAccountLinking(@Request() req, @Param('id') id: string) {
    return this.applicationsService.finalizeAccountLinking(id, req.user.id);
  }

  @Post(':id/analyze')
  @UseGuards(ApiKeyGuard)
  async analyze(@Request() req, @Param('id') id: string) {
    const application = await this.applicationsService.findOne(id, req.user.id);

    if (!application.applicant.bankAccounts.length) {
      throw new Error('No bank accounts linked to this application');
    }

    await this.applicationsQueue.add('process-application', { applicationId: id });

    return { applicationId: id, status: 'PROCESSING', message: 'Analysis queued.' };
  }


  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req, @Body() body: CreateApplicationDto) {
    const application = await this.applicationsService.createApplication(
      req.user.id,
      body,
    );

    return {
      applicationId: application.id,
      status: 'PENDING',
      message: 'Application submitted. Processing in background.',
    };
  }

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Get(':id/explain')
  @UseGuards(JwtAuthGuard)
  async explainApplication(@Request() req, @Param('id') id: string) {
    const application = await this.applicationsService.findOne(id, req.user.id);

    if (application.status !== 'COMPLETED') {
      throw new Error('Application analysis not complete yet');
    }

    const explanation = await this.aiService.explainLoanDecision({
      score: application.score,
      decision: application.decision,
    });

    return { explanation };
  }

  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @Post(':id/chat')
  @UseGuards(JwtAuthGuard)
  async reviewChat(
    @Request() req,
    @Param('id') id: string,
    @Body('message') message: string,
    @Body('history') history: { role: 'user' | 'assistant'; content: string }[] = [],
  ) {
    if (!message?.trim()) {
      throw new Error('Message is required');
    }

    const application = await this.applicationsService.findOne(id, req.user.id);

    const reply = await this.aiService.reviewChat(application, message, history);

    return { reply };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Request() req, @Query('status') status?: string) {
    return this.applicationsService.findAll(req.user.id, status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Request() req, @Param('id') id: string) {
    return this.applicationsService.findOne(id, req.user.id);
  }
}
