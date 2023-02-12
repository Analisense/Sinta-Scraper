import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AffiliationsService } from './affiliations.service';

@Controller('affiliations')
export class AffiliationsController {
  constructor(private readonly affiliationsService: AffiliationsService) {}

  @ApiTags('Affiliations')
  @Get('scrapingAllAffiliations')
  scrapingAffiliations() {
    return this.affiliationsService.scrapingAffiliations();
  }

  @Get('getAffiliations')
  getAffiliations() {
    return this.affiliationsService.getAffiliations();
  }
}
