import { createClient } from "npm:@supabase/supabase-js@2.104.1";
import { corsHeaders } from "npm:@supabase/supabase-js@2.104.1/cors";
import postgres from "npm:postgres@3.4.5";
import { z } from "npm:zod@3.25.76";

type DbUser = { id: string; email?: string };
type ColumnMeta = {
  name: string;
  dataType: string;
  udtName: string;
  nullable: boolean;
  defaultValue: string | null;
  maxLength: number | null;
  ordinalPosition: number;
  isPrimaryKey: boolean;
};
type ForeignKeyMeta = {
  constraintName: string;
  column: string;
  foreignTable: string;
  foreignColumn: string;
};
type TableMeta = {
  name: string;
  columns: ColumnMeta[];
  primaryKeys: string[];
  foreignKeys: ForeignKeyMeta[];
  canWrite: boolean;
  writeMode: "user_scoped" | "allowlisted" | "locked";
};
type SchemaCache = { tables: TableMeta[]; byName: Map<string, TableMeta>; expiresAt: number };

const databaseUrl = Deno.env.get("EXTERNAL_SUPABASE_DATABASE_URL");
if (!databaseUrl) throw new Error("Missing EXTERNAL_SUPABASE_DATABASE_URL secret");

const db = postgres(databaseUrl, {
  max: 3,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
});

type SqlFragment = ReturnType<typeof db>;
let schemaCache: SchemaCache | null = null;

const FilterSchema = z.object({
  column: z.string().min(1),
  operator: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "ilike", "in"]).default("eq"),
  value: z.unknown(),
});

const RequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("schema"), refresh: z.boolean().optional() }),
  z.object({
    action: z.literal("list"),
    table: z.string().min(1),
    filters: z.array(FilterSchema).default([]),
    search: z.string().trim().optional(),
    searchColumns: z.array(z.string()).default([]),
    includeRelations: z.boolean().default(true),
    orderBy: z.string().optional(),
    ascending: z.boolean().default(true),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
  }),
  z.object({ action: z.literal("getById"), table: z.string().min(1), id: z.union([z.string(), z.number()]), primaryKey: z.string().optional() }),
  z.object({ action: z.literal("create"), table: z.string().min(1), data: z.record(z.unknown()) }),
  z.object({
    action: z.literal("update"),
    table: z.string().min(1),
    id: z.union([z.string(), z.number()]).optional(),
    primaryKey: z.string().optional(),
    filters: z.array(FilterSchema).default([]),
    data: z.record(z.unknown()),
  }),
  z.object({
    action: z.literal("delete"),
    table: z.string().min(1),
    id: z.union([z.string(), z.number()]).optional(),
    primaryKey: z.string().optional(),
    filters: z.array(FilterSchema).default([]),
    confirm: z.boolean(),
  }),
]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const andJoin = (parts: SqlFragment[]) =>
  parts.reduce((acc, part, index) => (index === 0 ? part : db`${acc} and ${part}`));

const orJoin = (parts: SqlFragment[]) =>
  parts.reduce((acc, part, index) => (index === 0 ? part : db`${acc} or ${part}`));

const commaJoin = (parts: SqlFragment[]) =>
  parts.reduce((acc, part, index) => (index === 0 ? part : db`${acc}, ${part}`));

const tableRef = (table: string) => db`${db("public")}.${db(table)}`;

const getMutableTables = () =>
  new Set((Deno.env.get("EXTERNAL_SUPABASE_MUTABLE_TABLES") ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean));

async function requireUser(req: Request): Promise<DbUser> {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Response(JSON.stringify({ error: "Authentication required" }), { status: 401, headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) throw new Error("Auth environment is not configured");

  const authClient = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) throw new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: corsHeaders });
  return { id: data.user.id, email: data.user.email };
}

async function loadSchema(refresh = false): Promise<SchemaCache> {
  if (!refresh && schemaCache && schemaCache.expiresAt > Date.now()) return schemaCache;

  const [columnRows, pkRows, fkRows] = await Promise.all([
    db`
      select table_name, column_name, data_type, udt_name, is_nullable, column_default,
             character_maximum_length, ordinal_position
      from information_schema.columns
      where table_schema = 'public'
      order by table_name, ordinal_position
    `,
    db`
      select kcu.table_name, kcu.column_name
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu
        on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
      where tc.table_schema = 'public' and tc.constraint_type = 'PRIMARY KEY'
    `,
    db`
      select tc.constraint_name, kcu.table_name, kcu.column_name,
             ccu.table_name as foreign_table_name, ccu.column_name as foreign_column_name
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu
        on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
      join information_schema.constraint_column_usage ccu
        on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
      where tc.table_schema = 'public' and tc.constraint_type = 'FOREIGN KEY'
    `,
  ]);

  const mutableTables = getMutableTables();
  const pkMap = new Map<string, Set<string>>();
  for (const row of pkRows) {
    if (!pkMap.has(row.table_name)) pkMap.set(row.table_name, new Set());
    pkMap.get(row.table_name)!.add(row.column_name);
  }

  const fkMap = new Map<string, ForeignKeyMeta[]>();
  for (const row of fkRows) {
    const list = fkMap.get(row.table_name) ?? [];
    list.push({
      constraintName: row.constraint_name,
      column: row.column_name,
      foreignTable: row.foreign_table_name,
      foreignColumn: row.foreign_column_name,
    });
    fkMap.set(row.table_name, list);
  }

  const grouped = new Map<string, ColumnMeta[]>();
  for (const row of columnRows) {
    const pks = pkMap.get(row.table_name) ?? new Set<string>();
    const list = grouped.get(row.table_name) ?? [];
    list.push({
      name: row.column_name,
      dataType: row.data_type,
      udtName: row.udt_name,
      nullable: row.is_nullable === "YES",
      defaultValue: row.column_default,
      maxLength: row.character_maximum_length,
      ordinalPosition: row.ordinal_position,
      isPrimaryKey: pks.has(row.column_name),
    });
    grouped.set(row.table_name, list);
  }

  const tables = [...grouped.entries()].map(([name, columns]) => {
    const userScoped = columns.some((column) => column.name === "user_id");
    const allowlisted = mutableTables.has("*") || mutableTables.has(name);
    return {
      name,
      columns,
      primaryKeys: [...(pkMap.get(name) ?? new Set<string>())],
      foreignKeys: fkMap.get(name) ?? [],
      canWrite: userScoped || allowlisted,
      writeMode: userScoped ? "user_scoped" : allowlisted ? "allowlisted" : "locked",
    } satisfies TableMeta;
  });

  schemaCache = { tables, byName: new Map(tables.map((table) => [table.name, table])), expiresAt: Date.now() + 60_000 };
  return schemaCache;
}

function assertTable(schema: SchemaCache, tableName: string) {
  const meta = schema.byName.get(tableName);
  if (!meta) throw new Response(JSON.stringify({ error: `Unknown table: ${tableName}` }), { status: 404, headers: corsHeaders });
  return meta;
}

function assertColumn(meta: TableMeta, columnName: string) {
  const column = meta.columns.find((item) => item.name === columnName);
  if (!column) throw new Response(JSON.stringify({ error: `Unknown column: ${columnName}` }), { status: 400, headers: corsHeaders });
  return column;
}

function assertWritable(meta: TableMeta) {
  if (!meta.canWrite) {
    throw new Response(JSON.stringify({ error: `Mutations for ${meta.name} are locked. Add it to EXTERNAL_SUPABASE_MUTABLE_TABLES to allow writes.` }), {
      status: 403,
      headers: corsHeaders,
    });
  }
}

function primaryKeyFor(meta: TableMeta, requested?: string) {
  const key = requested ?? meta.primaryKeys[0] ?? "id";
  assertColumn(meta, key);
  return key;
}

function scrubPayload(meta: TableMeta, input: Record<string, unknown>, user: DbUser, partial = false) {
  const allowed = new Set(meta.columns.map((column) => column.name));
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (allowed.has(key) && !meta.primaryKeys.includes(key) && key !== "created_at" && key !== "updated_at") payload[key] = value;
  }
  if (allowed.has("user_id")) {
    if (payload.user_id && payload.user_id !== user.id) throw new Response(JSON.stringify({ error: "Cannot write records for another user" }), { status: 403, headers: corsHeaders });
    if (!partial) payload.user_id = user.id;
  }
  return payload;
}

function buildWhere(meta: TableMeta, filters: z.infer<typeof FilterSchema>[], search?: string, searchColumns: string[] = [], user?: DbUser) {
  const clauses: SqlFragment[] = [];
  if (user && meta.columns.some((column) => column.name === "user_id")) clauses.push(db`${db("user_id")} = ${user.id}`);

  for (const filter of filters) {
    assertColumn(meta, filter.column);
    if (filter.operator === "in") {
      if (!Array.isArray(filter.value) || filter.value.length === 0) continue;
      clauses.push(db`${db(filter.column)} in (${commaJoin(filter.value.map((value) => db`${value}`))})`);
      continue;
    }
    if (filter.operator === "eq") clauses.push(db`${db(filter.column)} = ${filter.value}`);
    if (filter.operator === "neq") clauses.push(db`${db(filter.column)} <> ${filter.value}`);
    if (filter.operator === "gt") clauses.push(db`${db(filter.column)} > ${filter.value}`);
    if (filter.operator === "gte") clauses.push(db`${db(filter.column)} >= ${filter.value}`);
    if (filter.operator === "lt") clauses.push(db`${db(filter.column)} < ${filter.value}`);
    if (filter.operator === "lte") clauses.push(db`${db(filter.column)} <= ${filter.value}`);
    if (filter.operator === "ilike") clauses.push(db`${db(filter.column)}::text ilike ${String(filter.value)}`);
  }

  if (search) {
    const columns = (searchColumns.length ? searchColumns : meta.columns.filter((column) => ["text", "character varying", "uuid"].includes(column.dataType)).map((column) => column.name))
      .filter((column) => meta.columns.some((item) => item.name === column));
    if (columns.length) clauses.push(db`(${orJoin(columns.map((column) => db`${db(column)}::text ilike ${`%${search}%`}`))})`);
  }

  return clauses.length ? db`where ${andJoin(clauses)}` : db``;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const user = await requireUser(req);
    const body = RequestSchema.safeParse(await req.json());
    if (!body.success) return json({ error: body.error.flatten() }, 400);

    const schema = await loadSchema(body.data.action === "schema" ? body.data.refresh : false);
    console.info("db-api", { action: body.data.action, table: "table" in body.data ? body.data.table : undefined, user: user.id });

    if (body.data.action === "schema") return json({ tables: schema.tables });

    const meta = assertTable(schema, body.data.table);

    if (body.data.action === "list") {
      if (body.data.orderBy) assertColumn(meta, body.data.orderBy);
      const where = buildWhere(meta, body.data.filters, body.data.search, body.data.searchColumns, user);
      const offset = (body.data.page - 1) * body.data.pageSize;
      const order = body.data.orderBy ? db`order by ${db(body.data.orderBy)} ${body.data.ascending ? db`asc` : db`desc`}` : db``;
      const relationSelects = body.data.includeRelations
        ? meta.foreignKeys
            .filter((fk) => schema.byName.has(fk.foreignTable))
            .map((fk) => db`(select row_to_json(rel) from ${tableRef(fk.foreignTable)} as rel where ${db("rel", fk.foreignColumn)} = ${db(meta.name, fk.column)} limit 1) as ${db(`${fk.column}_relation`)}`)
        : [];
      const [rows, totalRows] = await Promise.all([
        db`select ${db(meta.name)}.* ${relationSelects.length ? db`, ${commaJoin(relationSelects)}` : db``} from ${tableRef(meta.name)} ${where} ${order} limit ${body.data.pageSize} offset ${offset}`,
        db`select count(*)::int as count from ${tableRef(meta.name)} ${where}`,
      ]);
      return json({ data: rows, count: totalRows[0]?.count ?? 0 });
    }

    if (body.data.action === "getById") {
      const pk = primaryKeyFor(meta, body.data.primaryKey);
      const where = buildWhere(meta, [{ column: pk, operator: "eq", value: body.data.id }], undefined, [], user);
      const rows = await db`select * from ${tableRef(meta.name)} ${where} limit 1`;
      return json({ data: rows[0] ?? null });
    }

    if (body.data.action === "create") {
      assertWritable(meta);
      const payload = scrubPayload(meta, body.data.data, user);
      const columns = Object.keys(payload);
      if (!columns.length) return json({ error: "No writable columns supplied" }, 400);
      const rows = await db`insert into ${tableRef(meta.name)} ${db(payload, columns)} returning *`;
      return json({ data: rows[0] });
    }

    if (body.data.action === "update") {
      assertWritable(meta);
      const payload = scrubPayload(meta, body.data.data, user, true);
      const columns = Object.keys(payload);
      if (!columns.length) return json({ error: "No writable columns supplied" }, 400);
      const pkFilters = body.data.id === undefined ? [] : [{ column: primaryKeyFor(meta, body.data.primaryKey), operator: "eq" as const, value: body.data.id }];
      const where = buildWhere(meta, [...pkFilters, ...body.data.filters], undefined, [], user);
      const rows = await db`update ${tableRef(meta.name)} set ${db(payload, columns)} ${where} returning *`;
      return json({ data: rows });
    }

    if (body.data.action === "delete") {
      assertWritable(meta);
      if (!body.data.confirm) return json({ error: "Delete confirmation is required" }, 400);
      const pkFilters = body.data.id === undefined ? [] : [{ column: primaryKeyFor(meta, body.data.primaryKey), operator: "eq" as const, value: body.data.id }];
      const where = buildWhere(meta, [...pkFilters, ...body.data.filters], undefined, [], user);
      if (pkFilters.length === 0 && body.data.filters.length === 0) return json({ error: "Refusing to delete without a primary key or filter" }, 400);
      const rows = await db`delete from ${tableRef(meta.name)} ${where} returning *`;
      return json({ data: rows, count: rows.length });
    }

    return json({ error: "Unsupported action" }, 400);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("db-api error", error);
    return json({ error: error instanceof Error ? error.message : "Unexpected database error" }, 500);
  }
});