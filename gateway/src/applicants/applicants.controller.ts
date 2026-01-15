import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApplicantsService } from './applicants.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('applicants')
@UseGuards(JwtAuthGuard)
export class ApplicantsController {
  constructor(private readonly applicantsService: ApplicantsService) {}

  @Post()
  async create(@Request() req, @Body() body: any) {
    return this.applicantsService.createApplicant(req.user.id, body);
  }

  @Get(':id')
  async getOne(@Request() req, @Param('id') id: string) {
    return this.applicantsService.findOne(id, req.user.id);
  }
}