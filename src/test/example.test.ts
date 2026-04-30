import { describe, it, expect } from "vitest";
import { getPrimaryKey, validateRecordInput } from "@/utils/dbForms";

describe("example", () => {
  it("should pass", () => {
    expect(true).toBe(true);
  });
});

describe("dynamic CRUD helpers", () => {
  it("detects primary key and parses validated values", () => {
    const table = {
      name: "items",
      primaryKeys: ["id"],
      foreignKeys: [],
      canWrite: true,
      writeMode: "allowlisted" as const,
      columns: [
        { name: "id", dataType: "uuid", udtName: "uuid", nullable: false, defaultValue: "gen_random_uuid()", maxLength: null, ordinalPosition: 1, isPrimaryKey: true },
        { name: "title", dataType: "text", udtName: "text", nullable: false, defaultValue: null, maxLength: null, ordinalPosition: 2, isPrimaryKey: false },
        { name: "count", dataType: "integer", udtName: "int4", nullable: true, defaultValue: null, maxLength: null, ordinalPosition: 3, isPrimaryKey: false },
      ],
    };

    const result = validateRecordInput(table.columns.slice(1), { title: "Alpha", count: "4" }, "create");

    expect(getPrimaryKey(table)).toBe("id");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ title: "Alpha", count: 4 });
  });
});
