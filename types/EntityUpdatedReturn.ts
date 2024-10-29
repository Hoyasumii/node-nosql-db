import { EntitySchema } from "./EntitySchema";

export interface EntityUpdatedReturn<
  ObjectType extends object,
  EntityKeys extends keyof EntitySchema<ObjectType>
> {
  _updatedRows: number;
  content: Array<Pick<EntitySchema<ObjectType>, EntityKeys>>;
}
