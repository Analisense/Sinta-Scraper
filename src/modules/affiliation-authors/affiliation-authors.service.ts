import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Prisma } from '@prisma/client';
import axios from 'axios';
import * as cheerio from 'cheerio';
import mongoose from 'mongoose';
import HelperClass from 'src/common/helper/helper-class';
import { PrismaService } from 'src/prisma/prisma.service';
import { AffiliationAuthors } from './schema/affiliation-authors.schema';

@Injectable()
export class AffiliationAuthorsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectModel(AffiliationAuthors.name)
    private readonly affiliationAuthorsModel: mongoose.Model<AffiliationAuthors>,
  ) {}
  private readonly logger = new Logger(AffiliationAuthorsService.name);
  private totalInsertedData = 1;
  async getAffiliationAuthors(indexInit: number) {
    try {
      const listAffiliationsId = await this.prisma.affiliation.findMany({
        select: { numericId: true },
        orderBy: { numericId: 'asc' },
      });
      const outputArray = listAffiliationsId.map((item) => item.numericId);

      for (let index = indexInit; index < outputArray.length; index++) {
        await this.cheerioGetAffiliationAuthors(outputArray[index], index);
        await HelperClass.sleepNow(10000);
      }
      return 'Success';
    } catch (error) {
      this.logger.error(error);
      throw new Error('Error in getAffiliationAuthors');
    }
  }

  async cheerioGetAffiliationAuthors(affiliationId, index) {
    let numberPage = 1;
    const totalPage = await this.getTotalPage(affiliationId);
    console.log(`\n------------SCRAPING INDEX ${index}------------`);
    while (true) {
      try {
        await this.scrapingAffiliationAuthors(
          affiliationId,
          numberPage,
          totalPage,
        );
      } catch (error) {
        this.logger.error(error);
        console.log(`### RETRYING FETCH DATA INDEX ${index} ###`);
      }
      // await HelperClass.sleepNow(10000);
      numberPage++;
      if (numberPage === totalPage) break;
    }

    return;
    // try {
    //   console.log(`\n------------SCRAPING INDEX ${index}------------`);

    //   const totalPage = await this.getTotalPage(affiliationId);

    //   // const promises = [];
    //   // for (let numberPage = 1; numberPage <= totalPage; numberPage++) {
    //   //   promises.push(
    //   //     this.scrapingAffiliationAuthors(affiliationId, numberPage, totalPage),
    //   //   );
    //   //   await HelperClass.sleepNow(200);
    //   //   if (numberPage % 10 === 0) await HelperClass.sleepNow(10000);
    //   // }
    //   // return await Promise.all(promises);

    //   for (let numberPage = 1; numberPage <= totalPage; numberPage++) {
    //     await this.scrapingAffiliationAuthors(
    //       affiliationId,
    //       numberPage,
    //       totalPage,
    //     );
    //   }
    // } catch (error) {
    //   this.logger.error(error);
    //   // console.log(`TRYING FETCH DATA INDEX ${index}`);
    //   // this.getAffiliationAuthors(index);
    //   throw new Error('Error in cheerioGetAffiliationAuthors');
    // }
  }

  private async getTotalPage(affiliationId: any) {
    const page = await axios.get(
      `https://sinta.kemdikbud.go.id/affiliations/authors/${affiliationId}}`,
      { timeout: 60000 },
    );

    const $ = cheerio.load(page.data);

    // * GET TOTAL PAGE NUMBER
    const totalPage = $('nav > div.pagination-text > small')
      .text()
      .trim()
      .replace('.', '')
      .split(' ')[3];
    return parseInt(totalPage);
  }

  private async scrapingAffiliationAuthors(
    affiliationId: any,
    numberPage: number,
    totalPage: number,
  ) {
    console.log(
      `${this
        .totalInsertedData++}. Scraping page ${numberPage} of ${totalPage} with affiliationId : ${affiliationId}`,
    );

    const page = await axios.get(
      `https://sinta.kemdikbud.go.id/affiliations/authors/${affiliationId}}?page=${numberPage}`,
    );
    const $ = cheerio.load(page.data);

    // * GET UNIVERSITY BANNER CONTENT
    const universityBannerContent = $(
      'div.content > div.content-box > div.univ-profile',
    );
    const universityBannerData = universityBannerContent.map((i, el) => ({
      imgUrl: $(el).find('img.univ-logo-main').attr('src'),
      name: $(el).find('div.univ-name > h3').text().trim(),
      abbrevName: $(el)
        .find('div.univ-name > div.meta-profile > span.affil-abbrev')
        .text()
        .trim(),
      location: $(el).find('div.meta-profile > a.affil-loc').text().trim(),
      numericIdAffiliation: parseInt(
        $(el)
          .find('div.meta-profile > a.affil-code')
          .text()
          .trim()
          .split(' ')[2],
      ),
      pddiktiCode: $(el)
        .find('div.meta-profile > a.affil-code')
        .text()
        .split(':')
        .pop()
        .trim(),
    }))[0];

    // * GET CARD CONTENT
    const cardContent = $(
      'div.content > div.content-box > div.au-list-affil > div.au-item',
    );

    // const affiliationAuthorsData: Prisma.AffiliationAuthorsCreateInput[] = [];
    //
    const result = cardContent.map(async (i, el) => {
      const affiliationTemp = {
        sintaId: null,
        name: null,
        profileUrl: null,
        profileImgUrl: null,
        prodiName: null,
        prodiUrl: null,
        scopusHIndex: null,
        university: null,
        googleScholarHIndex: null,
        sintaScore3Yr: null,
        sintaScore: null,
        affilScore3Yr: null,
        affilScore: null,
      };

      affiliationTemp.sintaId = $(el)
        .find('div.profile-id')
        .text()
        .split(':')
        .pop()
        .trim();

      affiliationTemp.name = $(el).find('div.profile-name > a').text();

      affiliationTemp.profileUrl = $(el)
        .find('div.profile-name > a')
        .attr('href');

      affiliationTemp.profileImgUrl = $(el)
        .find('img.img-thumbnail')
        .attr('src');

      affiliationTemp.university = universityBannerData;

      affiliationTemp.prodiName = $(el)
        .find('div.profile-dept > a')
        .text()
        .trim();

      affiliationTemp.prodiUrl = $(el)
        .find('div.profile-dept > a')
        .attr('href');

      affiliationTemp.scopusHIndex = $(el)
        .find('div.profile-hindex > span.profile-id.text-warning')
        .text()
        .split(':')
        .pop()
        .trim();

      affiliationTemp.googleScholarHIndex = $(el)
        .find('div.profile-hindex > span.profile-id.text-success')
        .text()
        .split(':')
        .pop()
        .trim();

      $(el)
        .find('div.col-lg > div.row > div.col > div.stat-num')
        .map((i, el) => {
          if (i % 4 === 0)
            affiliationTemp.sintaScore3Yr = $(el).text().replace('.', '');
          if (i % 4 === 1)
            affiliationTemp.sintaScore = $(el).text().replace('.', '');
          if (i % 4 === 2)
            affiliationTemp.affilScore3Yr = $(el).text().replace('.', '');
          if (i % 4 === 3)
            affiliationTemp.affilScore = $(el).text().replace('.', '');
        });

      const insertData: Prisma.AffiliationAuthorsCreateInput = affiliationTemp;

      // await this.prisma.affiliationAuthors.create({ data: insertData });

      return await this.prisma.affiliationAuthors.upsert({
        where: { sintaId: insertData.sintaId },
        update: insertData,
        create: insertData,
      });

      // affiliationAuthorsData.push(affiliationTemp);

      // await this.affiliationAuthorsModel.findOneAndUpdate(
      //   { sintaId: affiliationTemp.sintaId },
      //   affiliationTemp,
      //   { upsert: true },
      // );

      // await this.affiliationAuthorsModel.create(affiliationTemp);
    });

    // await this.prisma.affiliationAuthors.createMany({
    //   data: affiliationAuthorsData,
    // });

    return result;
  }
}
