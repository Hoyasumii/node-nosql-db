import fs from "node:fs/promises";
import { Schema } from "./Schema";
import { Collection } from "./Collection";
import { Content } from "@/types";

export default class Core<Entities extends string> {
  public data: Record<Entities, Content<Entities>> = {} as Record<
    Entities,
    Content<Entities>
  >;
  #$schemas: Record<string, unknown> = {};
  readonly #path: string;

  constructor(path: string = "db.json") {
    this.#path = path;
  }

  async load() {
    try {
      const databaseBuffer = await fs.readFile(this.#path, {
        encoding: "utf8",
      });

      const { $schemas, ...storedData } = JSON.parse(databaseBuffer.toString());

      this.data = { ...storedData };

      this.#$schemas = $schemas;

      this.collection = new Collection(this);
      this.schema = new Schema(this.#$schemas, this);
    } catch (_) {
      this.save();
    }
  }

  async save() {
    await fs.writeFile(
      this.#path,
      JSON.stringify({ $schemas: this.#$schemas, ...this.data }, null, 2),
      {
        encoding: "utf8",
      }
    );
  }

  collection = new Collection(this);
  schema = new Schema<Entities>(this.#$schemas, this);
  reference = {};
  migrate = {};
}
