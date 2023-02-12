import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AffiliationAuthorsDocument = HydratedDocument<AffiliationAuthors>;

class University {
  @Prop()
  name?: string;
  @Prop()
  abbrevName?: string;
  @Prop()
  pddiktiCode?: string;
  @Prop()
  imgUrl?: string;
  @Prop()
  location?: string;
  @Prop({ type: Number })
  numericIdAffiliation?: number;
}

@Schema({ collection: 'affiliation_authors' })
export class AffiliationAuthors {
  @Prop()
  sintaId?: string;
  @Prop()
  name?: string;
  @Prop()
  profileUrl?: string;
  @Prop()
  profileImgUrl?: string;
  @Prop()
  university?: University;
  @Prop()
  prodiName?: string;
  @Prop()
  prodiUrl?: string;
  @Prop()
  scopusHIndex?: string;
  @Prop()
  googleScholarHIndex?: string;
  @Prop()
  sintaScore3Yr?: string;
  @Prop()
  sintaScore?: string;
  @Prop()
  affilScore3Yr?: string;
  @Prop()
  affilScore?: string;
}

export const AffiliationAuthorsSchema =
  SchemaFactory.createForClass(AffiliationAuthors);
