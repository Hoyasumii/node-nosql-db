import { Entity } from "./Entity";
import Core from ".";
import { Content } from "@/types";

export class Collection<Entities extends string> {
  readonly #core: Core<Entities>;

  constructor(core: Core<Entities>) {
    this.#core = core;
  }

  async create(entityName: Entities): Promise<boolean> {
    if (entityName === "$schemas") return false;
    if (this.#core.data[entityName]) return false;
    if (!this.#core.schema.read(entityName)) return false;

    this.#core.data[entityName] = {
      content: [],
      $schema: entityName,
    };

    await this.#core.save();
    return true;
  }

  select<SchemaType extends object>(
    collectionName: Entities
  ): Entity<Entities, SchemaType> {
    const { $schema, ...data } = this.#core.data[collectionName];

    const schema = this.#core.schema.read($schema);
    if (!schema) throw new Error("Inexistent Schema");

    return new Entity<Entities, SchemaType>(
      collectionName,
      data.content as never,
      schema,
      this.#core
    );
  }

  async delete(collectionName: Entities) {
    delete this.#core.data[collectionName];
    await this.#core.save();
  }

  async clear() {
    this.#core.data = {} as Record<Entities, Content<Entities>>;
    await this.#core.save();
  }

  list(): Array<Entities> {
    const myEntities = Object.keys(this.#core.data) as Array<Entities>;

    return myEntities;
  }
}
