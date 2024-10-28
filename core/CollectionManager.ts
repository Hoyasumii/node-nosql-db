import { Collection } from "./Collection";
import Core from ".";

interface Content {
  content: Array<Record<string, unknown> & { _id: string }>;
  $schema: string;
}

export class CollectionManager {
  #data: Record<string, Content>;
  readonly #core: Core;

  constructor(data: Record<string, Content>, parent: Core) {
    this.#core = parent;
    this.#data = data;
  }

  async create(collectionName: string, schema: string): Promise<boolean> {
    if (this.#data[collectionName]) return false;

    this.#data[collectionName] = {
      content: [],
      $schema: schema,
    };

    await this.#core.save();
    return true;
  }

  select<SchemaType extends { _id: string; [key: string]: any } = any>(
    collectionName: string
  ): Collection<SchemaType> {
    const { $schema, ...data } = this.#data[collectionName];

    const schema = this.#core.schema.read($schema);

    return new Collection<SchemaType>(data, schema, this.#core);
  }

  delete(collectionName: string) {
    return delete this.#data[collectionName];
  }

  async clear() {
    this.#data = {};
    await this.#core.save();
  }
}
