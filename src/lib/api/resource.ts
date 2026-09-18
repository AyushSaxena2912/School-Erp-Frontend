/**
 * Typed helpers for Frappe's resource CRUD route.
 *
 * `/api/resource/<DocType>` is permission-checked, filtered, sorted and
 * paginated by the framework. Use it for anything CRUD-shaped; only reach for a
 * method endpoint when the operation has a name beyond create/read/update/delete.
 */

import { http, toQueryString } from "./client";
import type { DocTypeName } from "@/types/generated/doctypes";

/** Frappe filter operators. */
export type FilterOperator =
  | "="
  | "!="
  | ">"
  | "<"
  | ">="
  | "<="
  | "like"
  | "not like"
  | "in"
  | "not in"
  | "is"
  | "between";

export type Filter = [field: string, operator: FilterOperator, value: unknown];

export interface ListParams<T> {
  /** Which columns to return. Omitting this returns only `name`. */
  fields?: (keyof T | "name")[];
  filters?: Filter[];
  orderBy?: string;
  limitStart?: number;
  limitPageLength?: number;
}

function encode<T>(params: ListParams<T>): Record<string, unknown> {
  return {
    fields: params.fields ? (params.fields as string[]) : undefined,
    filters: params.filters?.length ? params.filters : undefined,
    order_by: params.orderBy,
    limit_start: params.limitStart,
    limit_page_length: params.limitPageLength,
  };
}

/** Path-encode a DocType name — several contain spaces. */
function path(doctype: DocTypeName, name?: string): string {
  const base = `/api/resource/${encodeURIComponent(doctype)}`;
  return name ? `${base}/${encodeURIComponent(name)}` : base;
}

export function list<T>(doctype: DocTypeName, params: ListParams<T> = {}): Promise<T[]> {
  return http.get<T[]>(`${path(doctype)}${toQueryString(encode(params))}`);
}

/**
 * Total matching row count.
 *
 * Deliberately not `frappe.client.get_count` — that generic RPC method is
 * blocked by the whitelist on some deployed Frappe versions (older releases
 * reject it outright, regardless of auth). `/api/resource` is the one count
 * path the framework's own REST routing always serves, since it calls the
 * underlying query builder directly rather than through the whitelist gate.
 */
export async function count(doctype: DocTypeName, filters?: Filter[]): Promise<number> {
  const query = toQueryString({
    fields: [{ COUNT: "*" }],
    filters: filters?.length ? filters : undefined,
  });
  const [row] = await http.get<[{ "COUNT(*)": number }]>(`${path(doctype)}${query}`);
  return row?.["COUNT(*)"] ?? 0;
}

/** A page of rows plus the total, for paginated tables. */
export async function listPage<T>(
  doctype: DocTypeName,
  params: ListParams<T> = {},
): Promise<{ items: T[]; totalCount: number }> {
  const [items, totalCount] = await Promise.all([
    list<T>(doctype, params),
    count(doctype, params.filters),
  ]);
  return { items, totalCount };
}

export function get<T>(doctype: DocTypeName, name: string): Promise<T> {
  return http.get<T>(path(doctype, name));
}

export function create<T>(doctype: DocTypeName, values: Partial<T>): Promise<T> {
  return http.post<T>(path(doctype), values);
}

export function update<T>(doctype: DocTypeName, name: string, values: Partial<T>): Promise<T> {
  return http.put<T>(path(doctype, name), values);
}

export function remove(doctype: DocTypeName, name: string): Promise<void> {
  return http.delete<void>(path(doctype, name));
}

/**
 * Delete several documents.
 *
 * There is no bulk endpoint on purpose: each delete is permission-checked
 * individually. Sequential rather than parallel so a partial failure is
 * reported against a known-good prefix.
 */
export async function removeMany(
  doctype: DocTypeName,
  names: string[],
): Promise<{ deleted: string[]; failed: { name: string; error: unknown }[] }> {
  const deleted: string[] = [];
  const failed: { name: string; error: unknown }[] = [];

  for (const name of names) {
    try {
      await remove(doctype, name);
      deleted.push(name);
    } catch (error) {
      failed.push({ name, error });
    }
  }

  return { deleted, failed };
}
