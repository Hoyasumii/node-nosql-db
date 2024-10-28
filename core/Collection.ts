import { Content, EntitySchema } from "@/types";
import { Entity } from "./Entity";
import Core from ".";

export class Collection {
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

  read<SchemaType extends object = any>(
    collectionName: string
  ): Entity<EntitySchema<SchemaType>> | undefined {
    const { $schema, ...data } = this.#data[collectionName];

    const schema = this.#core.schema.read($schema);
    if (!schema) return undefined;

    return new Entity<SchemaType>(data, schema, this.#core);
  }

  async delete(collectionName: string) {
    delete this.#data[collectionName];
    await this.#core.save();
  }

  async clear() {
    this.#data = {};
    await this.#core.save();
  }
}
