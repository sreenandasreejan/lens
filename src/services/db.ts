import { supabase } from "@/integrations/supabase/client";

export type Primitive = string | number | boolean | null;
export type RecordData = Record<string, unknown>;
export type FilterOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "ilike" | "in";

export interface ColumnMeta {
  name: string;
  dataType: string;
  udtName: string;
  nullable: boolean;
  defaultValue: string | null;
  maxLength: number | null;
  ordinalPosition: number;
  isPrimaryKey: boolean;
}

export interface ForeignKeyMeta {
  constraintName: string;
  column: string;
  foreignTable: string;
  foreignColumn: string;
}

export interface TableMeta {
  name: string;
  columns: ColumnMeta[];
  primaryKeys: string[];
  foreignKeys: ForeignKeyMeta[];
  canWrite: boolean;
  writeMode: "user_scoped" | "allowlisted" | "locked";
}

export interface QueryFilter {
  column: string;
  operator?: FilterOperator;
  value: unknown;
}

export interface ListOptions {
  filters?: QueryFilter[];
  search?: string;
  searchColumns?: string[];
  orderBy?: string;
  ascending?: boolean;
  page?: number;
  pageSize?: number;
}

export class DbError extends Error {
  constructor(message: string, public status?: number, public cause?: unknown) {
    super(message);
    this.name = "DbError";
  }
}

async function invokeDb<T>(payload: RecordData): Promise<T> {
  console.info("[db] request", payload.action, payload.table ?? "schema");
  const { data, error } = await supabase.functions.invoke("db-api", { body: payload });
  if (error) {
    console.error("[db] function error", error);
    throw new DbError(error.message, error.context?.status, error);
  }
  const response = data as { error?: unknown } & T;
  if (response?.error) {
    console.error("[db] response error", response.error);
    throw new DbError(typeof response.error === "string" ? response.error : JSON.stringify(response.error));
  }
  console.info("[db] response", payload.action, response);
  return response;
}

export async function getSchema(refresh = false) {
  const response = await invokeDb<{ tables: TableMeta[] }>({ action: "schema", refresh });
  return response.tables;
}

export async function getAll(tableName: string, options: ListOptions = {}) {
  const response = await invokeDb<{ data: RecordData[]; count: number }>({
    action: "list",
    table: tableName,
    filters: options.filters ?? [],
    search: options.search,
    searchColumns: options.searchColumns ?? [],
    orderBy: options.orderBy,
    ascending: options.ascending ?? true,
    page: options.page ?? 1,
    pageSize: options.pageSize ?? 20,
  });
  return { data: response.data ?? [], count: response.count ?? 0 };
}

export async function getById(tableName: string, id: Primitive, primaryKey?: string) {
  const response = await invokeDb<{ data: RecordData | null }>({ action: "getById", table: tableName, id, primaryKey });
  return response.data;
}

export async function createRecord(tableName: string, data: RecordData) {
  const response = await invokeDb<{ data: RecordData }>({ action: "create", table: tableName, data });
  return response.data;
}

export async function updateRecord(tableName: string, id: Primitive, data: RecordData, primaryKey?: string) {
  const response = await invokeDb<{ data: RecordData[] }>({ action: "update", table: tableName, id, primaryKey, data });
  return response.data;
}

export async function updateWhere(tableName: string, filters: QueryFilter[], data: RecordData) {
  const response = await invokeDb<{ data: RecordData[] }>({ action: "update", table: tableName, filters, data });
  return response.data;
}

export async function deleteRecord(tableName: string, id: Primitive, primaryKey?: string) {
  const response = await invokeDb<{ count: number }>({ action: "delete", table: tableName, id, primaryKey, confirm: true });
  return response.count;
}

export async function deleteWhere(tableName: string, filters: QueryFilter[]) {
  const response = await invokeDb<{ count: number }>({ action: "delete", table: tableName, filters, confirm: true });
  return response.count;
}

export const mockSchema: TableMeta[] = [
  {
    name: "moments",
    primaryKeys: ["id"],
    canWrite: true,
    writeMode: "user_scoped",
    foreignKeys: [],
    columns: [
      { name: "id", dataType: "uuid", udtName: "uuid", nullable: false, defaultValue: "gen_random_uuid()", maxLength: null, ordinalPosition: 1, isPrimaryKey: true },
      { name: "title", dataType: "text", udtName: "text", nullable: false, defaultValue: null, maxLength: null, ordinalPosition: 2, isPrimaryKey: false },
      { name: "description", dataType: "text", udtName: "text", nullable: true, defaultValue: null, maxLength: null, ordinalPosition: 3, isPrimaryKey: false },
      { name: "date", dataType: "date", udtName: "date", nullable: false, defaultValue: null, maxLength: null, ordinalPosition: 4, isPrimaryKey: false },
      { name: "user_id", dataType: "uuid", udtName: "uuid", nullable: false, defaultValue: null, maxLength: null, ordinalPosition: 5, isPrimaryKey: false },
    ],
  },
];

export const mockRows: Record<string, RecordData[]> = {
  moments: [
    { id: "sample-1", title: "Sample moment", description: "Mock fallback row for tests and offline previews.", date: "2026-04-27", user_id: "mock-user" },
  ],
};