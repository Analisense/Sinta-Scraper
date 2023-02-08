import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { envValidationSchema } from './config/env-validation.schema';
import { AffiliationsModule } from './modules/affiliations/affiliations.module';
import { AuthorsModule } from './modules/authors/authors.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: envValidationSchema,
    }),
    PrismaModule,
    AffiliationsModule,
    AuthorsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
