"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount } from "@/components/account-provider";
import { cloud, errorText } from "./client";
// Values originate in the existing lesson components and are bounded before persistence.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StudyState = Record<string, any>;
export function useStudyState() {
  const { user, profile } = useAccount();
  const [state, setState] = useState<StudyState>({}),
    [storage, setStorage] = useState("loading"),
    [error, setError] = useState(""),
    [pending, setPending] = useState(0);
  const current = useRef<StudyState>({}),
    revisions = useRef<Record<string, number>>({}),
    dirtyKeys = useRef(new Set<string>()),
    locks = useRef(new Set<string>()),
    epoch = useRef(0);
  const load = useCallback(async () => {
    const generation = ++epoch.current;
    try {
      let next: StudyState = {};
      const versions: Record<string, number> = {};
      if (cloud && user) {
        // Page through all entries: the vocabulary alone exceeds PostgREST's default 1000 rows.
        for (let start = 0; ; start += 500) {
          const r = await cloud
            .from("study_items")
            .select("key,value,revision")
            .eq("user_id", user.id)
            .order("key")
            .range(start, start + 499);
          if (r.error) throw r.error;
          for (const row of r.data) {
            next[row.key] = row.value;
            versions[row.key] = row.revision;
          }
          if (r.data.length < 500) break;
        }
        const m = await cloud.from("lesson_materials").select("key,value");
        if (m.error) throw m.error;
        for (const row of m.data) next[row.key] = row.value;
      } else {
        next = JSON.parse(
          localStorage.getItem("bazuka-ielts-state-v1") || "{}",
        );
      }
      if (generation !== epoch.current || locks.current.size) return;
      for (const key of dirtyKeys.current) {
        if (key in current.current) next[key] = current.current[key];
        else delete next[key];
        versions[key] = revisions.current[key] || 0;
      }
      current.current = next;
      revisions.current = versions;
      setState(next);
      setStorage("ready");
      setError("");
    } catch (e) {
      if (generation !== epoch.current) return;
      setError(errorText(e));
      setStorage((s) => (s === "loading" ? "error" : s));
    }
  }, [user]);
  useEffect(() => {
    const dirty = (event: Event) => {
      const { key, value } = (
        event as CustomEvent<{ key: string; value: boolean }>
      ).detail;
      if (value) dirtyKeys.current.add(key);
      else dirtyKeys.current.delete(key);
    };
    window.addEventListener("bazuka-draft", dirty);
    return () => window.removeEventListener("bazuka-draft", dirty);
  }, []);
  useEffect(() => {
    // Initial hydration from the external account store.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const refresh = () => {
      if (!locks.current.size && document.visibilityState === "visible")
        void load();
    };
    window.addEventListener("focus", refresh);
    const timer = setInterval(refresh, 30000);
    return () => {
      // Invalidate pending reads on cleanup, not a DOM ref.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      ++epoch.current;
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [load]);
  async function persist(key: string, value: unknown) {
    if (storage !== "ready" || locks.current.has(key)) return false;
    if (
      !/^(lesson|word|answer|note|custom|check|last):/.test(key) ||
      key.length >= 250 ||
      JSON.stringify(value).length > 100000
    ) {
      setError("Слишком большой или некорректный ответ.");
      return false;
    }
    locks.current.add(key);
    ++epoch.current;
    setPending((n) => n + 1);
    try {
      if (cloud && user) {
        if (key.startsWith("note:teacher-")) {
          if (profile?.role !== "teacher")
            throw Error("Только преподаватель может менять материал.");
          const r = await cloud.from("lesson_materials").upsert({
            key,
            value,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          });
          if (r.error) throw r.error;
        } else {
          const r = await cloud.rpc("save_study_item", {
            item_key: key,
            item_value: value,
            expected_revision: revisions.current[key] || 0,
          });
          if (r.error) throw r.error;
          revisions.current[key] = r.data;
        }
      } else
        localStorage.setItem(
          "bazuka-ielts-state-v1",
          JSON.stringify({ ...current.current, [key]: value }),
        );
      current.current = { ...current.current, [key]: value };
      setState(current.current);
      setError("");
      return true;
    } catch (e) {
      setError(errorText(e));
      return false;
    } finally {
      locks.current.delete(key);
      setPending((n) => n - 1);
    }
  }
  return { state, storage, error, setError, busy: pending > 0, load, persist };
}
