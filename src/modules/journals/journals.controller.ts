import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JournalsService } from './journals.service';

@ApiTags('Journals')
@Controller('journals')
export class JournalsController {
  constructor(private readonly journalsService: JournalsService) {}

  @Get('journals')
  async getJournals() {
    return await this.journalsService.scrappingJournals();
  }
}
