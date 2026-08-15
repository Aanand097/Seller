/**
 * Tiny localStorage cache for public catalog queries.
 *
 * Products/categories rarely change, so on a reload we hydrate them from
 * localStorage immediately (list renders with zero network wait) and refresh
 * in the background.
 */
import type { QueryClient } from "@tanstack/react-query";

const KEY = "ngl:catalog-cache:v1";
const MAX_AGE = 24 * 60 * 60_000;

const PERSISTED: string[] = ['["products","active"]', '["categories"]'];

type Entry = { key: string; data: unknown; ts: number };

export function hydrateCatalogCache(qc: QueryClient) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return;
    const entries: Entry[] = JSON.parse(raw);
    for (const e of entries) {
      if (!e || Date.now() - e.ts > MAX_AGE) continue;
      const key = JSON.parse(e.key);
      if (qc.getQueryData(key) === undefined) qc.setQueryData(key, e.data);
    }
  } catch {
    /* corrupt cache — ignore */
  }
}

export function persistCatalogCache(qc: QueryClient) {
  if (typeof window === "undefined") return () => {};
  let timer: ReturnType<typeof setTimeout> | undefined;
  const save = () => {
    try {
      const entries: Entry[] = [];
      for (const k of PERSISTED) {
        const data = qc.getQueryData(JSON.parse(k));
        if (data !== undefined) entries.push({ key: k, data, ts: Date.now() });
      }
      window.localStorage.setItem(KEY, JSON.stringify(entries));
    } catch {
      /* quota or serialization issue — non-fatal */
    }
  };
  const unsub = qc.getQueryCache().subscribe(() => {
    clearTimeout(timer);
    timer = setTimeout(save, 400);
  });
  return () => {
    clearTimeout(timer);
    unsub();
  };
}