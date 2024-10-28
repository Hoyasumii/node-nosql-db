import { ZodSchema } from "zod";
import { dezerialize, SzType, zerialize } from "zodex";
import Core from ".";

export class Schema {
  #core: Core;
  #schemas: Record<string, unknown>;

  constructor(schemas: Record<string, unknown>, core: Core) {
    this.#core = core;
    this.#schemas = schemas;
  }

  async create(name: string, schema: ZodSchema): Promise<boolean> {
    if (this.#schemas[name]) return false;

    this.#schemas[name] = zerialize(schema as never);
    await this.#core.save();

    return true;
  }

  read(name: string): ZodSchema | false {
    if (!this.#schemas[name]) return false;
    return dezerialize(this.#schemas[name] as SzType);
  }

  async update(name: string, schema: ZodSchema): Promise<boolean> {
    if (!this.#schemas[name]) return false;

    this.#schemas[name] = zerialize(schema as never);
    await this.#core.save();

    return true;
  }

  delete(name: string): boolean {
    return delete this.#schemas[name];
  }
}
