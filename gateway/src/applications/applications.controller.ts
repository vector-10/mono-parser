// import {
//   Controller,
//   Post,
//   Get,
//   Body,
//   Param,
//   Query,
//   Request,
//   UseGuards,
// } from '@nestjs/common';
// import { ApplicationsService } from './applications.service';
// import { DataAggregationService } from './data-aggregation.service';
// import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

// @Controller('applications')
// @UseGuards(JwtAuthGuard)
// export class ApplicationsController {
//   constructor(
//     private readonly applicationsService: ApplicationsService,
//     private readonly dataAggregationService: DataAggregationService,
//   ) {}

//   @Post()
//   async create(
//     @Request() req,
//     @Body('applicantId') applicantId: string,
//     @Body('amount') amount: number,
//     @Body('tenor') tenor: number,
//   ) {
//     return this.applicationsService.createApplication(
//       req.user.id,
//       applicantId,
//       amount,
//       tenor,
//     );
//   }

//   @Get()
//   async findAll(@Request() req, @Query('status') status?: string) {
//     return this.applicationsService.findAll(req.user.id, status);
//   }

//   @Get('test-aggregation/:accountId')
//   async testAggregation(@Request() req, @Param('accountId') accountId: string) {
//     return this.dataAggregationService.gatherApplicantData(
//       accountId,
//       req.user.monoApiKey,
//     );
//   }

//   @Get(':id')
//   async findOne(@Request() req, @Param('id') id: string) {
//     return this.applicationsService.findOne(id, req.user.id);
//   }

  
// }


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
  ) {
    // Create application (returns immediately)
    const application = await this.applicationsService.createApplication(
      req.user.id,
      applicantId,
      amount,
      tenor,
    );

    // Trigger background processing (fire and forget)
    this.applicationProcessor.processApplication(application.id)
      .catch(error => {
        console.error('Background job failed:', error);
      });

    // Return immediately to user
    return {
      applicationId: application.id,
      status: 'PROCESSING',
      message: 'Application submitted. Processing in background.',
    };
  }

  @Get()
  async findAll(@Request() req, @Query('status') status?: string) {
    return this.applicationsService.findAll(req.user.id, status);
  }

  @Get('test-aggregation/:accountId')
  async testAggregation(
    @Request() req,
    @Param('accountId') accountId: string,
  ) {
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