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
import { ApplicationsService } from './applications.service';
import { ApplicationProcessorService } from './applications-processor.service';
import { GeminiService } from 'src/gemini/gemini.service';
import { CreateApplicationDto } from 'src/applications/dto/create-application.dto';
import { DataAggregationService } from './data-aggregation.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly applicationProcessor: ApplicationProcessorService,
    private readonly dataAggregationService: DataAggregationService,
    private readonly geminiService: GeminiService,
  ) {}

  @Post()
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

  @Post(':id/start-analysis')
  async startAnalysis(
    @Request() req,
    @Param('id') id: string,
    @Body('clientId') clientId?: string,
  ) {
    const application = await this.applicationsService.findOne(id, req.user.id);

    if (!application) {
      throw new Error('Application not found');
    }

    if (application.status !== 'PENDING') {
      throw new Error('Application already processed');
    }

    this.applicationProcessor
      .processApplication(id, clientId)
      .catch((error) => {
        console.error('Processing failed:', error);
      });

    return {
      applicationId: id,
      status: 'PROCESSING',
      message: 'Analysis started. You will receive updates via WebSocket',
    };
  }

  @Get(':id/explain')
  async explainApplication(@Request() req, @Param('id') id: string) {
    const application = await this.applicationsService.findOne(id, req.user.id);

    if (application.status !== 'COMPLETED') {
      throw new Error('Application analysis not complete yet');
    }


    const explanation = await this.geminiService.explainLoanDecision({
      score: application.score,
      decision: application.decision,
    });

    return { explanation };
  }

  @Get()
  async findAll(@Request() req, @Query('status') status?: string) {
    return this.applicationsService.findAll(req.user.id, status);
  }

  @Get('test-aggregation/:applicantId')
  async testAggregation(
    @Request() req,
    @Param('applicantId') applicantId: string,
  ) {
    return this.dataAggregationService.testMultiAccountAggregation(
      applicantId,
      req.user.id,
    );
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.applicationsService.findOne(id, req.user.id);
  }
}
