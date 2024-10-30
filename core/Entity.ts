import { randomUUID } from "node:crypto";
import { ZodSchema } from "zod";
import { EntitySchema, EntityUpdatedReturn } from "@/types";
import Core from ".";

export class Entity<SelectedEntity extends string, ObjectType extends object> {
  name: SelectedEntity;
  #data: Array<EntitySchema<ObjectType>>;
  #hashedData: Record<string, EntitySchema<ObjectType>> = {};
  #mappedData: Record<string, number> = {};
  #$schema: ZodSchema;
  readonly #core: Core<SelectedEntity>;

  constructor(
    name: SelectedEntity,
    data: Array<EntitySchema<ObjectType>>,
    schema: ZodSchema,
    core: Core<SelectedEntity>
  ) {
    this.name = name;
    this.#data = data as Array<EntitySchema<ObjectType>>;
    this.#$schema = schema;
    this.#core = core;
    this.#optimize();
  }

  #optimize() {
    this.#data.forEach((item, index) => {
      const { _id } = item;

      this.#mappedData[_id] = index;
      this.#hashedData[_id] = item;
    });
  }

  async create(data: ObjectType): Promise<EntitySchema<ObjectType>> {
    if (!this.#core.data[this.name]) {
      throw new Error("The Collection was not Created");
    }

    const _id = randomUUID().toString();
    const now = Date.now();

    const schemaParse = this.#$schema.safeParse(data).success;

    if (!schemaParse) throw new Error("Invalid Schema for Entity Creation");

    const newEntity = { _id, _createdAt: now, _updatedAt: now, ...data };

    this.#mappedData[_id] = this.#data.length;
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
    updateOrder: (entity: ObjectType, index: number) => ObjectType,
    keys?: Array<EntityKeys>
  ): Promise<EntityUpdatedReturn<ObjectType, EntityKeys>>;

  async update<EntityKeys extends keyof EntitySchema<ObjectType>>(
    validatorMethod: (entity: EntitySchema<ObjectType>) => boolean,
    updateOrder: Partial<ObjectType>,
    keys?: Array<EntityKeys>
  ): Promise<EntityUpdatedReturn<ObjectType, EntityKeys>>;

  async update<EntityKeys extends keyof EntitySchema<ObjectType>>(
    validatorMethod: (entity: EntitySchema<ObjectType>) => boolean,
    updateOrder:
      | ((entity: ObjectType, index: number) => ObjectType)
      | Partial<ObjectType>,
    keys: Array<EntityKeys> = []
  ): Promise<EntityUpdatedReturn<ObjectType, EntityKeys>> {
    let changesCount = 0;
    const updatedContent: Array<Pick<EntitySchema<ObjectType>, EntityKeys>> =
      [];

    this.#data.forEach((entity, index) => {
      if (validatorMethod(entity)) {
        changesCount++;

        if (typeof updateOrder === "function") {
          const { _id, _createdAt, _updatedAt: _, ...entityData } = entity;

          const updatedItem: EntitySchema<ObjectType> = {
            _id,
            _createdAt,
            _updatedAt: Date.now(),
            ...updateOrder(entityData as ObjectType, index),
          };

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

        if (!(typeof updateOrder === "object"))
          throw new Error("updateOrder is not an Object");

        const newContent = {
          ...entity,
          ...updateOrder,
          _updatedAt: Date.now(),
        };

        const newExposedContent: Pick<
          EntitySchema<ObjectType>,
          EntityKeys
        > = {} as never;

        if (keys.length > 0) {
          keys.forEach((key) => {
            newExposedContent[key] = newContent[key];
          });
          updatedContent.push(newExposedContent);
        } else {
          updatedContent.push(newContent);
        }

        this.#data[index] = newContent;
      }
    });

    await this.#save();
    this.#optimize();
    return { _updatedRows: changesCount, content: updatedContent };
  }

  async updateById(
    id: string,
    updateOrder: (entity: ObjectType) => ObjectType
  ): Promise<boolean>;

  async updateById(
    id: string,
    updateOrder: Partial<ObjectType>
  ): Promise<boolean>;

  async updateById(
    id: string,
    updateOrder: ((entity: ObjectType) => ObjectType) | Partial<ObjectType>
  ): Promise<boolean> {
    if (!this.#hashedData[id]) return false;
    const index = this.#mappedData[id];

    const { _id, _createdAt, _updatedAt: _, ...data } = this.#hashedData[id];

    if (typeof updateOrder === "function") {
      this.#hashedData[id] = this.#data[index] = {
        _id,
        _createdAt,
        _updatedAt: Date.now(),
        ...updateOrder(data as ObjectType),
      };
    } else if (typeof updateOrder === "object") {
      this.#hashedData[id] = this.#data[index] = {
        ...this.#hashedData[id],
        ...updateOrder,
        _updatedAt: Date.now(),
      };
    } else {
      throw new Error("updateOrder is not an Object");
    }

    await this.#save();
    return true;
  }

  async delete(
    notToRemoveMethod: (entity: EntitySchema<ObjectType>) => boolean
  ): Promise<number> {
    let removedItems = this.#data.length;

    this.#data = this.#data.filter(notToRemoveMethod);

    return removedItems - this.#data.length;
  }

  async deleteById(id: string): Promise<boolean> {
    if (!this.#hashedData[id]) return false;

    this.#data = this.#data.filter((entity) => entity._id !== id);
    this.#optimize();

    await this.#save();

    return true;
  }

  async #save() {
    await this.#core.save();
  }
}
