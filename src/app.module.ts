import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { envValidationSchema } from './config/env-validation.schema';
import { AffiliationAuthorsModule } from './modules/affiliation-authors/affiliation-authors.module';
import { AffiliationsModule } from './modules/affiliations/affiliations.module';
import { AuthorsModule } from './modules/authors/authors.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: envValidationSchema,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI_ATLAS'),
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    AffiliationsModule,
    AuthorsModule,
    AffiliationAuthorsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
