import fs from "node:fs/promises";
import { SchemaManager } from "./SchemaManager";

export default class Core {
  #data: Record<string, Array<Record<string, unknown>>> = {};
  #$schemas: Record<string, unknown> = {};

  readonly #path: string;

  constructor(path: string = "db.json") {
    this.#path = `${import.meta.dirname}\\${path}`;
  }

  async load() {
    try {
      const databaseBuffer = await fs.readFile(this.#path, {
        encoding: "utf8",
      });

      const { $schemas, ...storedData } = JSON.parse(databaseBuffer.toString());

      this.#data = { ...storedData };
      this.#$schemas = $schemas;
    } catch (e) {
      this.save();
    }
  }

  async save() {
    console.log({ $schemas: this.#$schemas, ...this.#data });
    await fs.writeFile(
      this.#path,
      JSON.stringify({ $schemas: this.#$schemas, ...this.#data }),
      {
        encoding: "utf8",
      }
    );
  }

  collection = {};

  schema = new SchemaManager(this.#$schemas, this);
}

const core = new Core();

(async () => {
  await core.load();
})();
