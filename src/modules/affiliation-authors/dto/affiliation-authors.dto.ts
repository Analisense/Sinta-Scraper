export default class AffiliationAuthorsDto {
  sintaId?: string;
  name?: string;
  profileUrl?: string;
  profileImgUrl?: string;
  university?: University;
  prodiName?: string;
  prodiUrl?: string;
  scopusHIndex?: string;
  googleScholarHIndex?: string;
  sintaScore3Yr?: string;
  sintaScore?: string;
  affilScore3Yr?: string;
  affilScore?: string;
}

class University {
  name?: string;
  abbrevName?: string;
  pddiktiCode?: string;
  imgUrl?: string;
  location?: string;
  codePT?: string;
}
