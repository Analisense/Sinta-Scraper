export default class JournalsDto {
  numericId: number;
  title: string;
  titleUrl: string;
  imgUrl: string;
  label: JournalDetail[];
  affiliation: JournalDetail;
  pISSN: string;
  eISSN: string;
  impact: string;
  h5Index: string;
  citations5Year: string;
  citations: string;
}

type JournalDetail = {
  name: string;
  url: string;
};
