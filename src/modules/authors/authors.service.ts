import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common/services';
import { Prisma } from '@prisma/client';
import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer, { Browser } from 'puppeteer';
import HelperClass from 'src/common/helper/helper-class';
import { PrismaService } from 'src/prisma/prisma.service';
import AuthorDto from './dto/authors.dto';

@Injectable()
export class AuthorsService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger(AuthorsService.name);

  async scrapingAuthors() {
    try {
      // await this.puppeteerAuthors();
      const finalResult = await this.cheerioAuthors();
      console.log('Scraping authors done');

      return finalResult;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  puppeteerAuthors = async () => {
    const promises = [];
    const browser = await puppeteer.launch();
    const totalPaginationNumber = await this.puppeteerTotalPaginationNumber();

    for (
      let pageNumber = 1;
      pageNumber <= totalPaginationNumber;
      pageNumber++
    ) {
      promises.push(this.getAllAuthorsByPuppeteer(pageNumber, browser));
      if (pageNumber % 100 === 0) await HelperClass.sleepNow(60000);
    }

    return await Promise.all(promises);
  };

  async getAllAuthorsByPuppeteer(
    pageNumber: number,
    browser: Browser,
  ): Promise<any> {
    console.log(`Scraping page number: ${pageNumber}`);
    if (!browser) {
      browser = await puppeteer.launch();
    }
    const page = await browser.newPage();

    await page.setDefaultNavigationTimeout(0);

    await page.goto(`https://sinta.kemdikbud.go.id/authors?page=${pageNumber}`);

    // await page.waitForSelector('div.content');

    const authorCards = await page.evaluate(() => {
      const cardAuthors = Array.from(
        document.querySelectorAll('div.content-list > div.list-item'),
      );

      const data: Prisma.AuthorCreateInput[] = cardAuthors.map((card) => ({
        sintaId: card
          .querySelector('div.profile-id')
          .textContent.split(':')[1]
          .trim(),

        name: card.querySelector('div.profile-name').textContent.trim(),

        profileUrl: card
          .querySelector('div.profile-name > a')
          .getAttribute('href'),

        profileImgUrl: card
          .querySelector('div > img.img-thumbnail')
          .getAttribute('src'),

        universityName: card
          .querySelector('div.profile-affil > a')
          .textContent.trim(),

        universityUrl: card
          .querySelector('div.profile-affil > a')
          .getAttribute('href'),

        codePT: card
          .querySelector('div.profile-affil > a')
          .getAttribute('href')
          .split('/')
          .pop(),

        prodiName: card
          .querySelector('div.profile-dept > a')
          .textContent.trim(),

        prodiUrl: card
          .querySelector('div.profile-dept > a')
          .getAttribute('href'),

        sintaScore3Yr: card
          .querySelectorAll('div > div > div.pr-num')[0]
          .textContent.trim(),

        sintaScoreOverall: card
          .querySelectorAll('div > div > div.pr-num')[1]
          .textContent.trim(),

        subject: Array.from(
          card.querySelectorAll('div > ul.subject-list > li > a'),
        ).map((el) => ({
          name: el.textContent.trim(),
          url: el.getAttribute('href'),
        })),

        scopusHIndex: card
          .querySelectorAll('div > table > tbody > tr > td')[2]
          .textContent.trim(),

        wosHIndex: card
          .querySelectorAll('div > table > tbody > tr > td')[5]
          .textContent.trim(),

        googleScholarHIndex: card
          .querySelectorAll('div > table > tbody > tr > td')[8]
          .textContent.trim(),
      }));
      return data;
    });

    await page.close();

    return authorCards.forEach(async (author) => {
      await this.prisma.author.create({ data: author });
    });
  }

  puppeteerTotalPaginationNumber = async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(`https://sinta.kemdikbud.go.id/authors`);
    await page.waitForSelector('body > div');
    const totalPaginationNumber = await page.$eval(
      'div.text-center.pagination-text',
      (el) => parseInt(el.textContent.trim().split(' ')[3].replace('.', '')),
    );

    await browser.close();
    return totalPaginationNumber;
  };

  cheerioAuthors = async () => {
    const totalPaginationNumber = await this.puppeteerTotalPaginationNumber();
    const promises = [];
    for (
      let pageNumber = 1;
      pageNumber <= totalPaginationNumber;
      pageNumber++
    ) {
      promises.push(this.getAllAuthorsByCheerio(pageNumber));
      // await HelperClass.sleepNow(500);
      if (pageNumber % 100 === 0) await HelperClass.sleepNow(30000);
    }
    Promise.all(promises);
  };

  getAllAuthorsByCheerio = async (pageNumber: number) => {
    try {
      console.log(`Scraping page number: ${pageNumber}`);

      const page = await axios.get(
        `https://sinta.kemdikbud.go.id/authors?page=${pageNumber}`,
        {
          timeout: 360000,
        },
      );

      const $ = cheerio.load(page.data);

      const cardAuthors = $(
        'div.content > div.content-list > div.list-item',
        page.data,
      );

      const tempAuthors: AuthorDto[] = [];

      cardAuthors.map((i, el) => {
        const author: AuthorDto = {
          sintaId: null,
          name: null,
          profileUrl: null,
          profileImgUrl: null,
          universityName: null,
          universityUrl: null,
          codePT: null,
          prodiName: null,
          prodiUrl: null,
          sintaScore3Yr: null,
          sintaScoreOverall: null,
          subject: [],
          scopusHIndex: null,
          wosHIndex: null,
          googleScholarHIndex: null,
        };

        author.sintaId = $(el)
          .find('div.profile-id')
          .text()
          .split(':')[1]
          .trim();

        author.name = $(el).find('div.profile-name').text().trim();

        author.profileUrl = $(el).find('div.profile-name > a').attr('href');

        author.profileImgUrl = $(el)
          .find('div > img.img-thumbnail')
          .attr('src');

        author.universityName = $(el)
          .find('div.profile-affil > a')
          .text()
          .trim();

        author.universityUrl = $(el).find('div.profile-affil > a').attr('href');

        author.codePT = $(el)
          .find('div.profile-affil > a')
          .attr('href')
          .split('/')
          .pop();

        author.prodiName = $(el).find('div.profile-dept > a').text().trim();

        author.prodiUrl = $(el).find('div.profile-dept > a').attr('href');

        author.sintaScore3Yr = $(el)
          .find('div > div > div.pr-num')
          .eq(0)
          .text()
          .trim();

        author.sintaScoreOverall = $(el)
          .find('div > div > div.pr-num')
          .eq(1)
          .text()
          .trim();

        $(el)
          .find('div > ul.subject-list > li > a')
          .each((i, el) => {
            const name = $(el).text().trim();
            const url = $(el).attr('href');

            author.subject.push({ name, url });
          });

        author.scopusHIndex = $(el)
          .find('div > table > tbody > tr > td')
          .eq(2)
          .text()
          .trim();

        author.wosHIndex = $(el)
          .find('div > table > tbody > tr > td')
          .eq(5)
          .text()
          .trim();

        author.googleScholarHIndex = $(el)
          .find('div > table > tbody > tr > td')
          .eq(8)
          .text()
          .trim();

        tempAuthors.push(author);
      });

      await this.prisma.author.createMany({ data: tempAuthors });
      return pageNumber;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
    // rp(`https://sinta.kemdikbud.go.id/authors?page=${pageNumber}`)
    //   .then(async (html) => {})
    //   .catch((err) => {
    //     this.logger.error(err);
    //     throw new Error('Error Request Promise');
    //   });
  };
}
