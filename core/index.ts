import fs from "node:fs/promises";
import { SchemaManager } from "./Schema";
import { CollectionManager } from "./CollectionManager";
import { Content } from "@/types";

export default class Core {
  #data: Record<string, Content> = {};
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
    await fs.writeFile(
      this.#path,
      JSON.stringify({ $schemas: this.#$schemas, ...this.#data }),
      {
        encoding: "utf8",
      }
    );
  }

  collection = new CollectionManager(this.#data, this);

  schema = new SchemaManager(this.#$schemas, this);
}

const core = new Core();

(async () => {
  await core.load();
})();
