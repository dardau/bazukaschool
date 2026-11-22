"use client";
import { cloud } from "@/lib/cloud/client";
import CloudRecorder from "./cloud-recorder";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Mic, Square, Save, Trash2, Download, Circle } from "lucide-react";

type Recording = {
  id?: number;
  student: string;
  prompt: string;
  questionId: string;
  createdAt: number;
  blob: Blob;
  feedback: string;
};

const DB_NAME = "bazuka-speaking-audio-v1";
const STORE = "recordings";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore(STORE, {
        keyPath: "id",
        autoIncrement: true,
      });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function listRecordings(): Promise<Recording[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction(STORE, "readonly")
      .objectStore(STORE)
      .getAll();
    request.onsuccess = () => {
      db.close();
      resolve(
        (request.result as Recording[]).sort(
          (a, b) => b.createdAt - a.createdAt,
        ),
      );
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

async function putRecording(recording: Recording): Promise<number> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const request = tx.objectStore(STORE).add(recording);
    tx.oncomplete = () => {
      db.close();
      resolve(Number(request.result));
    };
    tx.onerror = tx.onabort = () => {
      db.close();
      reject(tx.error || new Error("Не удалось сохранить запись"));
    };
  });
}

async function updateFeedback(id: number, feedback: string) {
  const db = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const store = db.transaction(STORE, "readwrite").objectStore(STORE);
    const request = store.get(id);
    request.onsuccess = () => {
      if (!request.result) {
        db.close();
        reject(new Error("Запись не найдена"));
        return;
      }
      store.put({ ...request.result, feedback });
    };
    store.transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    store.transaction.onerror = () => {
      db.close();
      reject(store.transaction.error);
    };
  });
}

async function deleteRecording(id: number) {
  const db = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const request = db
      .transaction(STORE, "readwrite")
      .objectStore(STORE)
      .delete(id);
    request.onsuccess = () => {
      db.close();
      resolve();
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export default function SpeakingRecorder(props: {
  questionId: string;
  prompt?: string;
}) {
  return cloud ? (
    <CloudRecorder key={props.questionId} {...props} />
  ) : (
    <LocalSpeakingRecorder {...props} />
  );
}
export function LocalSpeakingRecorder({
  questionId,
  prompt = "",
}: {
  questionId: string;
  prompt?: string;
}) {
  const [student, setStudent] = useState("");
  const [ownPrompt, setOwnPrompt] = useState("");
  const [filter, setFilter] = useState("all");
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [starting, setStarting] = useState(false);
  const mounted = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draftFeedback, setDraftFeedback] = useState<Record<number, string>>(
    {},
  );
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioUrls = useMemo(
    () =>
      new Map(
        recordings.map((item) => [item.id!, URL.createObjectURL(item.blob)]),
      ),
    [recordings],
  );

  const refresh = useCallback(async () => {
    try {
      setRecordings(await listRecordings());
      setError("");
    } catch {
      setError(
        "Не удалось открыть аудиозаписи. Проверьте, разрешено ли хранилище браузера.",
      );
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    try {
      setStudent(localStorage.getItem("bazuka-speaking-student") || "");
    } catch {}
    void refresh();
    return () => {
      mounted.current = false;
      const r = recorderRef.current;
      if (r && r.state !== "inactive") r.stop();
      r?.stream.getTracks().forEach((t) => t.stop());
    };
  }, [refresh]);
  useEffect(
    () => () => {
      audioUrls.forEach(URL.revokeObjectURL);
    },
    [audioUrls],
  );

  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => setElapsed((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [recording]);

  const startRecording = async () => {
    setError("");
    setNotice("");
    const name = student.trim();
    if (!name) {
      setError("Сначала укажите имя ученика.");
      return;
    }
    const promptText = (prompt || ownPrompt).trim();
    if (!promptText) {
      setError("Укажи вопрос, на который ученик будет отвечать.");
      return;
    }
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError(
        "В этом браузере запись аудио не поддерживается. Откройте сайт в Safari или Chrome.",
      );
      return;
    }
    setStarting(true);
    let stream: MediaStream | undefined;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const preferred = [
        "audio/mp4",
        "audio/webm;codecs=opus",
        "audio/webm",
      ].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(
        stream,
        preferred ? { mimeType: preferred } : undefined,
      );
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream?.getTracks().forEach((track) => track.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        if (!blob.size) {
          setError("Не удалось сохранить запись. Попробуйте ещё раз.");
          return;
        }
        setSaving(true);
        try {
          await putRecording({
            student: name,
            prompt: promptText,
            questionId,
            createdAt: Date.now(),
            blob,
            feedback: "",
          });
          try {
            localStorage.setItem("bazuka-speaking-student", name);
          } catch {}
          await refresh();
          setNotice("Ответ записан и сохранён в этом браузере.");
        } catch {
          setError(
            "Не удалось сохранить запись. Проверьте свободное место в браузере.",
          );
        } finally {
          setSaving(false);
        }
      };
      recorderRef.current = recorder;
      recorder.start(250);
      try {
        localStorage.setItem("bazuka-speaking-student", name);
      } catch {}
      setElapsed(0);
      setRecording(true);
    } catch {
      stream?.getTracks().forEach((t) => t.stop());
      setError(
        "Не получилось включить микрофон. Разрешите доступ к микрофону в настройках браузера.",
      );
    } finally {
      setStarting(false);
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setRecording(false);
  };

  const saveFeedback = async (item: Recording) => {
    if (item.id === undefined) return;
    try {
      await updateFeedback(item.id, draftFeedback[item.id] ?? item.feedback);
      await refresh();
      setNotice("Фидбек сохранён на этом устройстве.");
    } catch {
      setError("Не удалось сохранить фидбек.");
    }
  };

  const visibleRecordings = recordings.filter(
    (item) => filter === "all" || item.student === filter,
  );
  const students = [...new Set(recordings.map((item) => item.student))].sort(
    (a, b) => a.localeCompare(b, "ru"),
  );

  return (
    <section className="audio-studio panel" aria-label="Аудиоответы учеников">
      <div className="audio-studio-heading">
        <div>
          <span className="eyebrow">ГОВОРИ · СЛУШАЙ · РАСТИ</span>
          <h2>Аудиоответ и фидбек</h2>
          <p>
            Запиши ответ на этот вопрос. Записи всех учеников и комментарии
            преподавателя хранятся в браузере на этом устройстве.
          </p>
        </div>
        <span className="audio-count">
          <Mic size={16} />
          {recordings.length}
        </span>
      </div>
      <div className="record-box">
        <label className="student-label">
          Имя ученика
          <input
            value={student}
            onChange={(e) => setStudent(e.target.value)}
            placeholder="Например, Алия"
            maxLength={60}
          />
        </label>
        {!prompt && (
          <label className="record-prompt-input">
            Вопрос для ответа
            <textarea
              value={ownPrompt}
              onChange={(e) => setOwnPrompt(e.target.value)}
              placeholder="Вставь вопрос IELTS Speaking или напиши свой…"
              maxLength={1200}
            />
          </label>
        )}
        <div className="record-controls">
          {!recording ? (
            <button
              className="record-button"
              onClick={() => void startRecording()}
              disabled={saving || starting}
            >
              <Mic size={18} />
              {starting
                ? "Включаю микрофон…"
                : saving
                  ? "Сохраняю…"
                  : "Начать запись"}
            </button>
          ) : (
            <button
              className="record-button is-recording"
              onClick={stopRecording}
            >
              <Square size={16} />
              Остановить запись · {Math.floor(elapsed / 60)}:
              {String(elapsed % 60).padStart(2, "0")}{" "}
              <Circle size={10} fill="currentColor" />
            </button>
          )}
          <span className="record-hint">
            Перед началом разреши доступ к микрофону. Chrome или Safari.
          </span>
        </div>
        {error && (
          <p className="record-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="record-notice" role="status">
            {notice}
          </p>
        )}
      </div>
      <div className="recordings-toolbar">
        <div>
          <h3>Ответы учеников</h3>
          <small>
            {recordings.length
              ? `${recordings.length} ${recordings.length === 1 ? "запись" : "записей"} на этом устройстве`
              : "Записей пока нет"}
          </small>
        </div>
        <select
          aria-label="Фильтр записей по ученику"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Все ученики</option>
          {students.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      {visibleRecordings.length === 0 ? (
        <div className="recordings-empty">
          <Mic size={22} />
          <p>
            Запиши первый ответ — он появится здесь с плеером и полем для
            фидбека.
          </p>
        </div>
      ) : (
        <div className="recording-list">
          {visibleRecordings.map((item) => {
            const url = audioUrls.get(item.id!)!;
            const date = new Intl.DateTimeFormat("ru", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(item.createdAt);
            const ext = item.blob.type.includes("mp4") ? "m4a" : "webm";
            return (
              <article className="recording-card" key={item.id}>
                <div className="recording-meta">
                  <div>
                    <span className="student-chip">{item.student}</span>
                    <span>{date}</span>
                  </div>
                  <button
                    className="icon-button danger-button"
                    aria-label={"Удалить аудиоответ ученика " + item.student}
                    onClick={async () => {
                      if (
                        item.id === undefined ||
                        !window.confirm(
                          "Удалить эту аудиозапись? Это действие нельзя отменить.",
                        )
                      )
                        return;
                      try {
                        await deleteRecording(item.id);
                        await refresh();
                        setNotice("Запись удалена.");
                      } catch {
                        setError("Не удалось удалить запись.");
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="recording-prompt" lang="en">
                  {item.prompt}
                </p>
                <audio
                  controls
                  preload="none"
                  src={url}
                  aria-label={"Аудиоответ " + item.student}
                />
                <div className="recording-links">
                  <a
                    href={url}
                    download={`speaking-${item.student.replace(/[^\p{L}\p{N}-]+/gu, "-")}-${item.createdAt}.${ext}`}
                  >
                    <Download size={14} /> Скачать запись
                  </a>
                </div>
                <label className="feedback-label">
                  Комментарий преподавателя
                  <textarea
                    value={draftFeedback[item.id!] ?? item.feedback}
                    onChange={(e) =>
                      setDraftFeedback((old) => ({
                        ...old,
                        [item.id!]: e.target.value,
                      }))
                    }
                    placeholder="Что уже хорошо? Как улучшить связность, лексику, грамматику и произношение?"
                    maxLength={3000}
                  />
                </label>
                <div className="feedback-actions">
                  <span>
                    {item.feedback
                      ? "Фидбек сохранён"
                      : "Добавь личную обратную связь"}
                  </span>
                  <button
                    className="secondary"
                    onClick={() => void saveFeedback(item)}
                  >
                    <Save size={15} />
                    Сохранить фидбек
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <p className="local-storage-note">
        Важно: записи и фидбек не отправляются в облако и не синхронизируются с
        другими устройствами. При очистке данных браузера они могут удалиться.
      </p>
    </section>
  );
}
