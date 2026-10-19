"use client";
import { useState } from "react";
import SpeakingRecorder from "./speaking-recorder";
import { Quiz } from "./course-workspace";
const articles = [
  {
    id: "parents",
    label: "READING · FAMILY",
    title: "Do Mom and Dad Still Have Differing Parental Roles?",
    url: "https://www.healthyplace.com/parenting/parenting-skills-strategies/do-mom-and-dad-still-have-differing-parental-roles",
    source: "Tanya J. Peterson · HealthyPlace · 2022",
    intro:
      "Как меняются обязанности родителей и почему участие в жизни ребёнка важнее жёсткого разделения ролей.",
    questions: [
      "What contrast does the author draw between past and present parental roles?",
      "Find two examples of responsibilities either parent can fulfil.",
      "Does the article prove that one family arrangement works for everyone? Explain the limits of this claim.",
    ],
    prompt:
      "Should parents divide responsibilities according to tradition or individual circumstances?",
    words: [
      ["nurture", "заботиться о развитии"],
      ["guidance", "наставление, поддержка"],
      ["role model", "пример для подражания"],
    ],
    quiz: [
      {
        question: "Какую мысль развивает автор?",
        options: [
          "Роли родителей должны быть неизменными.",
          "Важна вовлечённость обоих родителей.",
          "Роль родителей ограничивается доходом.",
        ],
        answer: 1,
        why: "В заключении акцент на участии родителей, а не на единственном способе распределить задачи.",
      },
    ],
  },
  {
    id: "elders",
    label: "READING · GENERATIONS",
    title: "How can older people play a bigger role in society?",
    url: "https://www.theguardian.com/society/2015/mar/30/how-why-older-people-valued-knowledge-experience",
    source: "Sarah Johnson · The Guardian · 30 марта 2015",
    intro:
      "Older adults contribute skills; accessible communities support participation.",
    questions: [
      "Choose one claim and identify who makes it.",
      "Which example would you use in your own answer, and why?",
      "What evidence would you need to check whether a 2015 claim still applies today?",
    ],
    prompt: "How can different generations learn from one another?",
    words: [
      ["contribute", "вносить вклад"],
      ["participation", "участие"],
      ["independent", "самостоятельный"],
    ],
    quiz: [],
  },
];
type Props = {
  state: Record<string, unknown>;
  persist: (k: string, v: unknown) => Promise<boolean>;
  renderEditor: (id: string, title: string, hint: string) => React.ReactNode;
};
export default function LanguageBoost({ state, persist, renderEditor }: Props) {
  const [tab, setTab] = useState("articles");
  return (
    <>
      <span className="eyebrow">ТВОЁ ПРОСТРАНСТВО ДЛЯ НОВЫХ ИДЕЙ</span>
      <h1>Language Boost Corner</h1>
      <p className="intro">
        Статьи, аудио и практика отдельно от основного курса. Изучи источник,
        собери лексику, сформулируй позицию и ответь вслух.
      </p>
      <div
        className="toolbar"
        role="group"
        aria-label="Материалы Language Boost"
      >
        <button
          className={tab === "articles" ? "primary" : "secondary"}
          aria-pressed={tab === "articles"}
          onClick={() => setTab("articles")}
        >
          Статьи и упражнения
        </button>
        <button
          className={tab === "audio" ? "primary" : "secondary"}
          aria-pressed={tab === "audio"}
          onClick={() => setTab("audio")}
        >
          Аудио и видео
        </button>
      </div>
      {tab === "articles" ? (
        articles.map((a) => (
          <article key={a.id} className="panel boost-article">
            <span className="eyebrow">{a.label}</span>
            <h2>{a.title}</h2>
            <small>{a.source}</small>
            <p>{a.intro}</p>
            <a
              className="primary"
              href={a.url}
              target="_blank"
              rel="noreferrer"
            >
              Читать полный оригинал ↗
            </a>
            <div className="vocab-chips">
              {a.words.map(([en, ru]) => (
                <span key={en}>
                  <b>{en}</b>
                  <small>{ru}</small>
                </span>
              ))}
            </div>
            <h3>Рабочая тетрадь</h3>
            <ol>
              {a.questions.map((q) => (
                <li key={q} lang="en">
                  {q}
                </li>
              ))}
            </ol>
            {renderEditor(
              "answer:boost-" + a.id,
              "Ответы по статье",
              "1. Главная мысль своими словами\n2. Пример / доказательство из источника\n3. Моё мнение и его ограничения",
            )}
            {a.quiz.length > 0 && (
              <Quiz
                id={"article-" + a.id}
                items={a.quiz}
                state={state}
                persist={persist}
              />
            )}
            <details>
              <summary>Как проверить открытые ответы</summary>
              <p>
                Укажи конкретный фрагмент источника, отдели мнение автора от
                своего и проверь, что пример действительно подтверждает
                аргумент. Возможны разные обоснованные ответы.
              </p>
            </details>
            <h3>От чтения к Speaking</h3>
            <blockquote lang="en">{a.prompt}</blockquote>
            <p>
              Позиция → причина → собственный пример → исключение. Используй два
              выражения естественно.
            </p>
            <SpeakingRecorder questionId={"boost-" + a.id} prompt={a.prompt} />
            <label className="check-item">
              <input
                type="checkbox"
                checked={!!state["check:boost-" + a.id]}
                onChange={(e) =>
                  void persist("check:boost-" + a.id, e.target.checked)
                }
              />
              Источник изучен, упражнения выполнены
            </label>
          </article>
        ))
      ) : (
        <section className="panel">
          <span className="eyebrow">LISTEN · NOTICE · SPEAK</span>
          <h2>8 Ways to Improve Parent Child Relationship</h2>
          <p>Видео из материалов Family и оригинальная аудиозапись к нему.</p>
          <audio
            controls
            preload="metadata"
            src="/materials/RDemM6FjcSE.mp3"
            aria-label="Аудио Parent Child Relationship"
          />
          <iframe
            className="family-video"
            src="https://www.youtube-nocookie.com/embed/RDemM6FjcSE"
            title="8 Ways to Improve Parent Child Relationship"
            allowFullScreen
          />
          <a
            href="https://youtu.be/RDemM6FjcSE"
            target="_blank"
            rel="noreferrer"
          >
            Открыть YouTube ↗
          </a>
          <h3>Два прослушивания</h3>
          <ol>
            <li>
              Первый раз: выпиши основные советы без попытки записать каждое
              слово.
            </li>
            <li>Второй раз: выбери три выражения, запиши время и контекст.</li>
            <li>
              Перескажи один совет. Добавь свой пример и объясни, когда он может
              не подойти.
            </li>
          </ol>
          {renderEditor(
            "answer:boost-listening",
            "Моя тетрадь Listening",
            "Совет → время в записи → выражение → мой пример",
          )}
          <SpeakingRecorder
            questionId="boost-listening"
            prompt="Which habit can help a family communicate better, and why?"
          />
          <label className="check-item">
            <input
              type="checkbox"
              checked={!!state["check:boost-listening"]}
              onChange={(e) =>
                void persist("check:boost-listening", e.target.checked)
              }
            />
            Прослушано и пересказано
          </label>
          <p className="info-note">
            Новые академические подкасты и статьи будут добавляться по мере
            получения материалов преподавателя.
          </p>
        </section>
      )}
    </>
  );
}
