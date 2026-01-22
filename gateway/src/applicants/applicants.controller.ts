import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApplicantsService } from './applicants.service';
import { CreateApplicantDto } from './dto/create-applicant.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('applicants')
@UseGuards(JwtAuthGuard)
export class ApplicantsController {
  constructor(private readonly applicantsService: ApplicantsService) {}

  @Post('create')
  async create(@Request() req, @Body() body: CreateApplicantDto) {
    return this.applicantsService.createApplicant(req.user.id, body);
  }

  @Get(':id')
  async getOne(@Request() req, @Param('id') id: string) {
    return this.applicantsService.findOne(id, req.user.id);
  }

  @Get('all')
  async getAll(@Request() req, @Param('id') fintechId: string ) {
    return this.applicantsService.findAll(identity, req.user.id)
  }
}