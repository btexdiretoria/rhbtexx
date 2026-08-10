import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DreParsed, DreRow } from "@/lib/dreParser";

export interface DreCategoryMap {
  id: string;
  category_name: string;
  group_name: string;
  sort_order: number | null;
}

export interface DreDataset {
  id: string;
  kind: "dre" | "caixa";
  file_name: string | null;
  months: string[];
  rows_data: DreRow[];
  updated_at: string;
}

const db = supabase as any;

export function useDreCategoryMap() {
  return useQuery({
    queryKey: ["dre_category_map"],
    queryFn: async () => {
      const { data, error } = await db
        .from("dre_category_map")
        .select("*")
        .order("group_name")
        .order("category_name");
      if (error) throw error;
      return (data ?? []) as DreCategoryMap[];
    },
  });
}

export function useSaveDreCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id?: string; category_name: string; group_name: string }) => {
      if (input.id) {
        const { error } = await db
          .from("dre_category_map")
          .update({ category_name: input.category_name.trim(), group_name: input.group_name.trim() })
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await db
          .from("dre_category_map")
          .insert({ category_name: input.category_name.trim(), group_name: input.group_name.trim() });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dre_category_map"] }),
  });
}

export function useSaveDreCategoriesBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { category_name: string; group_name: string }[]) => {
      if (!items.length) return;
      const { error } = await db
        .from("dre_category_map")
        .upsert(
          items.map((i) => ({ category_name: i.category_name.trim(), group_name: i.group_name.trim() })),
          { onConflict: "category_name" }
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dre_category_map"] }),
  });
}

export function useDeleteDreCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("dre_category_map").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dre_category_map"] }),
  });
}

export function useDreDatasets() {
  return useQuery({
    queryKey: ["dre_datasets"],
    queryFn: async () => {
      const { data, error } = await db.from("dre_datasets").select("*");
      if (error) throw error;
      return (data ?? []) as DreDataset[];
    },
  });
}

export function useSaveDreDataset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ kind, parsed }: { kind: "dre" | "caixa"; parsed: DreParsed }) => {
      const { error } = await db.from("dre_datasets").upsert(
        {
          kind,
          file_name: parsed.fileName,
          months: parsed.months,
          rows_data: parsed.rows,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "kind" }
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dre_datasets"] }),
  });
}

export function useClearDreDataset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (kind: "dre" | "caixa") => {
      const { error } = await db.from("dre_datasets").delete().eq("kind", kind);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dre_datasets"] }),
  });
}
