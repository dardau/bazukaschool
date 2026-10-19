"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Lightbulb, Save, Sparkles } from "lucide-react";
import { speakingCoach } from "@/data/speaking-coach";

type Word = {
  id: string;
  en: string;
  ru: string;
  topic: string | null;
  highlight?: boolean;
};
type State = Record<string, any>;

export default function SpeakingCoach({
  topicId,
  words,
  state,
  persist,
}: {
  topicId: string;
  words: Word[];
  state: State;
  persist: (key: string, value: any) => Promise<boolean>;
}) {
  const guide = speakingCoach[topicId];
  const id = `answer:coach-${topicId}`;
  const [draft, setDraft] = useState(state[id] || "");
  const [status, setStatus] = useState("");
  useEffect(() => {
    setDraft(state[id] || "");
    setStatus("");
  }, [topicId, state[id]]);
  const usefulWords = useMemo(() => {
    const used = new Set<string>();
    return words
      .filter((word) => {
        const key = word.en.toLowerCase();
        if (
          !word.en ||
          !word.ru ||
          used.has(key) ||
          word.en.split("/").length > 4
        )
          return false;
        used.add(key);
        return true;
      })
      .sort((a, b) => Number(!!b.highlight) - Number(!!a.highlight))
      .slice(0, 7);
  }, [words]);
  if (!guide) return null;
  const count = draft.trim() ? draft.trim().split(/\s+/).length : 0;
  return (
    <section
      className="answer-coach panel"
      aria-label="Тренажёр развёрнутого ответа"
    >
      <div className="coach-heading">
        <span className="coach-icon">
          <Sparkles size={20} />
        </span>
        <div>
          <span className="eyebrow">ИДЕИ · ЛЕКСИКА · РАЗВЁРНУТЫЙ ОТВЕТ</span>
          <h2>Как развить ответ до уровня Band 8</h2>
          <p>
            Сильный ответ развивается через конкретную мысль, объяснение и
            пример — не через сложные слова сами по себе.
          </p>
        </div>
      </div>
      <div className="coach-layout">
        <div className="coach-main">
          <div className="coach-prompt">
            <div className="row-between">
              <span className="pill">Идеи для тематической практики</span>
            </div>
            <h3 lang="en">{guide.prompt}</h3>
          </div>
          <div className="idea-grid">
            {guide.ideas.map((idea, index) => (
              <article className="idea-card" key={idea}>
                <span>
                  <Lightbulb size={16} /> ИДЕЯ {index + 1}
                </span>
                <p>{idea}</p>
              </article>
            ))}
          </div>
          <div className="response-steps">
            <div className="response-steps-title">
              <h3>Как развернуть ответ</h3>
              <span className="pill">План 4 шага</span>
            </div>
            <ol>
              <li>
                <b>Ответь прямо</b>
                <span>Сразу назови человека, место, привычку или позицию.</span>
              </li>
              <li>
                <b>Добавь деталь</b>
                <span>Вспомни один эпизод, время, место или ощущение.</span>
              </li>
              <li>
                <b>Объясни значение</b>
                <span>
                  Почему это важно? Что изменилось или чему ты научился?
                </span>
              </li>
              <li>
                <b>Заверши мысль</b>
                <span>Добавь вывод, сравнение или надежду на будущее.</span>
              </li>
            </ol>
            <p className="coach-focus">
              <b>Опора для этой темы:</b> {guide.focus}
            </p>
          </div>
          <div className="model-answer">
            <div className="row-between">
              <div>
                <span className="eyebrow">ПРИМЕР РАЗВЁРНУТОГО ОТВЕТА</span>
                <h3>Модель для изучения</h3>
              </div>
            </div>
            <p lang="en">{guide.model}</p>
            <small>
              Найди прямой ответ, конкретную деталь, объяснение и заключительную
              мысль. Это учебный пример, а не официальная оценка Band.
            </small>
          </div>
        </div>
        <aside className="coach-side">
          <div className="topic-words">
            <span className="eyebrow">ЛЕКСИКА ЭТОЙ ТЕМЫ</span>
            <h3>Попробуй использовать</h3>
            {usefulWords.length ? (
              <ul>
                {usefulWords.map((word) => (
                  <li key={word.id}>
                    <span lang="en">{word.en}</span>
                    <small>{word.ru}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Открой урок, чтобы посмотреть тематические выражения.</p>
            )}
            <small>Используй 1–2 выражения естественно и точно.</small>
          </div>
          <div className="practice-task">
            <span className="eyebrow">ТВОЯ ПОПЫТКА</span>
            <h3>Собери свой ответ</h3>
            <p>
              Выбери одну идею. Напиши 4–6 предложений на английском: ответ →
              деталь → объяснение → вывод. Затем запиши его вслух.
            </p>
            <textarea
              aria-label="Мой развёрнутый ответ"
              placeholder="I would like to talk about…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={6000}
            />
            <div className="coach-save-row">
              <small>
                {count} слов ·{" "}
                {status || "черновик сохраняется отдельно от модели"}
              </small>
              <button
                className="primary"
                onClick={async () => {
                  setStatus("Сохраняю…");
                  const saved = await persist(id, draft);
                  setStatus(saved ? "Ответ сохранён" : "Не удалось сохранить");
                }}
              >
                <Save size={15} />
                Сохранить
              </button>
            </div>
            <div className="coach-checklist">
              <b>
                <Check size={15} /> Перед записью проверь
              </b>
              <span>Отвечаю именно на вопрос</span>
              <span>Добавил конкретный пример</span>
              <span>Объяснил, почему это важно</span>
              <span>Не вставлял слова, значение которых не уверен</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
