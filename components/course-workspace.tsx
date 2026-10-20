"use client";
import { useAccount } from "./account-provider";
import { cloud } from "@/lib/cloud/client";
import { useState } from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import {
  lessons,
  punctuation,
  grammar,
  passage,
  readingQuiz,
  topicPractice,
  type QuizItem,
} from "@/data/course";
import material from "@/data/materials.json";
import SpeakingCoach from "./speaking-coach";
import SpeakingRecorder from "./speaking-recorder";
type Props = {
  state: Record<string, unknown>;
  persist: (k: string, v: unknown) => Promise<boolean>;
  ready: boolean;
  renderEditor: (
    id: string,
    title: string,
    placeholder: string,
  ) => React.ReactNode;
  family: () => React.ReactNode;
  openTopic: (id: string) => void;
  openWriting: () => void;
  openWords: (id: string) => void;
  openBoost: () => void;
  mode?: string;
};
export function Quiz({
  id,
  items,
  state,
  persist,
}: {
  id: string;
  items: QuizItem[];
  state: Props["state"];
  persist: Props["persist"];
}) {
  const [answers, setAnswers] = useState<Record<number, number>>(
      (state["answer:quiz-" + id] as Record<number, number>) || {},
    ),
    [checked, setChecked] = useState(false),
    [notice, setNotice] = useState("");
  return (
    <div className="course-quiz">
      <h3>Проверь себя</h3>
      {items.map((q, i) => (
        <fieldset key={i}>
          <legend>{q.question}</legend>
          {q.options.map((o, j) => (
            <label key={o}>
              <input
                type="radio"
                name={id + "-" + i}
                checked={answers[i] === j}
                onChange={() => {
                  setAnswers((a) => ({ ...a, [i]: j }));
                  setChecked(false);
                }}
              />
              {o}
            </label>
          ))}
          {checked && (
            <p
              className={
                answers[i] === q.answer ? "answer-correct" : "answer-review"
              }
            >
              {answers[i] === q.answer ? "Верно. " : "Разберём: "}
              {q.why}
            </p>
          )}
        </fieldset>
      ))}
      <button
        className="primary"
        onClick={async () => {
          setChecked(true);
          const ok = await persist("answer:quiz-" + id, answers);
          setNotice(
            ok ? "Результат сохранён" : "Ответы не сохранены. Повтори попытку.",
          );
        }}
      >
        Проверить ответы
      </button>
      {checked && (
        <p role="status">
          {items.filter((q, i) => answers[i] === q.answer).length} /{" "}
          {items.length} верно. {notice}
        </p>
      )}
    </div>
  );
}
export function TopicWorkout({
  topic,
  state,
  persist,
  renderEditor,
}: {
  topic: string;
  state: Props["state"];
  persist: Props["persist"];
  renderEditor: Props["renderEditor"];
}) {
  const p = topicPractice[topic];
  if (!p) return null;
  return (
    <section className="panel">
      <span className="eyebrow">VOCABULARY LAB</span>
      <h2>От слова к своему ответу</h2>
      <div className="vocab-chips">
        {p.pairs.map(([en, ru]) => (
          <span key={en}>
            <b>{en}</b>
            <small>{ru}</small>
          </span>
        ))}
      </div>
      <Quiz
        key={topic}
        id={"vocab-" + topic}
        state={state}
        persist={persist}
        items={p.gaps.map((g) => ({
          question: g.text,
          options: p.pairs.map((x) => x[0]),
          answer: p.pairs.findIndex((x) => x[0] === g.answer),
          why: g.why,
        }))}
      />
      <h3>Как сделать ответ содержательнее</h3>
      <div className="answer-comparison">
        <article>
          <span className="eyebrow">ПЕРВАЯ МЫСЛЬ</span>
          <p lang="en">{p.short}</p>
        </article>
        <article>
          <span className="eyebrow">РАЗВИТИЕ МЫСЛИ</span>
          <p lang="en">{p.strong}</p>
        </article>
      </div>
      <ul>
        {p.analysis.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
      <p>
        Это разбор приёмов, а не присвоение балла: по одному письменному примеру
        нельзя оценить Speaking.
      </p>
      {renderEditor(
        "answer:rewrite-" + topic,
        "Твой вариант",
        "Опиши собственный эпизод и используй 2 выражения из темы. Не копируй модель.",
      )}
    </section>
  );
}
export function BandGuide() {
  return (
    <details className="panel band-guide">
      <summary>Цель Band 8: что именно тренировать</summary>
      <div className="idea-grid">
        <article>
          <h3>Связность</h3>
          <p>
            Развивай мысль по вопросу. Делай паузы для выбора идеи, сохраняя
            естественный темп.
          </p>
        </article>
        <article>
          <h3>Лексика</h3>
          <p>
            Передавай точный смысл, перефразируй и проверяй сочетаемость слов.
          </p>
        </article>
        <article>
          <h3>Грамматика</h3>
          <p>
            Сочетай разные конструкции. Большинство предложений должны быть без
            ошибок.
          </p>
        </article>
        <article>
          <h3>Произношение</h3>
          <p>
            Работай с ударением, ритмом и интонацией. Ответ должен легко
            пониматься целиком.
          </p>
        </article>
      </div>
      <p>
        Part 1: прямой ответ, причина и короткая деталь. Part 2: история с
        конкретным эпизодом и личным значением. Part 3: позиция, объяснение,
        пример и возможное исключение.
      </p>
      <p>
        Прослушай свою запись дважды: сначала проверь развитие мысли, затем
        произношение. Перезапиши тот же ответ без чтения.
      </p>
      <a
        href="https://ielts.org/cdn/ielts-guides/ielts-speaking-band-descriptors.pdf"
        target="_blank"
        rel="noreferrer"
      >
        Официальные критерии IELTS Speaking ↗
      </a>
    </details>
  );
}
function TeacherBlock({
  id,
  state,
  persist,
}: {
  id: string;
  state: Props["state"];
  persist: Props["persist"];
}) {
  const { profile } = useAccount();
  const key = "note:teacher-" + id;
  const saved = state[key] as { text?: string; url?: string } | undefined;
  const [text, setText] = useState(saved?.text || ""),
    [url, setUrl] = useState(saved?.url || ""),
    [notice, setNotice] = useState("");
  let safe = "";
  try {
    const u = new URL(saved?.url || "");
    if (u.protocol === "https:") safe = u.href;
  } catch {}
  let embed = "";
  if (safe) {
    const u = new URL(safe);
    const videoId =
      u.hostname === "youtu.be"
        ? u.pathname.slice(1)
        : ["www.youtube.com", "youtube.com"].includes(u.hostname)
          ? u.searchParams.get("v")
          : null;
    if (videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId))
      embed = "https://www.youtube-nocookie.com/embed/" + videoId;
  }
  return (
    <section className="panel teacher-block">
      {saved?.text && (
        <>
          <span className="eyebrow">МАТЕРИАЛ ПРЕПОДАВАТЕЛЯ</span>
          <p className="preserve-lines">{saved.text}</p>
        </>
      )}
      {embed && (
        <iframe
          className="family-video"
          src={embed}
          title="Видео преподавателя"
          allowFullScreen
        />
      )}
      {safe && /\.mp4(?:\?|$)/i.test(safe) && (
        <video
          className="family-video"
          controls
          preload="metadata"
          src={safe}
        />
      )}{" "}
      {safe && (
        <a className="secondary" href={safe} target="_blank" rel="noreferrer">
          Открыть запись урока / материал ↗
        </a>
      )}
      {(!cloud || profile?.role === "teacher") && (
        <details>
          <summary>Добавить текст или ссылку преподавателя</summary>
          <p>
            Можно вставить информацию по слайдам без готовой презентации.
            {cloud
              ? "Дополнения будут доступны всем ученикам школы."
              : "Дополнения сохраняются только в этом браузере."}
          </p>
          <label>
            Текст материала
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={30000}
            />
          </label>
          <label>
            Ссылка на видео, презентацию или документ
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
            />
          </label>
          <button
            className="secondary"
            onClick={async () => {
              if (url) {
                try {
                  if (new URL(url).protocol !== "https:") throw Error();
                } catch {
                  setNotice("Укажи полную ссылку https://");
                  return;
                }
              }
              const ok = await persist(key, { text, url });
              setNotice(ok ? "Материал сохранён" : "Не удалось сохранить");
            }}
          >
            Сохранить материал
          </button>
          <span role="status">{notice}</span>
        </details>
      )}
    </section>
  );
}
export default function CourseWorkspace(p: Props) {
  const [lessonId, setLessonId] = useState<string | null>(null),
    [sectionId, setSectionId] = useState("welcome");
  const last = p.state["last:course"] as
    { lesson?: string; section?: string } | undefined;
  const lesson = lessons.find((l) => l.id === lessonId);
  const section =
    lesson?.sections.find((s) => s.id === sectionId) || lesson?.sections[0];
  function open(id: string, s = "welcome") {
    setLessonId(id);
    setSectionId(s);
    void p.persist("last:course", { lesson: id, section: s });
    window.scrollTo({ top: 0 });
  }
  const done = (l: (typeof lessons)[number]) =>
    l.sections.filter((s) => p.state["check:course-" + l.id + "-" + s.id])
      .length;
  if (!lesson || !section)
    return (
      <>
        <div className="course-hero">
          <div>
            <span className="eyebrow">BAZUKASCHOOL · ОСНОВНОЙ КУРС</span>
            <h1>
              A little practice.
              <br />
              <em>A lot of progress.</em>
            </h1>
            <p>
              Твой IELTS начинается здесь. Проходи занятия по порядку: изучай,
              пробуй, записывай ответы и обсуждай их с преподавателем.
            </p>
            <button
              className="primary"
              onClick={() =>
                open(last?.lesson || "1", last?.section || "welcome")
              }
            >
              Продолжить обучение <ArrowRight size={17} />
            </button>
          </div>
          <div className="hero-notes" aria-hidden="true">
            <span>you’ve got this ✨</span>
            <b>
              Learn.
              <br />
              Try.
              <br />
              Grow.
            </b>
            <small>ONE LESSON AT A TIME</small>
          </div>
        </div>
        <div className="section-heading">
          <h2>Твои занятия</h2>
          <span>Первый шаг → уверенный ответ</span>
        </div>
        <div className="course-cards">
          {lessons.map((l) => (
            <button
              className={"course-card " + l.tone}
              key={l.id}
              onClick={() => open(l.id)}
            >
              <span className="eyebrow">УРОК 0{l.id}</span>
              <h2>{l.title}</h2>
              <p>{l.subtitle}</p>
              <div className="section-tags">
                {l.sections
                  .filter((s) => !["welcome", "homework"].includes(s.kind))
                  .map((s) => (
                    <span key={s.id}>{s.title}</span>
                  ))}
              </div>
              <div className="course-card-bottom">
                <span>
                  {done(l)} / {l.sections.length} секций пройдено
                </span>
                <ArrowRight />
              </div>
              <progress value={done(l)} max={l.sections.length} />
            </button>
          ))}
        </div>
        <button className="boost-entry" onClick={p.openBoost}>
          <span className="boost-icon">
            <Sparkles />
          </span>
          <span>
            <b>Language Boost Corner</b>
            <small>
              Отдельное пространство: статьи, аудио, задания и новые идеи
            </small>
          </span>
          <ArrowRight />
        </button>
        <section className="panel">
          <h2>Словарь и тематическая практика</h2>
          <p>
            Весь handout сохранён: 20 тематических разделов, оригинальные
            страницы и вопросы.
          </p>
          <div className="topic-links">
            {material.topics.map((t) => (
              <button
                className="secondary"
                key={t.id}
                onClick={() => p.openTopic(t.id)}
              >
                {t.name}
              </button>
            ))}
          </div>
        </section>
      </>
    );
  const current = lesson.sections.indexOf(section),
    key = "check:course-" + lesson.id + "-" + section.id;
  const editor = (id: string, title: string, hint: string) =>
    p.renderEditor("answer:course-" + lesson.id + "-" + id, title, hint);
  const speakingTopic = section.kind === "personality" ? "0" : "1";
  return (
    <>
      <button className="text-button back" onClick={() => setLessonId(null)}>
        ← К программе курса
      </button>
      <span className="eyebrow">УРОК 0{lesson.id}</span>
      <h1>{lesson.title}</h1>
      <p className="intro">{lesson.subtitle}</p>
      <div className="course-layout">
        <aside className="section-nav">
          <h3>Разделы занятия</h3>
          <nav aria-label="Разделы занятия">
            {lesson.sections.map((s, i) => (
              <button
                key={s.id}
                className={section.id === s.id ? "active" : ""}
                aria-current={section.id === s.id ? "step" : undefined}
                onClick={() => open(lesson.id, s.id)}
              >
                <span>
                  {p.state["check:course-" + lesson.id + "-" + s.id] ? (
                    <Check size={15} />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                {s.title}
              </button>
            ))}
          </nav>
          <progress value={done(lesson)} max={lesson.sections.length} />
          <small>
            {done(lesson)} из {lesson.sections.length} завершено
          </small>
        </aside>
        <div className="course-content" key={lesson.id + "-" + section.id}>
          <h2>{section.title}</h2>
          {section.kind === "welcome" && (
            <section className="panel">
              <span className="eyebrow">TODAY’S PLAN</span>
              <h3>Что получится к концу урока</h3>
              <ul>
                {(lesson.id === "1"
                  ? [
                      "Разобрать вопрос Task 2 и сформулировать позицию.",
                      "Описать человека через качество и реальный эпизод.",
                      "Исправить запятые, границы предложений и апострофы.",
                    ]
                  : [
                      "Отличать False от Not Given и находить доказательства в тексте.",
                      "Выполнить учебный Passage 1 и разобрать ошибки.",
                      "Использовать although, while, if и relative clauses.",
                      "Говорить о семье с примерами и тематической лексикой.",
                    ]
                ).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <p>
                Сначала материал, затем практика, заметки и домашняя работа.
                Разделы можно открывать в любом порядке.
              </p>
              <p className="info-note">
                Последовательность курса — по плану Лины. Новые объяснения и
                упражнения — учебные дополнения; оригинальные материалы доступны
                рядом.
              </p>
              {editor(
                "goal",
                "Моя цель на занятие",
                "Что хочу научиться делать сегодня?",
              )}
            </section>
          )}
          {section.kind === "writing" && (
            <>
              <section className="panel">
                <h3>Task 2: от вопроса к позиции</h3>
                <p>
                  Напиши не менее 250 слов; рекомендуемое время — около 40
                  минут. Сначала определи, что просит задание: обсудить обе
                  стороны, оценить степень согласия или сопоставить преимущества
                  и недостатки.
                </p>
                <ol className="study-plan">
                  <li>
                    <b>Разбери все части вопроса</b>
                    <p>
                      Подчеркни тему, ограничители и команду. Не отвечай на
                      похожий, но другой вопрос.
                    </p>
                  </li>
                  <li>
                    <b>Сформулируй позицию</b>
                    <p>
                      Одно ясное предложение. В задании discuss both views
                      объясни обе стороны и своё мнение.
                    </p>
                  </li>
                  <li>
                    <b>Разверни два аргумента</b>
                    <p>
                      Мысль → почему → конкретный пример → связь с позицией.
                    </p>
                  </li>
                  <li>
                    <b>Проверь вывод</b>
                    <p>Он следует из аргументов и не вводит новую тему.</p>
                  </li>
                </ol>
                <a
                  href="https://ielts.org/cdn/Sample-tests/ielts-academic-writing-sample-tasks-2023.pdf"
                  target="_blank"
                  rel="noreferrer"
                >
                  Официальный пример Writing Task 2 ↗
                </a>
              </section>
              <section className="panel">
                <h3>Разбираем первый вопрос из материалов</h3>
                <blockquote>{material.writing[0]}</blockquote>
                <div className="idea-grid">
                  <article>
                    <h4>Свобода пробовать</h4>
                    <p>
                      Безопасные ошибки учат самостоятельности: ребёнок забывает
                      подготовить сумку и составляет чек-лист на следующий день.
                    </p>
                  </article>
                  <article>
                    <h4>Границы безопасности</h4>
                    <p>
                      Взрослым стоит вмешаться, когда последствия опасны или
                      необратимы. Например, правила дорожного движения нельзя
                      осваивать через риск.
                    </p>
                  </article>
                  <article>
                    <h4>Сбалансированная позиция</h4>
                    <p>
                      Давать самостоятельность в посильных решениях, сохраняя
                      защиту в ситуациях с серьёзным риском.
                    </p>
                  </article>
                </div>
                <p lang="en" className="model-paragraph">
                  Allowing children to make manageable mistakes can develop
                  their independence. If a child forgets to pack a school bag,
                  for instance, the inconvenience may encourage them to create a
                  checklist for the following day. By reflecting on that
                  experience, they learn to plan rather than rely entirely on
                  reminders. This approach is useful only when the consequences
                  are minor; adults still need to intervene when safety is at
                  stake.
                </p>
                <small>
                  Учебный пример одного абзаца, не полное эссе и не оценка Band.
                </small>
                {editor(
                  "paragraph",
                  "Мой аргумент",
                  "Напиши другой пример. Объясни, как он поддерживает твою позицию.",
                )}
                <button className="primary" onClick={p.openWriting}>
                  Все 5 тем · эссе и устная практика <ArrowRight size={16} />
                </button>
              </section>
            </>
          )}
          {section.kind === "punctuation" && (
            <>
              <section className="panel">
                <h3>Четыре опоры для ясного текста</h3>
                <p>
                  <b>Границы:</b> самостоятельные предложения разделяй точкой,
                  точкой с запятой или подходящим союзом.
                </p>
                <p>
                  <b>Придаточное в начале:</b> Although she is busy, she helps
                  me.
                </p>
                <p>
                  <b>Дополнительная информация:</b> My aunt, who raised me, is
                  very patient.
                </p>
                <p>
                  <b>Принадлежность:</b> a parent’s advice; my parents’ advice.
                </p>
                <Quiz
                  id="punctuation"
                  items={punctuation}
                  state={p.state}
                  persist={p.persist}
                />
              </section>
              {editor(
                "punctuation",
                "Перепиши без ошибок",
                "my sister is reliable, she always helps me however she is often busy",
              )}
            </>
          )}
          {section.kind === "reading" && (
            <section className="panel">
              <h3>Read for evidence</h3>
              <p>
                В IELTS Academic Reading — три раздела, 40 вопросов и 60 минут,
                включая перенос ответов. Здесь начнём с короткого учебного
                текста, затем перейдём к официальным образцам.
              </p>
              <ol className="study-plan">
                <li>
                  <b>Skim</b>
                  <p>Посмотри заголовок и основную мысль каждого абзаца.</p>
                </li>
                <li>
                  <b>Scan</b>
                  <p>
                    Ищи ключевые слова вопроса и их перефразы. Прочитай
                    найденное место внимательно.
                  </p>
                </li>
                <li>
                  <b>Докажи ответ</b>
                  <p>
                    True — совпадает с текстом. False — текст противоречит. Not
                    Given — информации недостаточно.
                  </p>
                </li>
                <li>
                  <b>Проверь инструкцию</b>
                  <p>
                    В заданиях с пропусками соблюдай лимит слов и написание.
                  </p>
                </li>
              </ol>
              <a
                href="https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-reading"
                target="_blank"
                rel="noreferrer"
              >
                Формат Reading · IELTS.org ↗
              </a>
              {editor(
                "reading-notes",
                "Мои заметки",
                "Как я буду отличать False от Not Given?",
              )}
            </section>
          )}
          {section.kind === "passage" && (
            <>
              <div className="info-note">
                Учебный текст BazukaSchool о вымышленном проекте. Это
                сокращённая тренировка навыков Passage 1, не официальный пробный
                тест.
              </div>
              <section className="panel reading-passage">
                <h3>A library of things</h3>
                {passage.map(([letter, title, text]) => (
                  <article key={letter}>
                    <h4>
                      {letter}. {title}
                    </h4>
                    <p lang="en">{text}</p>
                  </article>
                ))}
              </section>
              <section className="panel">
                <Quiz
                  id="passage-1"
                  items={readingQuiz}
                  state={p.state}
                  persist={p.persist}
                />
              </section>
              {editor(
                "reading-evidence",
                "Моя рабочая тетрадь Reading",
                "Номер вопроса → цитата из текста → почему мой ответ подходит.",
              )}
              <a
                className="secondary"
                href="https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test"
                target="_blank"
                rel="noreferrer"
              >
                Продолжить с официальными образцами ↗
              </a>
            </>
          )}
          {section.kind === "grammar" && (
            <>
              <section className="panel">
                <h3>Сложная конструкция — ясная связь мыслей</h3>
                <div className="grammar-examples">
                  <p>
                    <b>Причина:</b> I admire her because she stays calm under
                    pressure.
                  </p>
                  <p>
                    <b>Контраст:</b> Although we disagree sometimes, we get on
                    well.
                  </p>
                  <p>
                    <b>Уточнение:</b> My uncle, who lives nearby, often visits
                    us.
                  </p>
                  <p>
                    <b>Условие:</b> If we had more free time, we would meet more
                    often.
                  </p>
                </div>
                <p>
                  Выбирай конструкцию под смысл. Длина предложения сама по себе
                  не повышает оценку.
                </p>
                <Quiz
                  id="complex-structures"
                  items={grammar}
                  state={p.state}
                  persist={p.persist}
                />
              </section>
              {editor(
                "grammar",
                "Соедини идеи",
                "1. My parents are busy. They make time for me. (although)\n2. My sister lives abroad. She calls every Sunday. (who)\n3. We do not live nearby. We do not meet often. (if)",
              )}
              <details className="panel">
                <summary>Возможные ответы</summary>
                <p>Although my parents are busy, they make time for me.</p>
                <p>My sister, who lives abroad, calls every Sunday.</p>
                <p>If we lived nearby, we would meet more often.</p>
              </details>
            </>
          )}
          {["personality", "family"].includes(section.kind) && (
            <>
              <div className="toolbar">
                <button
                  className="secondary"
                  onClick={() => p.openWords(speakingTopic)}
                >
                  Словарь темы
                </button>
                <button
                  className="secondary"
                  onClick={() => p.openTopic(speakingTopic)}
                >
                  Все вопросы и страницы handout
                </button>
              </div>
              {section.kind === "family" && p.family()}
              <TopicWorkout
                topic={speakingTopic}
                state={p.state}
                persist={p.persist}
                renderEditor={p.renderEditor}
              />
              <SpeakingCoach
                topicId={speakingTopic}
                words={material.words.filter((w) => w.topic === speakingTopic)}
                state={p.state}
                persist={p.persist}
              />
              <BandGuide />
              <section className="panel">
                <h3>Практика по исходному handout</h3>
                {material.questions
                  .filter((q) => q.topic === speakingTopic)
                  .map((q) => (
                    <details key={q.id} className="course-question">
                      <summary>
                        <span className="pill">Part {q.part}</span> {q.text}
                      </summary>
                      {p.renderEditor(
                        "answer:" + q.id,
                        "План ответа",
                        "Ключевые идеи и один пример…",
                      )}
                      <SpeakingRecorder questionId={q.id} prompt={q.text} />
                    </details>
                  ))}
              </section>
            </>
          )}
          {section.kind === "homework" && (
            <>
              <section className="panel">
                <h3>Закрепи занятие</h3>
                {(lesson.id === "1"
                  ? [
                      "Напиши эссе по одной из пяти тем и проверь пунктуацию.",
                      "Запиши ответ о человеке, которого ты ценишь.",
                      "Используй 3 выражения Personality в своих примерах.",
                    ]
                  : [
                      "Заверши Passage 1 и объясни каждую ошибку строкой из текста.",
                      "Напиши 4 предложения о семье с разными сложными конструкциями.",
                      "Запиши ответ Family, затем перезапиши после фидбека.",
                    ]
                ).map((x, i) => (
                  <label className="check-item" key={x}>
                    <input
                      type="checkbox"
                      checked={
                        !!p.state["check:homework-" + lesson.id + "-" + i]
                      }
                      onChange={(e) =>
                        void p.persist(
                          "check:homework-" + lesson.id + "-" + i,
                          e.target.checked,
                        )
                      }
                    />
                    {x}
                  </label>
                ))}
                {editor(
                  "homework",
                  "Моя работа и вопросы",
                  "Вставь текст домашнего задания или запиши, что было сложно.",
                )}
                {cloud ? (
                  <p>
                    Отправь домашнюю работу на проверку. Комментарий
                    преподавателя появится в «Моём кабинете» рядом с твоей
                    работой.
                  </p>
                ) : (
                  p.renderEditor(
                    "note:teacher-feedback-" + lesson.id,
                    "Фидбек преподавателя к занятию",
                    "Сильные стороны → один приоритет → конкретный следующий шаг.",
                  )
                )}
              </section>
              <SpeakingRecorder
                questionId={"course-homework-" + lesson.id}
                prompt={
                  lesson.id === "1"
                    ? "Describe a person whose personality you admire."
                    : "How has your family influenced the person you are today?"
                }
              />
            </>
          )}
          <TeacherBlock
            id={lesson.id + "-" + section.id}
            state={p.state}
            persist={p.persist}
          />
          <div className="section-finish">
            <label>
              <input
                type="checkbox"
                checked={!!p.state[key]}
                disabled={!p.ready}
                onChange={(e) => void p.persist(key, e.target.checked)}
              />{" "}
              Раздел пройден
            </label>
            <button
              className="primary"
              onClick={() =>
                current < lesson.sections.length - 1
                  ? open(lesson.id, lesson.sections[current + 1].id)
                  : setLessonId(null)
              }
            >
              {current < lesson.sections.length - 1
                ? "Следующий раздел"
                : "К программе"}{" "}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
