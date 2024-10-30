import { ZodSchema } from "zod";
import { dezerialize, SzType, zerialize } from "zodex";
import Core from ".";

export class Schema<Entities extends string> {
  #core: Core<Entities>;
  #schemas: Record<string, unknown>;

  constructor(schemas: Record<string, unknown>, core: Core<Entities>) {
    this.#core = core;
    this.#schemas = schemas;
  }

  async create(name: Entities, schema: ZodSchema): Promise<boolean> {
    if (this.#schemas[name]) return false;

    this.#schemas[name] = zerialize(schema as never);
    await this.#core.save();

    return true;
  }

  read(name: Entities): ZodSchema | false {
    if (!this.#schemas[name]) return false;
    return dezerialize(this.#schemas[name] as SzType);
  }

  delete(name: Entities): boolean {
    if (this.#core.data[name]) throw new Error("The Schema Cannot be Removed.");

    return delete this.#schemas[name];
  }
}
