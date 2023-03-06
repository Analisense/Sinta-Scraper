import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaService } from 'src/prisma/prisma.service';
import AffiliationsDto from './dto/affiliations.dto';

@Injectable()
export class AffiliationsService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger(AffiliationsService.name);
  async getAffiliations() {
    return await this.prisma.affiliation.findMany();
  }
  async scrapingAffiliations() {
    try {
      // await this.puppeteerAffiliations();

      await this.cheerioAffiliations();
      return 'success';
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async cheerioAffiliations() {
    const totalPaginationNumber = await this.cheerioTotalPaginationNumber();
    let pageNumber = 1;
    while (true) {
      try {
        await this.cheerioAllAffiliations(pageNumber);
        if (pageNumber === totalPaginationNumber) break;
        pageNumber++;
      } catch (error) {
        console.log(`### RETRYING PAGE NUMBER: ${pageNumber} ###`);
        // this.logger.error(error);
      }
    }
  }

  async cheerioTotalPaginationNumber() {
    const page = await axios.get('https://sinta.kemdikbud.go.id/affiliations');
    const $ = cheerio.load(page.data);
    const totalPaginationNumber = parseInt(
      $('div.text-center.pagination-text').text().trim().split(' ')[3],
    );

    return totalPaginationNumber;
  }

  async cheerioAllAffiliations(pageNumber: number) {
    console.log(`Scraping page number: ${pageNumber}`);

    const page = await axios.get(
      `https://sinta.kemdikbud.go.id/affiliations?page=${pageNumber}`,
    );

    const $ = cheerio.load(page.data);

    const cardAffiliations = $('div.content-list > div.list-item');

    cardAffiliations.map(async (i, el) => {
      const affiliation: AffiliationsDto = {
        numericId: null,
        codePT: null,
        name: null,
        nameAbbrev: null,
        imgUrl: null,
        origin: null,
        departmentUrl: null,
        totalDepartment: null,
        authorCount: null,
        sintaScore3Yr: null,
        sintaScoreOverall: null,
      };

      affiliation.numericId = parseInt(
        $(el).find('div.profile-id').text().trim().split(' ')[2],
      );

      affiliation.codePT = $(el)
        .find('div.profile-id')
        .text()
        .trim()
        .split(' ')[6];

      affiliation.name = $(el).find('div.affil-name').text().trim();

      affiliation.nameAbbrev = $(el).find('div.affil-abbrev').text().trim();

      affiliation.imgUrl = $(el)
        .find('div > .img-thumbnail.avatar-affil')
        .attr('src')
        .trim();

      affiliation.origin = $(el).find('div.affil-loc > a').text().trim();

      affiliation.totalDepartment = Number(
        $(el)
          .find('div.stat-prev > span.num-stat > a')
          .text()
          .trim()
          .split(' ')[0],
      );

      affiliation.departmentUrl = $(el)
        .find('div.stat-prev > span.num-stat > a')
        .attr('href');

      affiliation.authorCount = $(el)
        .find('div.stat-prev > span.num-stat.ml-3')
        .text()
        .trim()
        .split(' ')[0];

      $('div.list-item > div > div > div.col > div.pr-num', el).map((i, el) => {
        if (i % 2 === 0) {
          affiliation.sintaScore3Yr = $(el).text().trim();
        }
        if (i % 2 === 1) {
          affiliation.sintaScoreOverall = $(el).text().trim();
        }
      });

      await this.prisma.affiliation.upsert({
        where: { numericId: affiliation.numericId },
        create: affiliation,
        update: affiliation,
      });
    });
  }
}
