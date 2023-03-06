import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaService } from 'src/prisma/prisma.service';
import JournalsDto from './dto/journals.dto';

@Injectable()
export class JournalsService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger(JournalsService.name);
  private pageInit: number = 1;
  private currentPage = this.pageInit;

  async scrappingJournals() {
    try {
      return await this.cheerioJournals();
    } catch (error) {
      this.logger.error(error);
      await this.cheerioJournals();
      throw new Error("Can't scrap journals");
    }
  }

  private async cheerioGetTotalPageNumber() {
    const page = await axios.get(`https://sinta.kemdikbud.go.id/journals`, {
      timeout: 60000,
    });
    const $ = cheerio.load(page.data);

    const totalPaginationNumber = $('.text-center.pagination-text')
      .text()
      .trim()
      .split(' ')[3];
    return parseInt(totalPaginationNumber);
  }

  async cheerioJournals() {
    const totalPageNumber = await this.cheerioGetTotalPageNumber();

    // for (let page = this.pageInit; page <= totalPageNumber; page++) {
    //   try {
    //     console.log(`Page ${page} of ${totalPageNumber} is being scrapped`);
    //     await this.cheerioGetJournals(page);
    //   } catch (error) {
    //     console.log(
    //       `Retrying page ${page} of ${totalPageNumber} is being scrapped`,
    //     );
    //     await this.cheerioGetJournals(page);
    //   }
    // }
    while (true) {
      try {
        console.log(
          `Page ${this.currentPage} of ${totalPageNumber} is being scrapped`,
        );
        await this.cheerioGetJournals(this.currentPage);
      } catch (error) {
        console.log(
          `---------- FAILED TO SCRAP PAGE ${this.currentPage} ----------`,
        );
      }

      this.currentPage++;
      if (this.currentPage === totalPageNumber) break;
    }
    return 'success';
  }

  async cheerioGetJournals(pageNumber: number) {
    const page = await axios.get(
      `https://sinta.kemdikbud.go.id/journals?page=${pageNumber}`,
      {
        timeout: 60000,
      },
    );
    const $ = cheerio.load(page.data);

    const cardsJournalWrapper = $('.content-list-no-filter');

    const cardsJournal = $('.list-item', cardsJournalWrapper);

    const batchJournals: Prisma.JournalsCreateInput[] = [];

    cardsJournal.map(async (i, el) => {
      const journals: JournalsDto = {
        numericId: null,
        title: null,
        titleUrl: null,
        imgUrl: null,
        label: [],
        affiliation: {
          name: null,
          url: null,
        },
        pISSN: null,
        eISSN: null,
        impact: null,
        h5Index: null,
        citations5Year: null,
        citations: null,
      };

      journals.numericId = parseInt(
        $(el).find('div.affil-name > a').attr('href').trim().split('/').pop(),
        10,
      );

      journals.title = $(el).find('div.affil-name > a').text().trim();
      journals.titleUrl = $(el).find('div.affil-name > a').attr('href');
      journals.imgUrl = $(el)
        .find('img.img-thumbnail.journal-cover')
        .attr('src');

      $('div.affil-abbrev', el)
        .find('a')
        .map((i, el) => {
          let journalLabel: Prisma.JournalDetailCreateInput = {
            name: null,
            url: null,
          };
          journalLabel.name = $(el).text().trim();
          journalLabel.url = $(el).attr('href');
          journals.label.push(journalLabel);
        });

      journals.affiliation.name = $(el).find('div.affil-loc > a').text().trim();
      journals.affiliation.url = $(el).find('div.affil-loc > a').attr('href');

      $('div.stat-profile.journal-list-stat div.pr-num', el).map((i, el) => {
        if (i % 4 === 0) journals.impact = $(el).text().trim();
        else if (i % 4 === 1) journals.h5Index = $(el).text().trim();
        else if (i % 4 === 2) journals.citations5Year = $(el).text().trim();
        else if (i % 4 === 3) journals.citations = $(el).text().trim();
      });

      journals.pISSN = $(el).find('div.profile-id').text().trim().split(' ')[2];
      journals.eISSN = $(el).find('div.profile-id').text().trim().split(' ')[6];

      await this.prisma.journals.upsert({
        where: { numericId: journals.numericId },
        update: journals,
        create: journals,
      });
      // batchJournals.push(journals);
      // await this.prisma.journals.create({
      //   data: journals,
      // });
    });

    // await this.prisma.journals.createMany({ data: batchJournals });

    return;
  }
}
