import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ApiError } from "./api/client";

export type Loadable<T> = { data: T | null; error: ApiError | null; loading: boolean; refreshing: boolean; reload: () => Promise<void>; setData: (fn: (d: T | null) => T | null) => void };

/** Loads when the screen gains focus; keeps the last data while refreshing. */
export function useApi<T>(load: () => Promise<T>): Loadable<T> {
  const [data, setDataState] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadRef = useRef(load);
  const has = useRef(false);
  useEffect(() => {
    loadRef.current = load;
  });

  const reload = useCallback(async () => {
    if (has.current) setRefreshing(true);
    try {
      const d = await loadRef.current();
      has.current = true;
      setDataState(d);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError(0, "unknown", "Something went wrong. Try again in a moment."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const setData = useCallback((fn: (d: T | null) => T | null) => setDataState((d) => fn(d)), []);
  return { data, error, loading, refreshing, reload, setData };
}
