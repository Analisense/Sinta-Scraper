import { Module } from '@nestjs/common';
import { AffiliationsController } from './affiliations.controller';
import { AffiliationsService } from './affiliations.service';

@Module({
  controllers: [AffiliationsController],
  providers: [AffiliationsService],
})
export class AffiliationsModule {}
