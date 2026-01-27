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
import { DataAggregationService } from './data-aggregation.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly applicationProcessor: ApplicationProcessorService,
    private readonly dataAggregationService: DataAggregationService,
  ) {}

  @Post()
  async create(
    @Request() req,
    @Body('applicantId') applicantId: string,
    @Body('amount') amount: number,
    @Body('tenor') tenor: number,
    @Body('interestRate') interestRate: number,
    @Body('purpose') purpose?: string,
  ) {
    const application = await this.applicationsService.createApplication(
      req.user.id,
      applicantId,
      amount,
      interestRate,
      purpose,
      tenor,
    );

    return {
      applicationId: application.id,
      status: 'PENDING',
      message: 'Application submitted. Processing in background.',
    };
  }

  @Post(':id/start-analysis')
  async startAnalysis(@Request() req, @Param('id') id: string, @Body('clientId') clientId?: string) {
    const application = await this.applicationsService.findOne(id, req.user.id);

    if(!application) {
      throw new Error('Application not found');
    }

    if(application.status !== 'PENDING') {
      throw new Error('Application already processed');
    }

    this.applicationProcessor.processApplication(id, clientId).catch((error) => {
      console.error('Processing failed:', error)
    })

    return{
      applicationId: id,
      status: 'PROCESSING',
      message: 'Analysis started. You will receive updates via WebSocket',
    }

  }

  @Get()
  async findAll(@Request() req, @Query('status') status?: string) {
    return this.applicationsService.findAll(req.user.id, status);
  }

  @Get('test-aggregation/:accountId')
  async testAggregation(@Request() req, @Param('accountId') accountId: string) {
    return this.dataAggregationService.gatherApplicantData(
      accountId,
      req.user.monoApiKey,
    );
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.applicationsService.findOne(id, req.user.id);
  }
}
