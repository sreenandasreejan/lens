import { z } from "zod";
import type { ColumnMeta, RecordData, TableMeta } from "@/services/db";

const SYSTEM_COLUMNS = new Set(["id", "created_at", "updated_at", "user_id"]);

export function getPrimaryKey(table: TableMeta) {
  return table.primaryKeys[0] ?? table.columns.find((column) => column.name === "id")?.name ?? table.columns[0]?.name ?? "id";
}

export function isWritableColumn(column: ColumnMeta) {
  return !column.isPrimaryKey && !SYSTEM_COLUMNS.has(column.name);
}

export function getWritableColumns(table: TableMeta) {
  return table.columns.filter(isWritableColumn);
}

export function isRequiredForCreate(column: ColumnMeta) {
  return !column.nullable && !column.defaultValue && !SYSTEM_COLUMNS.has(column.name) && !column.isPrimaryKey;
}

export function inputTypeFor(column: ColumnMeta) {
  if (column.dataType === "date") return "date";
  if (column.dataType.includes("timestamp")) return "datetime-local";
  if (["integer", "bigint", "numeric", "real", "double precision"].includes(column.dataType)) return "number";
  if (column.dataType === "boolean") return "checkbox";
  return "text";
}

export function parseInputValue(column: ColumnMeta, raw: string | boolean) {
  if (typeof raw === "boolean") return raw;
  if (raw === "") return column.nullable ? null : undefined;
  if (["integer", "bigint"].includes(column.dataType)) return Number.parseInt(raw, 10);
  if (["numeric", "real", "double precision"].includes(column.dataType)) return Number.parseFloat(raw);
  return raw;
}

export function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function validateRecordInput(columns: ColumnMeta[], values: Record<string, string | boolean>, mode: "create" | "update") {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const column of columns) {
    let validator: z.ZodTypeAny = z.union([z.string(), z.boolean()]);
    if (mode === "create" && isRequiredForCreate(column)) validator = z.union([z.string().min(1, `${column.name} is required`), z.boolean()]);
    shape[column.name] = validator.optional();
  }
  const result = z.object(shape).safeParse(values);
  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => { errors[issue.path[0] as string] = issue.message; });
    return { ok: false as const, errors, data: {} as RecordData };
  }

  const data: RecordData = {};
  for (const column of columns) {
    const value = parseInputValue(column, values[column.name]);
    if (value !== undefined) data[column.name] = value;
  }
  return { ok: true as const, errors: {}, data };
}