import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import * as cheerio from 'cheerio';
import { Model } from 'mongoose';
import { Book, BookDocument } from './schema/books';

@Injectable()
export class BooksService {
  constructor(@InjectModel(Book.name) private bookModel: Model<BookDocument>) {}
  async scrapingBook() {
    axiosRetry(axios, {
      retries: 100,
      retryDelay: axiosRetry.exponentialDelay,
    });

    const totalPage = await this.cheerioGetTotalPage();

    let promises = [];
    for (let currentPage = 5000; currentPage <= totalPage; currentPage++) {
      promises.push(this.cheerioBooks(currentPage, totalPage));
      if (currentPage % 100 === 0) {
        await Promise.all(promises);
        promises = [];
      }
    }
    return 'success';
  }

  private async cheerioBooks(currentPage: number, totalPage: number) {
    try {
      console.log(`Scraping page: ${currentPage} of ${totalPage} pages`);

      const page = await axios.get(
        `https://sinta.kemdikbud.go.id/books?page=${currentPage}`,
      );

      const $ = cheerio.load(page.data);

      const bookWrapper = $('div.content-list > div.list-item');

      bookWrapper.map(async (i, el) => {
        const book: Book = {
          isbn:
            $(el).find('div.profile-id').text().split(':').pop()?.trim() || '',
          name: $(el).find('div.affil-name > a').text()?.trim() || '',
          imgUrl:
            $(el).find('img.img-thumbnail.journal-cover').attr('src') || '',
          author: String(
            $(el)
              .find('div.affil-loc > a')
              .map((i, el) => {
                if (i == 0)
                  return $(el)
                    .text()
                    .split(':')
                    .pop()
                    ?.trim()
                    .replace('\n', ' ');
              })
              .get() || '',
          ),
          authorClaim: {
            name: String(
              $(el)
                .find('div.affil-loc > a')
                .map((i, el) => {
                  if (i == 1) return $(el).text().replace(';', '')?.trim();
                })
                .get() || '',
            ),
            url: String(
              $(el)
                .find('div.affil-loc > a')
                .map((i, el) => {
                  if (i == 1) return $(el).attr('href');
                })
                .get() || '',
            ),
          },
          place:
            $(el)
              .find('div.affil-abbrev > a')
              .text()
              .split('|')[1]
              .split(',')[0]
              ?.trim() || '',
          year:
            $(el)
              .find('div.affil-abbrev > a')
              .text()
              .split('|')[1]
              .split(',')[1]
              ?.trim() || '',

          publisher:
            $(el)
              .find('div.affil-abbrev > a')
              .text()
              .split('|')[0]
              .replace('Publisher', '')
              ?.trim() || '',
        };
        await this.bookModel.findOneAndUpdate({ isbn: book.isbn }, book, {
          upsert: true,
        });
      });
    } catch (error) {
      console.log(`Failed Scraping Books at page ${currentPage}`, error);
    }
  }

  private async cheerioGetTotalPage(): Promise<number> {
    const page = await axios.get('https://sinta.kemdikbud.go.id/books');
    const $ = cheerio.load(page.data);
    const totalPage = parseInt(
      $('div.pagination-text > small')
        .text()
        .split(' ')[3]
        .replace('.', '')
        ?.trim(),
    );
    return totalPage;
  }
}
