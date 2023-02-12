import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AffiliationAuthorsController } from './affiliation-authors.controller';
import { AffiliationAuthorsService } from './affiliation-authors.service';
import {
  AffiliationAuthors,
  AffiliationAuthorsSchema,
} from './schema/affiliation-authors.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AffiliationAuthors.name, schema: AffiliationAuthorsSchema },
    ]),
  ],
  controllers: [AffiliationAuthorsController],
  providers: [AffiliationAuthorsService],
})
export class AffiliationAuthorsModule {}
