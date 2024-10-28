export type EntitySchema<T extends object> = {
  [key in keyof T]: T[key];
} & { _id: string; _createdAt: number; _updatedAt: number };
