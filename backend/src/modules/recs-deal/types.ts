// What RECS sends (FR-10.8.2): calculator slug, deal name, opaque payload
export interface RecsDealInput {
  c: string;
  name: string;
  d: string;
}

export interface RecsDealView {
  id: string;
  c: string;
  name: string;
  d: string;
  createdAt: string;
}
