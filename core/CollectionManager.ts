import { ZodSchema } from "zod";
import Core from "./index";

export class CollectionManager {
  readonly #parent: Core;

  constructor(parent: Core) {
    this.#parent = parent;
  }

  create(collectionName: string, schema: ZodSchema) {
    
  }

  select();

  delete();

  clear();

}

const User = {
  name: "Alan",
  email: "alanreisanjo@gmail.com",
};
