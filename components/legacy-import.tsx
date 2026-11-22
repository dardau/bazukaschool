"use client";
import { useState } from "react";
import { cloud, errorText } from "@/lib/cloud/client";
export default function LegacyImport() {
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  return (
    <details className="panel">
      <summary>Перенести прежний прогресс с этого устройства</summary>
      <p>
        Старый сайт хранил общий прогресс в браузере. Переносите его только если
        это ваши слова, заметки и ответы. Данные других людей переносить не
        нужно. Уже сохранённые в аккаунте записи останутся без изменений.
      </p>
      <button
        className="secondary"
        disabled={busy}
        onClick={async () => {
          if (
            !cloud ||
            !window.confirm(
              "Подтверждаю: прежние данные в этом браузере принадлежат мне. Перенести их в мой аккаунт?",
            )
          )
            return;
          setBusy(true);
          let added = 0,
            skipped = 0;
          try {
            const data = JSON.parse(
              localStorage.getItem("bazuka-ielts-state-v1") || "{}",
            ) as Record<string, unknown>;
            for (const [key, value] of Object.entries(data)) {
              if (
                !/^(lesson|word|answer|note|custom|check|last):/.test(key) ||
                key.startsWith("note:teacher-")
              )
                continue;
              const r = await cloud.rpc("save_study_item", {
                item_key: key,
                item_value: value,
                expected_revision: 0,
              });
              if (r.error) {
                if (r.error.message.includes("EDIT_CONFLICT")) {
                  skipped++;
                  continue;
                }
                throw r.error;
              }
              added++;
            }
            setNotice(
              `Перенесено: ${added}. Уже были в аккаунте: ${skipped}. Откройте курс заново или обновите страницу. Оригинал в браузере сохранён.`,
            );
          } catch (e) {
            setNotice(
              `Успешно перенесено: ${added}. ${errorText(e)} Можно безопасно повторить.`,
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Переношу…" : "Перенести мой прогресс"}
      </button>
      <p role="status">{notice}</p>
      <p className="muted">
        Старые аудио не загружаются автоматически: они могли принадлежать разным
        ученикам. Их можно скачать из прежнего локального архива и отправить
        заново от нужного аккаунта.
      </p>
    </details>
  );
}
