import fs from "node:fs/promises";
import { EventEmitterAsyncResource } from "node:events";
import { EventEmitter } from "node:stream";

interface Data {
  [key: string]: Array<string | number | boolean | null> | number;
  _retrievedAt: number;
}

export default class Core {
  #event: EventEmitter = new EventEmitter();
  #data: Data = {
    _retrievedAt: Date.now(),
  };
  readonly #path: string;
  // além do _id, eu preciso de _retrievedAt(quando os dados foram recebidos) e _updatedAt(quando os dados forem atualizados) para na verificação dos dados, caso

  constructor(path: string = "db.json") {
    this.#path = `${import.meta.dirname}\\${path}`;

    this.#event.on("save", async () => {
      
    });

  }

  async load() {
    try {
      const databaseBuffer = await fs.readFile(this.#path, {
        encoding: "utf8",
      });

      this.#data = JSON.parse(databaseBuffer.toString());
    } catch (e) {
      this.#save();
    }
  }

  async emit<K>(eventName: string | symbol, ...args: any[]): Promise<boolean> {
    const listeners = this.#event.listeners(eventName);

    for (const listener of listeners) {
      await listener(...args);
    }

    return true;
  }

  async #save() {
    const newVersionCore = new Core(this.#path);

    await newVersionCore.load();

    if (newVersionCore.#data._retrievedAt > this.#data._retrievedAt) {
    }

    await fs.writeFile(this.#path, JSON.stringify(this.#data), {
      encoding: "utf8",
    });
  }
}

const core = new Core();
