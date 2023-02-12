import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AffiliationAuthorsService } from './affiliation-authors.service';

@ApiTags('affiliation-authors')
@Controller('affiliation-authors')
export class AffiliationAuthorsController {
  constructor(
    private readonly affiliationAuthorsService: AffiliationAuthorsService,
  ) {}

  @Get('getAffiliationAuthors')
  getAffiliationAuthors() {
    return this.affiliationAuthorsService.getAffiliationAuthors();
  }
}