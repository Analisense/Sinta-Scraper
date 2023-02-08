import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthorsService } from './authors.service';

@Controller('authors')
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @ApiTags('Authors')
  @Get('authors')
  scrapingAuthors() {
    return this.authorsService.scrapingAuthors();
  }
}
