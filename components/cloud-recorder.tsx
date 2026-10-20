"use client";
import { useEffect, useRef, useState } from "react";
import { useAccount } from "./account-provider";
import { submitWork } from "@/lib/cloud/submissions";
import { readDraft, writeDraft } from "@/lib/cloud/audio-drafts";
import { errorText } from "@/lib/cloud/client";
export default function CloudRecorder({
  questionId,
  prompt = "",
}: {
  questionId: string;
  prompt?: string;
}) {
  const { user, profile, teacherId } = useAccount();
  const [ownPrompt, setOwnPrompt] = useState(""),
    [recording, setRecording] = useState(false),
    [starting, setStarting] = useState(false),
    [busy, setBusy] = useState(false),
    [elapsed, setElapsed] = useState(0),
    [blob, setBlob] = useState<Blob | null>(null),
    [url, setUrl] = useState(""),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [sent, setSent] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null),
    mounted = useRef(false),
    attempt = useRef("");
  const draftKey = (user?.id || "") + ":" + questionId;
  const [draftLoading, setDraftLoading] = useState(true);
  useEffect(() => {
    let active = true;
    void readDraft(draftKey)
      .then((d) => {
        if (active && d) {
          setBlob(d.blob);
          attempt.current = d.attempt;
          setOwnPrompt(d.prompt);
          setNotice("Восстановлена неотправленная запись с этого устройства.");
        }
      })
      .catch(() => {
        if (active)
          setError(
            "Локальное хранилище недоступно. Скачивайте копию записи перед уходом.",
          );
      })
      .finally(() => {
        if (active) setDraftLoading(false);
      });
    return () => {
      active = false;
    };
  }, [draftKey]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (recorder.current?.state === "recording") recorder.current.stop();
      recorder.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);
  useEffect(() => {
    // The URL belongs to the external browser Blob store; release it on replacement.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!blob) {
      setUrl("");
      return;
    }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [blob]);
  useEffect(() => {
    if (!recording) return;
    const id = setInterval(
      () =>
        setElapsed((n) => {
          if (n >= 599) recorder.current?.stop();
          return n + 1;
        }),
      1000,
    );
    return () => clearInterval(id);
  }, [recording]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (recording || (blob && !sent)) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [recording, blob, sent]);
  function receive(file: Blob) {
    const id = crypto.randomUUID();
    if (mounted.current) {
      setBlob(file);
      attempt.current = id;
      setSent(false);
      setNotice("Сохраняю черновик на этом устройстве…");
    }
    void writeDraft(draftKey, {
      key: draftKey,
      blob: file,
      attempt: id,
      prompt: prompt || ownPrompt,
    })
      .then(
        () =>
          mounted.current &&
          setNotice(
            "Черновик сохранён на этом устройстве. Для сохранения в аккаунте отправь его преподавателю.",
          ),
      )
      .catch(
        () =>
          mounted.current &&
          setError(
            "Не удалось сохранить черновик на устройстве. Скачай копию до ухода со страницы.",
          ),
      );
  }
  async function start() {
    setError("");
    if (!(prompt || ownPrompt).trim()) {
      setError("Сначала укажи вопрос.");
      return;
    }
    if (
      blob &&
      !sent &&
      !window.confirm(
        "Заменить ещё не отправленную запись? Сначала скачайте её, если нужна копия.",
      )
    )
      return;
    setStarting(true);
    let stream: MediaStream | undefined;
    try {
      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      )
        throw Error("Запись недоступна. Можно загрузить аудиофайл ниже.");
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ].find((x) => MediaRecorder.isTypeSupported(x));
      const r = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.current = r;
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      r.onerror = () => {
        setError("Запись прервалась. Попробуйте ещё раз или загрузите файл.");
        stream?.getTracks().forEach((t) => t.stop());
        setRecording(false);
      };
      r.onstop = () => {
        stream?.getTracks().forEach((t) => t.stop());
        if (mounted.current) setRecording(false);
        const file = new Blob(chunks, {
          type: r.mimeType.split(";")[0] || "audio/webm",
        });
        if (file.size) receive(file);
        else setError("Запись пустая. Попробуйте ещё раз.");
      };
      r.start(500);
      setElapsed(0);
      setRecording(true);
      setNotice("");
    } catch (e) {
      stream?.getTracks().forEach((t) => t.stop());
      setError(errorText(e));
    } finally {
      setStarting(false);
    }
  }
  return (
    <section className="audio-studio panel">
      <span className="eyebrow">SPEAKING · ЛИЧНЫЙ ОТВЕТ</span>
      <h2>Запиши свой ответ</h2>
      <p>
        До 10 минут и 25 МБ. После отправки запись сохранится в аккаунте и
        появится у твоего преподавателя.
      </p>
      {prompt ? (
        <p lang="en">{prompt}</p>
      ) : (
        <label>
          Вопрос
          <textarea
            maxLength={1200}
            value={ownPrompt}
            onChange={(e) => setOwnPrompt(e.target.value)}
            disabled={recording || busy}
          />
        </label>
      )}
      <div className="record-controls">
        {recording ? (
          <button
            className="record-button is-recording"
            onClick={() => recorder.current?.stop()}
          >
            Остановить · {Math.floor(elapsed / 60)}:
            {String(elapsed % 60).padStart(2, "0")}
          </button>
        ) : (
          <button
            className="record-button"
            disabled={starting || busy || draftLoading}
            onClick={() => void start()}
          >
            {starting ? "Включаю микрофон…" : "Начать запись"}
          </button>
        )}
      </div>
      <label>
        Или загрузи аудио
        <input
          type="file"
          accept="audio/webm,audio/mp4,audio/ogg,audio/mpeg,audio/wav,.m4a"
          disabled={recording || starting || busy || draftLoading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 25 * 1024 * 1024 || !file.size) {
              setError("Нужен непустой файл до 25 МБ.");
              return;
            }
            if (
              ![
                "audio/webm",
                "audio/mp4",
                "audio/ogg",
                "audio/mpeg",
                "audio/wav",
                "audio/x-m4a",
              ].includes(file.type)
            ) {
              setError("Поддерживаются WebM, M4A, Ogg, MP3 и WAV.");
              return;
            }
            if (
              blob &&
              !sent &&
              !window.confirm("Заменить текущую неотправленную запись?")
            )
              return;
            setError("");
            receive(
              file.type === "audio/x-m4a"
                ? new Blob([file], { type: "audio/mp4" })
                : file,
            );
          }}
        />
      </label>
      {url && (
        <>
          <audio controls src={url} />
          <div className="account-links">
            <a
              className="secondary"
              href={url}
              download={
                "speaking." +
                (blob?.type.includes("mp4")
                  ? "m4a"
                  : blob?.type.includes("mpeg")
                    ? "mp3"
                    : blob?.type.split("/")[1] || "webm")
              }
            >
              Скачать копию
            </a>
            <button
              className="primary"
              disabled={busy || sent || !teacherId || recording}
              onClick={async () => {
                if (!blob || !teacherId || !user) return;
                setBusy(true);
                setError("");
                try {
                  await submitWork({
                    id: attempt.current,
                    studentId: user.id,
                    teacherId,
                    assignmentKey: questionId,
                    title: (prompt || ownPrompt).trim(),
                    audio: blob,
                  });
                  setSent(true);
                  void writeDraft(draftKey).catch(() => {});
                  setNotice(
                    "Аудио сохранено в аккаунте и отправлено преподавателю. Фидбек будет в «Моём кабинете».",
                  );
                } catch (e) {
                  setError(errorText(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              {sent
                ? "Отправлено"
                : busy
                  ? "Загружаю…"
                  : "Отправить на проверку"}
            </button>
          </div>
        </>
      )}
      {!teacherId && (
        <p>
          {profile?.role === "teacher"
            ? "Для проверки ответов открой «Мой кабинет»."
            : "Чтобы отправлять записи, введи приглашение преподавателя в «Моём кабинете»."}
        </p>
      )}
      {error && (
        <p className="record-error" role="alert">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
    </section>
  );
}
