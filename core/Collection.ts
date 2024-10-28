import { Entity } from "./Entity";
import Core from ".";

export class Collection {
  readonly #core: Core;

  constructor(core: Core) {
    this.#core = core;
  }

  async create(collectionName: string, schema: string): Promise<boolean> {
    if (collectionName === "$schemas") return false;
    if (this.#core.data[collectionName]) return false;

    this.#core.data[collectionName] = {
      content: [],
      $schema: schema,
    };

    await this.#core.save();
    return true;
  }

  read<SchemaType extends object = any>(
    collectionName: string
  ): Entity<SchemaType> | undefined {
    const { $schema, ...data } = this.#core.data[collectionName];

    const schema = this.#core.schema.read($schema);
    if (!schema) return undefined;

    return new Entity<SchemaType>(
      collectionName,
      data.content as never,
      schema,
      this.#core
    );
  }

  async delete(collectionName: string) {
    delete this.#core.data[collectionName];
    await this.#core.save();
  }

  async clear() {
    this.#core.data = {};
    await this.#core.save();
  }
}
