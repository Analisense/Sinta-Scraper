import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BookDocument = HydratedDocument<Book>;

class Detail {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  url: string;
}

@Schema({ collection: 'books', timestamps: true })
export class Book {
  @Prop({ required: true, unique: true })
  isbn: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  imgUrl: string;

  @Prop({ required: true })
  publisher: string;

  @Prop({ required: true })
  place: string;

  @Prop({ required: true })
  year: string;

  @Prop({ required: true })
  author: string;

  @Prop({ required: true })
  authorClaim: Detail;
}

export const BookSchema = SchemaFactory.createForClass(Book);
