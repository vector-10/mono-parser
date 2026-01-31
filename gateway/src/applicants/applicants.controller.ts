import { Controller, Post, Body, Get, Param, UseGuards, Request, Patch, Delete } from '@nestjs/common';
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
  
  @Get('all')
  async getAll(@Request() req ) {
    return this.applicantsService.findAll(req.user.id)
  }

  @Get(':id')
  async getOne(@Request() req, @Param('id') id: string) {
    return this.applicantsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  async update(
    @Request() req, 
    @Param('id') id: string, 
    @Body() body: Partial<CreateApplicantDto>
  ) {
    return this.applicantsService.updateApplicant(id, req.user.id, body);
  }

  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    await this.applicantsService.deleteApplicant(id, req.user.id);
    return { message: 'Applicant deleted successfully' };
  }

}