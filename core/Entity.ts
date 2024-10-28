import { randomUUID } from "node:crypto";
import { ZodSchema } from "zod";
import { EntitySchema } from "@/types";
import Core from ".";

export class Entity<ObjType extends object> {
  name: string;
  #data: Array<EntitySchema<ObjType>>;
  #hashedData: Record<string, Omit<EntitySchema<ObjType>, "_id">> = {};
  #$schema: ZodSchema;
  readonly #core: Core;

  constructor(
    name: string,
    data: Array<EntitySchema<ObjType>>,
    schema: ZodSchema,
    core: Core
  ) {
    this.name = name;
    this.#data = data as Array<EntitySchema<ObjType>>;
    this.#$schema = schema;
    this.#core = core;
    this.#optimize();
  }

  #optimize() {
    this.#data.forEach(({ _id, ...data }) => {
      this.#hashedData[_id] = data;
    });
  }

  async create(data: ObjType): Promise<EntitySchema<ObjType>> {
    const _id = randomUUID().toString();
    const now = Date.now();

    const schemaParse = this.#$schema.safeParse(data).success;

    if (!schemaParse) throw new Error("Invalid Schema for Entity Creation");

    const newEntity = { _id, _createdAt: now, _updatedAt: now, ...data };

    this.#data.push(newEntity);
    this.#hashedData[_id] = {
      _createdAt: now,
      _updatedAt: now,
      ...data,
    } as never;

    await this.#core.save();

    return newEntity;
  }

  find<EntityKeys extends keyof EntitySchema<ObjType>>(
    validatorMethod: (entity: EntitySchema<ObjType>) => boolean,
    keys?: Array<EntityKeys>
  ): Array<Pick<EntitySchema<ObjType>, EntityKeys>> {
    const returnedData: Array<Pick<EntitySchema<ObjType>, EntityKeys>> = [];

    this.#data.forEach((entity) => {
      if (!validatorMethod(entity)) return;

      let entityValue = {} as Pick<EntitySchema<ObjType>, EntityKeys>;

      if (keys) {
        keys.forEach((key) => {
          entityValue[key] = entity[key];
        });
      } else {
        entityValue = entity;
      }

      returnedData.push(entityValue);
    });

    return returnedData;
  }

  findById<EntityKeys extends keyof Omit<EntitySchema<ObjType>, "_id">>(
    id: string,
    keys?: Array<EntityKeys>
  ): Pick<EntitySchema<ObjType>, EntityKeys> {
    if (!this.#hashedData[id]) throw new Error("Invalid id");

    let returnedEntity = { _id: id, ...this.#hashedData[id] } as Pick<
      EntitySchema<ObjType>,
      EntityKeys
    >;

    if (keys) {
      returnedEntity = {} as Pick<EntitySchema<ObjType>, EntityKeys>;

      keys.forEach((key) => {
        returnedEntity[key] = (this.#hashedData[id] as EntitySchema<ObjType>)[
          key
        ];
      });
    }

    return returnedEntity;
  }

  async update(
    validatorMethod: (entity: EntitySchema<ObjType>) => boolean,
    updateOrder: (
      entity: EntitySchema<ObjType>,
      index: number
    ) => EntitySchema<ObjType>
  ): Promise<number>;
  async update(
    validatorMethod: (entity: EntitySchema<ObjType>) => boolean,
    updateOrder: Partial<EntitySchema<ObjType>>
  ): Promise<number>;
  async update(
    validatorMethod: (entity: EntitySchema<ObjType>) => boolean,
    updateOrder:
      | ((
          entity: EntitySchema<ObjType>,
          index: number
        ) => EntitySchema<ObjType>)
      | Partial<EntitySchema<ObjType>>
  ): Promise<number> {
    let changesCount = 0;

    this.#data.forEach((entity, index) => {
      if (validatorMethod(entity)) {
        changesCount++;

        if (typeof updateOrder === "function") {
          this.#data[index] = updateOrder(entity, index);
          return;
        }

        this.#data[index] = { ...entity, ...updateOrder };
      }
    });

    await this.save();
    this.#optimize();
    return changesCount;
  }
  // updateById() {}

  // delete() {}
  // deleteById() {}

  async save() {
    await this.#core.save();
  }
}
