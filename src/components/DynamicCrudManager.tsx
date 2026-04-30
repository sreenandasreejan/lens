import { useEffect, useMemo, useState } from "react";
import { Database, Edit3, KeyRound, Link2, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useCrudMutations, useDatabaseSchema, useTableRows } from "@/hooks/useDynamicTable";
import { displayValue, getPrimaryKey, getWritableColumns, inputTypeFor, isRequiredForCreate, validateRecordInput } from "@/utils/dbForms";
import type { ColumnMeta, Primitive, RecordData, TableMeta } from "@/services/db";

const PAGE_SIZE = 10;

export const DynamicCrudManager = () => {
  const [activeTable, setActiveTable] = useState<string>();
  const [search, setSearch] = useState("");
  const [orderBy, setOrderBy] = useState<string>();
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; row?: RecordData } | null>(null);
  const [deleteRow, setDeleteRow] = useState<RecordData | null>(null);

  const schemaQuery = useDatabaseSchema();
  const tables = schemaQuery.data ?? [];
  const table = tables.find((item) => item.name === activeTable);
  const primaryKey = table ? getPrimaryKey(table) : "id";
  const textColumns = useMemo(() => table?.columns.filter((column) => ["text", "character varying", "uuid"].includes(column.dataType)).map((column) => column.name) ?? [], [table]);
  const rowsQuery = useTableRows(activeTable, { page, pageSize: PAGE_SIZE, search, searchColumns: textColumns, orderBy: orderBy || primaryKey, ascending: false });
  const { createMutation, updateMutation, deleteMutation } = useCrudMutations(activeTable);

  useEffect(() => {
    if (!activeTable && tables.length) setActiveTable(tables[0].name);
  }, [activeTable, tables]);

  useEffect(() => {
    setPage(1);
  }, [activeTable, search, orderBy]);

  const totalPages = Math.max(1, Math.ceil((rowsQuery.data?.count ?? 0) / PAGE_SIZE));
  const visibleColumns = useMemo(() => table?.columns.slice(0, 7) ?? [], [table]);

  const refresh = async () => {
    await Promise.all([schemaQuery.refetch(), rowsQuery.refetch()]);
    toast.success("Data refreshed");
  };

  return (
    <section className="mb-12">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          <h2 className="font-display text-2xl font-bold">Data manager</h2>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={refresh} disabled={schemaQuery.isFetching || rowsQuery.isFetching}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <aside className="rounded-2xl border border-border/60 bg-gradient-card p-4 h-fit">
          <p className="text-xs font-semibold text-muted-foreground mb-3">Tables</p>
          {schemaQuery.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)}</div>
          ) : schemaQuery.isError ? (
            <p className="text-sm text-destructive">Could not load schema.</p>
          ) : tables.length === 0 ? (
            <p className="text-sm text-muted-foreground">No public tables found.</p>
          ) : (
            <div className="space-y-2">
              {tables.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setActiveTable(item.name)}
                  className={`w-full text-left p-3 rounded-xl border transition-smooth ${item.name === activeTable ? "border-primary bg-primary/10" : "border-border/60 hover:border-primary/50"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">{item.name}</span>
                    <Badge variant={item.canWrite ? "default" : "secondary"}>{item.canWrite ? "CRUD" : "read"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{item.columns.length} columns · {item.foreignKeys.length} relations</p>
                </button>
              ))}
            </div>
          )}
        </aside>

        <div className="space-y-5 min-w-0">
          {table && <SchemaPanel table={table} />}

          <div className="rounded-2xl border border-border/60 bg-gradient-card overflow-hidden">
            <div className="p-4 border-b border-border/60 flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-3 flex-1">
                <div className="relative min-w-0 w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search records…" className="pl-9 bg-input border-border" />
                </div>
                <Select value={orderBy} onValueChange={setOrderBy} disabled={!table}>
                  <SelectTrigger className="w-full sm:w-52 bg-input border-border"><SelectValue placeholder="Sort column" /></SelectTrigger>
                  <SelectContent>
                    {table?.columns.map((column) => <SelectItem key={column.name} value={column.name}>{column.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" variant="hero" size="sm" onClick={() => setModal({ mode: "create" })} disabled={!table?.canWrite}>
                <Plus className="w-4 h-4" /> Add record
              </Button>
            </div>

            {rowsQuery.isLoading ? (
              <div className="p-5 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)}</div>
            ) : rowsQuery.isError ? (
              <div className="p-8 text-center text-destructive text-sm">Failed to load records. Check credentials, RLS, and table permissions.</div>
            ) : (rowsQuery.data?.data.length ?? 0) === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">No records found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>{visibleColumns.map((column) => <TableHead key={column.name}>{column.name}</TableHead>)}<TableHead className="text-right">Actions</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {rowsQuery.data?.data.map((row, index) => (
                    <TableRow key={String(row[primaryKey] ?? index)}>
                      {visibleColumns.map((column) => <TableCell key={column.name} className="max-w-56 truncate">{displayValue(row[column.name])}</TableCell>)}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="ghost" size="icon" onClick={() => setModal({ mode: "edit", row })} disabled={!table?.canWrite} aria-label="Edit record"><Edit3 className="w-4 h-4" /></Button>
                          <Button type="button" variant="ghost" size="icon" onClick={() => setDeleteRow(row)} disabled={!table?.canWrite} className="hover:text-destructive hover:bg-destructive/10" aria-label="Delete record"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="p-4 border-t border-border/60 flex items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>{rowsQuery.data?.count ?? 0} records</span>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Prev</Button>
                <span>{page} / {totalPages}</span>
                <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {table && modal && (
        <RecordDialog
          table={table}
          mode={modal.mode}
          row={modal.row}
          open={Boolean(modal)}
          saving={createMutation.isPending || updateMutation.isPending}
          onOpenChange={(open) => !open && setModal(null)}
          onSubmit={async (data) => {
            try {
              if (modal.mode === "create") await createMutation.mutateAsync(data);
              else await updateMutation.mutateAsync({ id: modal.row?.[primaryKey] as Primitive, primaryKey, data });
              toast.success(modal.mode === "create" ? "Record created" : "Record updated");
              setModal(null);
            } catch (error) {
              console.error(error);
              toast.error(error instanceof Error ? error.message : "Save failed");
            }
          }}
        />
      )}

      {table && deleteRow && (
        <DeleteDialog
          table={table}
          row={deleteRow}
          open={Boolean(deleteRow)}
          deleting={deleteMutation.isPending}
          onOpenChange={(open) => !open && setDeleteRow(null)}
          onConfirm={async () => {
            try {
              await deleteMutation.mutateAsync({ id: deleteRow[primaryKey] as Primitive, primaryKey });
              toast.success("Record deleted");
              setDeleteRow(null);
            } catch (error) {
              console.error(error);
              toast.error(error instanceof Error ? error.message : "Delete failed");
            }
          }}
        />
      )}
    </section>
  );
};

const SchemaPanel = ({ table }: { table: TableMeta }) => (
  <div className="rounded-2xl border border-border/60 bg-gradient-card p-5">
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div>
        <h3 className="font-display text-xl font-bold">{table.name}</h3>
        <p className="text-sm text-muted-foreground">{table.writeMode === "locked" ? "Read-only until allowlisted" : table.writeMode === "user_scoped" ? "User-scoped writes" : "Allowlisted writes"}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {table.primaryKeys.map((key) => <Badge key={key} variant="outline"><KeyRound className="w-3 h-3 mr-1" />{key}</Badge>)}
        {table.foreignKeys.map((fk) => <Badge key={fk.constraintName} variant="secondary"><Link2 className="w-3 h-3 mr-1" />{fk.column} → {fk.foreignTable}</Badge>)}
      </div>
    </div>
    <div className="flex flex-wrap gap-2">
      {table.columns.map((column) => <Badge key={column.name} variant={column.isPrimaryKey ? "default" : "secondary"}>{column.name}: {column.dataType}{column.nullable ? "?" : ""}</Badge>)}
    </div>
  </div>
);

const RecordDialog = ({ table, mode, row, open, saving, onOpenChange, onSubmit }: {
  table: TableMeta; mode: "create" | "edit"; row?: RecordData; open: boolean; saving: boolean;
  onOpenChange: (open: boolean) => void; onSubmit: (data: RecordData) => Promise<void>;
}) => {
  const columns = getWritableColumns(table);
  const [values, setValues] = useState<Record<string, string | boolean>>(() => {
    const initial: Record<string, string | boolean> = {};
    columns.forEach((column) => {
      initial[column.name] = typeof row?.[column.name] === "boolean" ? Boolean(row?.[column.name]) : String(row?.[column.name] ?? "");
    });
    return initial;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = validateRecordInput(columns, values, mode === "edit" ? "update" : "create");
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    await onSubmit(result.data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-background">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add" : "Edit"} {table.name}</DialogTitle>
          <DialogDescription>{mode === "create" ? "Create a new row with validated values." : "Update writable fields for this row."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {columns.map((column) => <DynamicField key={column.name} column={column} value={values[column.name]} error={errors[column.name]} onChange={(value) => setValues((current) => ({ ...current, [column.name]: value }))} />)}
          {columns.length === 0 && <p className="text-sm text-muted-foreground">No writable columns available.</p>}
          <DialogFooter><Button type="submit" variant="hero" disabled={saving || columns.length === 0}>{saving ? "Saving…" : "Save"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const DynamicField = ({ column, value, error, onChange }: { column: ColumnMeta; value: string | boolean; error?: string; onChange: (value: string | boolean) => void }) => {
  const type = inputTypeFor(column);
  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block">{column.name}{isRequiredForCreate(column) && <span className="text-destructive"> *</span>}</label>
      {column.dataType === "text" && column.name.includes("description") ? (
        <Textarea value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} className="bg-input border-border" />
      ) : type === "checkbox" ? (
        <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} /> Enabled</label>
      ) : (
        <Input type={type} value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} className="bg-input border-border" />
      )}
      {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
    </div>
  );
};

const DeleteDialog = ({ table, row, open, deleting, onOpenChange, onConfirm }: { table: TableMeta; row: RecordData; open: boolean; deleting: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => Promise<void> }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="border-border bg-background">
      <DialogHeader>
        <DialogTitle>Delete record?</DialogTitle>
        <DialogDescription>This permanently deletes row {displayValue(row[getPrimaryKey(table)])} from {table.name}.</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button type="button" variant="destructive" onClick={onConfirm} disabled={deleting}>{deleting ? "Deleting…" : "Delete"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);