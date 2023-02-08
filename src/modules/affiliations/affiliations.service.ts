import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import puppeteer, { Browser } from 'puppeteer';
import HelperClass from 'src/common/helper/helper-class';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AffiliationsService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger(AffiliationsService.name);

  async scrapingAffiliations() {
    try {
      await this.puppeteerAffiliations();

      return;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
  puppeteerAffiliations = async () => {
    const promises = [];
    const browser = await puppeteer.launch();
    const totalPaginationNumber = await this.puppeteerTotalPaginationNumber();

    for (
      let pageNumber = 1;
      pageNumber <= totalPaginationNumber;
      pageNumber++
    ) {
      promises.push(this.getAllAffiliations(pageNumber, browser));
      if (pageNumber % 100 === 0) await HelperClass.sleepNow(60000);
    }

    return await Promise.all(promises);
  };

  puppeteerTotalPaginationNumber = async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(`https://sinta.kemdikbud.go.id/affiliations`);
    await page.waitForSelector('body > div');
    const totalPaginationNumber = await page.$eval(
      'div.text-center.pagination-text',
      (el) => el.textContent.split(' ')[3].trim() as unknown as number,
    );

    await browser.close();
    return totalPaginationNumber;
  };

  async getAllAffiliations(pageNumber: number, browser: Browser) {
    console.log(`Scraping page number: ${pageNumber}`);

    if (!browser) {
      browser = await puppeteer.launch();
    }

    const page = await browser.newPage();

    // Configure the navigation timeout
    await page.setDefaultNavigationTimeout(0);

    await page.goto(
      `https://sinta.kemdikbud.go.id/affiliations?page=${pageNumber}`,
    );

    await page.waitForSelector('div.content');

    const affiliationCards = await page.evaluate(() => {
      const cardAffiliations = Array.from(
        document.querySelectorAll('div.content-list > div.list-item'),
      );

      const data: Prisma.AffiliationCreateInput[] = cardAffiliations.map(
        (card) => ({
          numericId: Number(
            card
              .querySelector('div.profile-id')
              .textContent.trim()
              .split(' ')[2] as unknown,
          ),

          codePT: card
            .querySelector('div.profile-id')
            .textContent.trim()
            .split(' ')[6],

          name: card.querySelector('div.affil-name').textContent.trim(),

          nameAbbrev: card.querySelector('div.affil-abbrev').textContent.trim(),

          imgUrl: card
            .querySelector('div > .img-thumbnail.avatar-affil')
            .getAttribute('src')
            .trim(),

          origin: card.querySelector('div.affil-loc > a').textContent.trim(),

          totalDepartment: Number(
            card
              .querySelector('div.stat-prev > span.num-stat > a')
              .textContent.trim()
              .split(' ')[0],
          ),

          departmentUrl: card
            .querySelector('div.stat-prev > span.num-stat > a')
            .getAttribute('href'),

          authorCount: card
            .querySelector('div.stat-prev > span.num-stat.ml-3')
            .textContent.trim()
            .split(' ')[0],

          sintaScore3Yr: card
            .querySelectorAll(
              'div.list-item > div > div > div.col > div.pr-num',
            )[0]
            .textContent.trim(),

          sintaScoreOverall: card
            .querySelectorAll(
              'div.list-item > div > div > div.col > div.pr-num',
            )[1]
            .textContent.trim(),
        }),
      );
      return data;
    });
    await page.close();

    return affiliationCards.forEach(async (affiliation) => {
      //  TODO : activated when u want to save to database
      // await this.prisma.affiliation.create({ data: affiliation });
    });
  }
}
