export interface Profile {
  id: string;
  name: string;
  fields: {
    key: string;
    value: string;
  }[];
  createdAt: string;
  updatedAt: string;
}
