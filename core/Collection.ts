import { ZodSchema } from "zod";
import Core from ".";

export class Collection<SchemaManager extends Object & { id: string }> {
  #data: Array<SchemaManager>;
  #$schema: ZodSchema;
  readonly #core: Core;

  constructor(data: unknown, schema: ZodSchema, core: Core) {
    this.#data = data as Array<SchemaManager>;
    this.#$schema = schema;
    this.#core = core;
  }

  create(data: SchemaManager) {}
  find() {}
  findById() {}
  update() {}
  updateById() {}
  delete() {}
  deleteById() {}

  async save() {
    await this.#core.save();
  }
}
