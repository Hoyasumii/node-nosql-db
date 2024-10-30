export interface Content<Entities extends string> {
  content: Array<Record<string, unknown>>;
  $schema: Entities;
}
