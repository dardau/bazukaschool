"use client";
import { LocalSpeakingRecorder } from "./speaking-recorder";
import LegacyImport from "./legacy-import";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount, type Profile } from "./account-provider";
import { cloud, errorText } from "@/lib/cloud/client";
import { submitWork } from "@/lib/cloud/submissions";
export function SubmitAnswer({
  assignmentKey,
  title,
  text,
}: {
  assignmentKey: string;
  title: string;
  text: string;
}) {
  const { user, profile, teacherId } = useAccount();
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const attempt = useRef<{ body: string; id: string } | null>(null);
  if (!cloud || !user || profile?.role === "teacher") return null;
  return (
    <div className="submission-action">
      <button
        className="secondary"
        disabled={busy || !text.trim() || !teacherId}
        onClick={async () => {
          setBusy(true);
          setNotice("");
          try {
            if (!attempt.current || attempt.current.body !== text)
              attempt.current = { body: text, id: crypto.randomUUID() };
            await submitWork({
              id: attempt.current.id,
              studentId: user.id,
              teacherId: teacherId!,
              assignmentKey,
              title,
              body: text,
            });
            setNotice(
              "Отправлено преподавателю. Статус и фидбек — в «Моём кабинете».",
            );
          } catch (e) {
            setNotice(errorText(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Отправляю…" : "Отправить на проверку"}
      </button>
      <small role="status">
        {notice ||
          (!teacherId
            ? "Сначала подключись к преподавателю в «Моём кабинете»."
            : "Отправится текущий текст. Черновик можно редактировать отдельно.")}
      </small>
    </div>
  );
}
type Review = {
  feedback: string;
  status: "reviewed" | "revise";
  updated_at: string;
};
type Submission = {
  id: string;
  student_id: string;
  title: string;
  assignment_key: string;
  body: string;
  audio_path: string | null;
  created_at: string;
  reviews: Review | null;
};
type Progress = {
  student_id: string;
  completed: number;
  words: number;
  last_activity: string | null;
};
export default function CloudWorkspace() {
  const { user, profile, teacherId, refresh } = useAccount();
  const teacher = profile?.role === "teacher";
  const [rows, setRows] = useState<Submission[]>([]),
    [students, setStudents] = useState<Profile[]>([]),
    [progress, setProgress] = useState<Progress[]>([]),
    [invite, setInvite] = useState(""),
    [code, setCode] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [filter, setFilter] = useState("all"),
    [status, setStatus] = useState("all"),
    [more, setMore] = useState(false),
    [limit, setLimit] = useState(50);
  const load = useCallback(async () => {
    if (!cloud || !user) {
      setLoading(false);
      return;
    }
    try {
      let query = cloud
        .from("submissions")
        .select("*,reviews(*)")
        .order("created_at", { ascending: false })
        .limit(limit + 1);
      query = teacher
        ? query.eq("teacher_id", user.id)
        : query.eq("student_id", user.id);
      const r = await query;
      if (r.error) throw r.error;
      setMore(r.data.length > limit);
      setRows(r.data.slice(0, limit) as Submission[]);
      if (teacher) {
        const p = await cloud
          .from("profiles")
          .select("*")
          .eq("role", "student");
        if (p.error) throw p.error;
        setStudents(p.data);
        const g = await cloud.rpc("class_progress");
        if (g.error) throw g.error;
        setProgress(g.data);
      }
      setError("");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, [user, teacher, limit]);
  useEffect(() => {
    // Initial hydration from the external account store.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 20000);
    return () => clearInterval(timer);
  }, [load]);
  if (!cloud)
    return (
      <section className="panel">
        <span className="eyebrow">ЛИЧНЫЙ КАБИНЕТ</span>
        <h1>Онлайн-кабинеты готовятся к запуску</h1>
        <p>
          Здесь появятся вход, синхронизация и проверка работ. Пока используется
          прежнее сохранение в этом браузере. Оно не отправляет ответы
          преподавателю.
        </p>
        <p>
          Для запуска владельцу школы нужно подключить Supabase и назначить
          преподавателя.
        </p>
      </section>
    );
  return (
    <section className="cloud-workspace">
      <LegacyImport />
      {teacher && (
        <details className="panel">
          <summary>Прежний локальный аудиоархив</summary>
          <p>
            Общие записи старой версии только с этого устройства. Они не
            отправляются в облако. При необходимости скачайте нужную запись и
            отправьте её из аккаунта соответствующего ученика.
          </p>
          <LocalSpeakingRecorder questionId="legacy-archive" />
        </details>
      )}
      <header className="panel">
        <span className="eyebrow">
          {teacher ? "КАБИНЕТ ПРЕПОДАВАТЕЛЯ" : "МОЙ КАБИНЕТ"}
        </span>
        <h1>{profile?.display_name}</h1>
        <p>{user?.email}</p>
        <div className="account-links">
          <button className="secondary" onClick={() => void load()}>
            Обновить работы
          </button>
          <button
            className="secondary"
            onClick={async () => {
              if (
                !window.confirm(
                  "Выйти из аккаунта? Сохраните незавершённые ответы и скачайте ещё не отправленное аудио.",
                )
              )
                return;
              const r = await cloud!.auth.signOut();
              if (r.error) setError(errorText(r.error));
            }}
          >
            Выйти
          </button>
        </div>
        <p className="muted">
          {teacher
            ? "Новые работы появляются здесь автоматически. Фидбек виден ученику в его аккаунте."
            : "Личные черновики доступны только тебе. Преподаватель получает отправленные ответы и показатели прогресса."}
        </p>
      </header>
      {error && (
        <p role="alert" className="error-banner">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {teacher ? (
        <section className="panel">
          <h2>Мои ученики · {students.length}</h2>
          <p>
            Создай отдельное одноразовое приглашение для каждого ученика. Оно
            действует 7 дней.
          </p>
          <button
            className="primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const r = await cloud!
                  .from("invitations")
                  .insert({ teacher_id: user!.id })
                  .select("code")
                  .single();
                if (r.error) throw r.error;
                setInvite(r.data.code);
              } catch (e) {
                setError(errorText(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            Создать приглашение
          </button>
          {invite && (
            <label>
              Код для ученика
              <input
                readOnly
                value={invite}
                onFocus={(e) => e.target.select()}
              />
            </label>
          )}
          <div className="student-roster">
            {students.map((s) => {
              const p = progress.find((p) => p.student_id === s.id);
              return (
                <article key={s.id}>
                  <b>{s.display_name}</b>
                  <span>
                    {p?.completed || 0} разделов · {p?.words || 0} слов
                  </span>
                  <small>
                    {p?.last_activity
                      ? "Занимался: " +
                        new Date(p.last_activity).toLocaleString("ru")
                      : "Пока нет прогресса"}
                  </small>
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="panel">
          <h2>
            {teacherId
              ? "Преподаватель подключён"
              : "Присоединиться к преподавателю"}
          </h2>
          {teacherId ? (
            <p>
              Отправляй ответы кнопкой «На проверку». Все твои попытки и фидбек
              останутся ниже.
            </p>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                  const r = await cloud!.rpc("join_class", {
                    invite: code.trim(),
                  });
                  if (r.error) throw r.error;
                  await refresh();
                  setNotice(
                    "Вы подключены к преподавателю. Можно отправлять работы.",
                  );
                } catch {
                  setError(
                    "Не удалось принять приглашение. Проверьте код: он одноразовый и действует 7 дней.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                Код приглашения
                <input
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Код от преподавателя"
                />
              </label>
              <button className="primary" disabled={busy}>
                Подключиться
              </button>
            </form>
          )}
        </section>
      )}
      <section className="panel">
        <h2>{teacher ? "Работы на проверку" : "Мои отправленные работы"}</h2>
        <div className="account-links">
          {teacher && (
            <select
              aria-label="Ученик"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Все ученики</option>
              {students.map((s) => (
                <option value={s.id} key={s.id}>
                  {s.display_name}
                </option>
              ))}
            </select>
          )}
          <select
            aria-label="Статус работы"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">Все статусы</option>
            <option value="pending">На проверке</option>
            <option value="reviewed">Проверено</option>
            <option value="revise">Доработать</option>
          </select>
        </div>
        <p className="muted">
          Обновление каждые 20 секунд.{" "}
          {more
            ? "Показаны последние " +
              limit +
              " работ; загрузите ещё для поиска в истории."
            : ""}
        </p>
        {loading ? (
          <p role="status">Загрузка…</p>
        ) : !rows.length ? (
          <p>
            Работ пока нет. Отправленные письменные ответы и аудио появятся
            здесь.
          </p>
        ) : (
          rows
            .filter(
              (r) =>
                (filter === "all" || r.student_id === filter) &&
                (status === "all" ||
                  (r.reviews?.status || "pending") === status),
            )
            .map((r) => (
              <WorkCard
                key={r.id}
                row={r}
                teacher={teacher}
                name={students.find((s) => s.id === r.student_id)?.display_name}
                reload={load}
              />
            ))
        )}
        {more && (
          <button className="secondary" onClick={() => setLimit((n) => n + 50)}>
            Загрузить ещё 50
          </button>
        )}
      </section>
    </section>
  );
}
function WorkCard({
  row,
  teacher,
  name,
  reload,
}: {
  row: Submission;
  teacher: boolean;
  name?: string;
  reload: () => Promise<void>;
}) {
  const { user } = useAccount();
  const [feedback, setFeedback] = useState(row.reviews?.feedback || ""),
    [status, setStatus] = useState<"reviewed" | "revise">(
      row.reviews?.status || "reviewed",
    ),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [url, setUrl] = useState("");
  return (
    <article className="cloud-work-card">
      <div className="recording-meta">
        <b>{name || "Мой ответ"}</b>
        <span>{new Date(row.created_at).toLocaleString("ru")}</span>
        <span className="student-chip">
          {!row.reviews
            ? "На проверке"
            : row.reviews.status === "revise"
              ? "Доработать"
              : "Проверено"}
        </span>
      </div>
      <h3>{row.title}</h3>
      {row.body && <p className="preserve-lines">{row.body}</p>}
      {row.audio_path && (
        <div>
          {url ? (
            <audio
              controls
              src={url}
              onError={() => {
                setUrl("");
                setNotice(
                  "Ссылка истекла или аудио недоступно. Нажмите «Открыть аудио» снова.",
                );
              }}
            />
          ) : (
            <button
              className="secondary"
              onClick={async () => {
                const r = await cloud!.storage
                  .from("student-audio")
                  .createSignedUrl(row.audio_path!, 600);
                if (r.error) setNotice(errorText(r.error));
                else setUrl(r.data.signedUrl);
              }}
            >
              Открыть аудио
            </button>
          )}
          <small>Приватная ссылка действует 10 минут.</small>
        </div>
      )}
      {teacher ? (
        <>
          <label>
            Фидбек ученику
            <textarea
              value={feedback}
              maxLength={10000}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Что получилось → что улучшить → следующий шаг"
            />
          </label>
          <label>
            Результат
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "reviewed" | "revise")
              }
            >
              <option value="reviewed">Проверено</option>
              <option value="revise">Нужно доработать</option>
            </select>
          </label>
          <button
            className="primary"
            disabled={busy || !feedback.trim()}
            onClick={async () => {
              setBusy(true);
              try {
                const r = await cloud!.from("reviews").upsert({
                  submission_id: row.id,
                  teacher_id: user!.id,
                  feedback,
                  status,
                  updated_at: new Date().toISOString(),
                });
                if (r.error) throw r.error;
                setNotice("Фидбек отправлен ученику.");
                await reload();
              } catch (e) {
                setNotice(errorText(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Отправляю…" : "Сохранить и отправить фидбек"}
          </button>
        </>
      ) : (
        row.reviews && (
          <div className="teacher-feedback">
            <b>Фидбек преподавателя</b>
            <p className="preserve-lines">{row.reviews.feedback}</p>
            <small>
              {new Date(row.reviews.updated_at).toLocaleString("ru")}
            </small>
          </div>
        )
      )}
      <p role="status">{notice}</p>
    </article>
  );
}
