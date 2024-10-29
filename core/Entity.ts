import { randomUUID } from "node:crypto";
import { ZodSchema } from "zod";
import { EntitySchema, EntityUpdatedReturn } from "@/types";
import Core from ".";

export class Entity<ObjectType extends object> {
  name: string;
  #data: Array<EntitySchema<ObjectType>>;
  #hashedData: Record<string, EntitySchema<ObjectType>> = {};
  #$schema: ZodSchema;
  readonly #core: Core;

  constructor(
    name: string,
    data: Array<EntitySchema<ObjectType>>,
    schema: ZodSchema,
    core: Core
  ) {
    this.name = name;
    this.#data = data as Array<EntitySchema<ObjectType>>;
    this.#$schema = schema;
    this.#core = core;
    this.#optimize();
  }

  #optimize() {
    this.#data.forEach((item) => {
      const { _id } = item;

      this.#hashedData[_id] = item;
    });
  }

  async create(data: ObjectType): Promise<EntitySchema<ObjectType>> {
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

  find<EntityKeys extends keyof EntitySchema<ObjectType>>(
    validatorMethod: (entity: EntitySchema<ObjectType>) => boolean,
    keys?: Array<EntityKeys>
  ): Array<Pick<EntitySchema<ObjectType>, EntityKeys>> {
    const returnedData: Array<Pick<EntitySchema<ObjectType>, EntityKeys>> = [];

    this.#data.forEach((entity) => {
      if (!validatorMethod(entity)) return;

      let entityValue = {} as Pick<EntitySchema<ObjectType>, EntityKeys>;

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

  findById<EntityKeys extends keyof EntitySchema<ObjectType>>(
    id: string,
    keys?: Array<EntityKeys>
  ): Pick<EntitySchema<ObjectType>, EntityKeys> {
    if (!this.#hashedData[id]) throw new Error("Invalid id");

    let returnedEntity = this.#hashedData[id] as Pick<
      EntitySchema<ObjectType>,
      EntityKeys
    >;

    if (keys) {
      returnedEntity = {} as Pick<EntitySchema<ObjectType>, EntityKeys>;

      keys.forEach((key) => {
        returnedEntity[key] = (
          this.#hashedData[id] as EntitySchema<ObjectType>
        )[key];
      });
    }

    return returnedEntity;
  }

  async update<EntityKeys extends keyof EntitySchema<ObjectType>>(
    validatorMethod: (entity: EntitySchema<ObjectType>) => boolean,
    updateOrder: (
      entity: EntitySchema<ObjectType>,
      index: number
    ) => EntitySchema<ObjectType>,
    keys?: Array<EntityKeys>
  ): Promise<EntityUpdatedReturn<ObjectType, EntityKeys>>;

  async update<EntityKeys extends keyof EntitySchema<ObjectType>>(
    validatorMethod: (entity: EntitySchema<ObjectType>) => boolean,
    updateOrder: Partial<EntitySchema<ObjectType>>,
    keys?: Array<EntityKeys>
  ): Promise<EntityUpdatedReturn<ObjectType, EntityKeys>>;

  async update<EntityKeys extends keyof EntitySchema<ObjectType>>(
    validatorMethod: (entity: EntitySchema<ObjectType>) => boolean,
    updateOrder:
      | ((
          entity: EntitySchema<ObjectType>,
          index: number
        ) => EntitySchema<ObjectType>)
      | Partial<EntitySchema<ObjectType>>,
    keys: Array<EntityKeys> = []
  ): Promise<EntityUpdatedReturn<ObjectType, EntityKeys>> {
    let changesCount = 0;
    const updatedContent: Array<Pick<EntitySchema<ObjectType>, EntityKeys>> =
      [];

    this.#data.forEach((entity, index) => {
      if (validatorMethod(entity)) {
        changesCount++;

        if (typeof updateOrder === "function") {
          const updatedItem = updateOrder(entity, index);

          if (keys.length > 0) {
            const updatedItemWithSelectedKeys: Record<string, unknown> = {};

            keys?.forEach((key) => {
              updatedItemWithSelectedKeys[key as string] = updatedItem[key];
            });

            updatedContent.push(
              updatedItemWithSelectedKeys as Pick<
                EntitySchema<ObjectType>,
                EntityKeys
              >
            );
          } else {
            updatedContent.push(updatedItem);
          }

          this.#data[index] = updatedItem;
          return;
        }

        this.#data[index] = { ...entity, ...updateOrder };
      }
    });

    await this.save();
    this.#optimize();
    return { _updatedRows: changesCount, content: updatedContent };
  }

  async updateById(
    id: string,
    updateOrder: (entity: EntitySchema<ObjectType>) => EntitySchema<ObjectType>
  ): Promise<boolean>;
  async updateById(
    id: string,
    updateOrder: Partial<EntitySchema<ObjectType>>
  ): Promise<boolean>;
  async updateById(
    id: string,
    updateOrder:
      | ((entity: EntitySchema<ObjectType>) => EntitySchema<ObjectType>)
      | Partial<EntitySchema<ObjectType>>
  ) {
    if (!this.#hashedData[id]) return false;

    return true;
  }

  // delete() {}
  // deleteById() {}

  async save() {
    await this.#core.save();
  }
}
