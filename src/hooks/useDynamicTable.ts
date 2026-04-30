import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRecord, deleteRecord, getAll, getSchema, updateRecord, type ListOptions, type Primitive, type RecordData } from "@/services/db";

export function useDatabaseSchema() {
  return useQuery({
    queryKey: ["db-schema"],
    queryFn: () => getSchema(),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useTableRows(tableName: string | undefined, options: ListOptions) {
  return useQuery({
    queryKey: ["table-rows", tableName, options],
    queryFn: () => getAll(tableName!, options),
    enabled: Boolean(tableName),
    staleTime: 20_000,
    retry: 1,
  });
}

export function useCrudMutations(tableName: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["table-rows", tableName] });

  const createMutation = useMutation({
    mutationFn: (data: RecordData) => createRecord(tableName!, data),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data, primaryKey }: { id: Primitive; data: RecordData; primaryKey?: string }) => updateRecord(tableName!, id, data, primaryKey),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, primaryKey }: { id: Primitive; primaryKey?: string }) => deleteRecord(tableName!, id, primaryKey),
    onSuccess: invalidate,
  });

  return { createMutation, updateMutation, deleteMutation };
}