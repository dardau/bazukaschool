"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { cloud, errorText } from "@/lib/cloud/client";
export type Profile = {
  id: string;
  display_name: string;
  role: "student" | "teacher";
};
const Account = createContext<{
  user: User | null;
  profile: Profile | null;
  teacherId: string | null;
  refresh: () => Promise<void>;
}>({ user: null, profile: null, teacherId: null, refresh: async () => {} });
export const useAccount = () => useContext(Account);
export default function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [profile, setProfile] = useState<Profile | null>(null),
    [teacherId, setTeacherId] = useState<string | null>(null),
    [loading, setLoading] = useState(!!cloud),
    [error, setError] = useState(""),
    [recovery, setRecovery] = useState(false);
  const generation = useRef(0),
    accountId = useRef<string | null>(null);
  async function refresh() {
    if (!cloud) return;
    const version = ++generation.current;
    try {
      const {
        data: { user: current },
        error: e,
      } = await cloud.auth.getUser();
      if (version !== generation.current) return;
      if (e) throw e;
      setUser(current);
      if (!current) {
        setProfile(null);
        setTeacherId(null);
        return;
      }
      const p = await cloud
        .from("profiles")
        .select("*")
        .eq("id", current.id)
        .single();
      if (p.error) throw p.error;
      const enrollment = await cloud
        .from("enrollments")
        .select("teacher_id")
        .eq("student_id", current.id)
        .maybeSingle();
      if (enrollment.error) throw enrollment.error;
      if (version !== generation.current) return;
      setProfile(p.data);
      setTeacherId(enrollment.data?.teacher_id || null);
      setError("");
    } catch (e) {
      if (version !== generation.current) return;
      setProfile(null);
      setTeacherId(null);
      setError(errorText(e));
    } finally {
      if (version === generation.current) setLoading(false);
    }
  }
  useEffect(() => {
    if (!cloud) return;
    let active = true;
    const {
      data: { subscription },
    } = cloud.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      if (event === "SIGNED_OUT") {
        ++generation.current;
        accountId.current = null;
        setUser(null);
        setProfile(null);
        setTeacherId(null);
        setLoading(false);
      } else if (event !== "TOKEN_REFRESHED") {
        const changed = accountId.current !== (session?.user.id || null);
        accountId.current = session?.user.id || null;
        setUser(session?.user || null);
        if (session) {
          if (changed) {
            setProfile(null);
            setTeacherId(null);
            setLoading(true);
          }
          setTimeout(() => {
            if (active) void refresh();
          }, 0);
        } else setLoading(false);
      }
    });
    return () => {
      active = false;
      // Invalidate pending auth reads after this subscription ends.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      ++generation.current;
      subscription.unsubscribe();
    };
  }, []);
  if (loading)
    return (
      <div className="account-gate">
        <h1>BazukaSchool</h1>
        <p role="status">Открываем ваше пространство…</p>
      </div>
    );
  if (cloud && (!user || recovery))
    return (
      <AuthForm
        recovery={recovery}
        done={() => {
          setRecovery(false);
          void refresh();
        }}
      />
    );
  if (cloud && !profile)
    return (
      <div className="account-gate">
        <h1>Не удалось открыть кабинет</h1>
        <p role="alert">{error}</p>
        <button onClick={() => void refresh()}>Повторить</button>
        <button onClick={() => void cloud?.auth.signOut()}>Выйти</button>
      </div>
    );
  return (
    <Account.Provider value={{ user, profile, teacherId, refresh }}>
      <div key={user?.id || "local"}>{children}</div>
    </Account.Provider>
  );
}
function AuthForm({ recovery, done }: { recovery: boolean; done: () => void }) {
  const [mode, setMode] = useState<"login" | "register" | "reset">("login"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  return (
    <main className="account-gate">
      <span className="eyebrow">BAZUKASCHOOL · IELTS</span>
      <h1>
        {recovery
          ? "Новый пароль"
          : mode === "register"
            ? "Начнём учиться вместе"
            : mode === "reset"
              ? "Восстановить доступ"
              : "Рады видеть тебя снова"}
      </h1>
      <p>Твои уроки, слова и ответы — в одном личном кабинете.</p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!cloud) return;
          setBusy(true);
          setError("");
          setNotice("");
          try {
            if (recovery) {
              const r = await cloud.auth.updateUser({ password });
              if (r.error) throw r.error;
              done();
            } else if (mode === "register") {
              const r = await cloud.auth.signUp({
                email: email.trim(),
                password,
                options: {
                  data: { display_name: name.trim() },
                  emailRedirectTo: window.location.origin,
                },
              });
              if (r.error) throw r.error;
              setNotice(
                "Проверьте почту: если регистрация доступна, придёт письмо для подтверждения. Уже есть аккаунт? Войдите.",
              );
            } else if (mode === "reset") {
              const r = await cloud.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: window.location.origin,
              });
              if (r.error) throw r.error;
              setNotice(
                "Если аккаунт существует, на почту придёт ссылка для восстановления.",
              );
            } else {
              const r = await cloud.auth.signInWithPassword({
                email: email.trim(),
                password,
              });
              if (r.error) throw r.error;
            }
          } catch (e) {
            setError(errorText(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        {mode === "register" && !recovery && (
          <label>
            Как тебя зовут
            <input
              required
              maxLength={80}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
        )}
        {!recovery && (
          <label>
            Электронная почта
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        )}
        {(recovery || mode !== "reset") && (
          <label>
            Пароль
            <input
              required
              type="password"
              minLength={mode === "login" && !recovery ? 1 : 10}
              maxLength={128}
              autoComplete={
                recovery || mode === "register"
                  ? "new-password"
                  : "current-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {(recovery || mode === "register") && (
              <small>Не менее 10 символов.</small>
            )}
          </label>
        )}
        {mode === "register" && !recovery && (
          <p className="muted">
            Ответы и аудио сохраняются в аккаунте. Преподаватель увидит только
            отправленные ему работы и показатели прогресса после подключения по
            приглашению. Личные заметки остаются твоими.
          </p>
        )}
        <button className="primary" disabled={busy}>
          {busy
            ? "Подождите…"
            : recovery
              ? "Сохранить пароль"
              : mode === "login"
                ? "Войти"
                : mode === "register"
                  ? "Создать аккаунт"
                  : "Отправить ссылку"}
        </button>
      </form>
      {error && (
        <p role="alert" className="record-error">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {!recovery && (
        <div className="account-links">
          {(["login", "register", "reset"] as const)
            .filter((x) => x !== mode)
            .map((x) => (
              <button
                key={x}
                onClick={() => {
                  setMode(x);
                  setError("");
                  setNotice("");
                }}
              >
                {x === "login"
                  ? "Уже есть аккаунт"
                  : x === "register"
                    ? "Регистрация"
                    : "Забыли пароль?"}
              </button>
            ))}
        </div>
      )}
    </main>
  );
}
