"use client";
import {
  ArrowRight,
  BookOpen,
  Headphones,
  Mic,
  PenLine,
  GraduationCap,
  Bookmark,
  FolderOpen,
  CheckCircle2,
} from "lucide-react";
import material from "@/data/materials.json";
export const skills = [
  {
    id: "listening",
    name: "Listening",
    ru: "Понимать на слух",
    icon: Headphones,
    description: "Слушай запись, выделяй главное и проверяй понимание.",
    count: "Аудио + видео · Family",
    steps: ["Послушай", "Разбери", "Закрепи"],
  },
  {
    id: "reading",
    name: "Reading",
    ru: "Читать и понимать",
    icon: BookOpen,
    description: "Разбирай тексты, находи ответы и пополняй словарь.",
    count: "Passage 1 · 2 статьи",
    steps: ["Изучи стратегию", "Прочитай", "Ответь"],
  },
  {
    id: "writing",
    name: "Writing",
    ru: "Писать уверенно",
    icon: PenLine,
    description: "Построй аргументы, составь план и напиши своё эссе.",
    count: `Task 2 · ${material.writing.length} тем для эссе`,
    steps: ["Разбери тему", "Составь план", "Напиши"],
  },
  {
    id: "speaking",
    name: "Speaking",
    ru: "Говорить свободнее",
    icon: Mic,
    description: "Развивай ответы, используй лексику и записывай речь.",
    count: `${material.topics.length} тем · ${material.questions.length} вопросов`,
    steps: ["Собери идеи", "Ответь", "Запиши"],
  },
] as const;
type SkillId = (typeof skills)[number]["id"];
type Resource = {
  title: string;
  description: string;
  meta: string;
  href: string;
  doneKey?: string;
};
const resources: Record<SkillId, Resource[]> = {
  listening: [
    {
      title: "Family: аудио и упражнения",
      description:
        "8 Ways to Improve Parent Child Relationship. Оригинальная запись, видео и задания на понимание.",
      meta: "Начни здесь · аудио + видео",
      href: "boost/audio",
      doneKey: "check:boost-listening",
    },
    {
      title: "Лексика для прослушивания",
      description: "Освежи слова о семье и воспитании, затем вернись к записи.",
      meta: "Словарь · Family",
      href: "words/1",
    },
    {
      title: "Перескажи услышанное",
      description:
        "Запиши голосом главную мысль и свой пример. Прослушай ответ и обсуди его с преподавателем.",
      meta: "Запись ответа",
      href: "audio",
    },
  ],
  reading: [
    {
      title: "Как работать с текстом",
      description:
        "Введение в Reading: общий смысл, поиск деталей и работа с вопросами.",
      meta: "Теория · урок 2",
      href: "course/2/reading",
      doneKey: "check:course-2-reading",
    },
    {
      title: "Passage 1: текст и вопросы",
      description:
        "Прочитай учебный текст, выполни задания и посмотри объяснения к ответам.",
      meta: "Практика · урок 2",
      href: "course/2/passage",
      doneKey: "check:course-2-passage",
    },
    {
      title: "Статьи о семье и поколениях",
      description:
        "Два оригинальных источника, новые выражения и открытые вопросы для обсуждения.",
      meta: "2 статьи · Language Boost",
      href: "boost/articles",
    },
  ],
  writing: [
    {
      title: "Как построить Task 2",
      description:
        "Разбери тип задания, позицию и структуру аргумента перед написанием эссе.",
      meta: "Теория · урок 1",
      href: "course/1/writing",
      doneKey: "check:course-1-writing",
    },
    {
      title: "Практика эссе: 5 тем",
      description:
        "Выбери тему, составь план, запусти таймер и сохрани свой текст.",
      meta: "Task 2 · редактор + таймер",
      href: "writing-practice",
    },
    {
      title: "Пунктуация без путаницы",
      description:
        "Запятые, вводные слова и соединение предложений: правила и упражнения.",
      meta: "5 упражнений · урок 1",
      href: "course/1/punctuation",
      doneKey: "check:course-1-punctuation",
    },
    {
      title: "Сложные предложения",
      description:
        "Научись связывать идеи и потренируй грамматические конструкции.",
      meta: "Грамматика · урок 2",
      href: "course/2/grammar",
      doneKey: "check:course-2-grammar",
    },
  ],
  speaking: [
    {
      title: "Family: полный урок",
      description:
        "Вопросы, тематическая лексика, примеры и все исходные материалы по семье.",
      meta: "Speaking Family",
      href: "speaking-practice/family",
    },
    {
      title: "Вопросы по 20 темам",
      description:
        "Выбери тему и Part 1, 2 или 3. Подготовь ответ по опоре и запиши его.",
      meta: `${material.questions.length} вопросов · handout`,
      href: "speaking-practice/questions",
    },
    {
      title: "Развиваем ответ: Personality",
      description:
        "Идеи, упражнения с лексикой и примеры того, как сделать ответ подробнее.",
      meta: "Практика · урок 1",
      href: "course/1/personality",
      doneKey: "check:course-1-personality",
    },
    {
      title: "Мои записи и комментарии",
      description:
        "Прослушай свои попытки и разбери обратную связь вместе с преподавателем.",
      meta: "Аудиопрактика · на этом устройстве",
      href: "audio",
    },
  ],
};
export function SkillsHome({ state }: { state: Record<string, unknown> }) {
  const last = state["last:course"] as
    { lesson?: string; section?: string } | undefined;
  const resume =
    last?.lesson && ["1", "2"].includes(last.lesson)
      ? `course/${last.lesson}/${last.section || "welcome"}`
      : "lessons";
  return (
    <div className="skills-home">
      <header className="skills-intro">
        <div>
          <span className="eyebrow">
            BAZUKASCHOOL · ТВОЯ ПОДГОТОВКА К IELTS
          </span>
          <h1>Что практикуем сегодня?</h1>
          <p>
            Выбери навык. Внутри — материалы, упражнения и понятный следующий
            шаг.
          </p>
        </div>
        <a className="course-resume" href={"#" + resume}>
          <GraduationCap size={22} />
          <span>
            <b>Учиться по порядку</b>
            <small>Продолжить основной курс</small>
          </span>
          <ArrowRight size={20} />
        </a>
      </header>
      <div className="skill-grid">
        {skills.map(({ id, name, ru, icon: Icon, description, count }) => (
          <a className={"skill-card skill-" + id} href={"#" + id} key={id}>
            <div className="skill-card-copy">
              <span className="skill-russian">{ru}</span>
              <h2>{name}</h2>
              <p>{description}</p>
              <small>{count}</small>
            </div>
            <Icon
              className="skill-illustration"
              aria-hidden="true"
              strokeWidth={1.3}
            />
            <span className="skill-arrow" aria-hidden="true">
              <ArrowRight size={22} />
            </span>
          </a>
        ))}
      </div>
      <section className="study-toolbox" aria-labelledby="toolbox-title">
        <div>
          <h2 id="toolbox-title">Всё для занятий</h2>
          <p>Материалы всегда под рукой.</p>
        </div>
        <div className="toolbox-grid">
          <a href="#words">
            <Bookmark />
            <span>
              <b>Мой словарь</b>
              <small>Слова, переводы и произношение</small>
            </span>
            <ArrowRight size={17} />
          </a>
          <a href="#cards">
            <BookOpen />
            <span>
              <b>Повторение слов</b>
              <small>Карточки и тренировка памяти</small>
            </span>
            <ArrowRight size={17} />
          </a>
          <a href="#library">
            <FolderOpen />
            <span>
              <b>Библиотека</b>
              <small>PDF, слайды и все оригиналы</small>
            </span>
            <ArrowRight size={17} />
          </a>
        </div>
      </section>
      <div className="study-start">
        <b>Первый раз здесь?</b>
        <p>
          Открой основной курс: занятия объединяют несколько навыков. Для
          отдельной тренировки выбирай одну из четырёх секций выше.
        </p>
        <a href="#lessons">
          Открыть курс <ArrowRight size={16} />
        </a>
      </div>
    </div>
  );
}
export function SkillSection({
  id,
  state,
}: {
  id: SkillId;
  state: Record<string, unknown>;
}) {
  const skill = skills.find((s) => s.id === id)!;
  const Icon = skill.icon;
  return (
    <div className={"skill-section skill-" + id}>
      <header className="skill-section-header">
        <span className="skill-section-icon">
          <Icon size={34} />
        </span>
        <div>
          <span className="eyebrow">{skill.ru}</span>
          <h1>{skill.name}</h1>
          <p>{skill.description}</p>
        </div>
      </header>
      <ol className="skill-steps" aria-label="Порядок практики">
        {skill.steps.map((step, i) => (
          <li key={step}>
            <span>{i + 1}</span>
            {step}
          </li>
        ))}
      </ol>
      <div className="section-list-heading">
        <h2>Материалы и практика</h2>
        <span>{resources[id].length} блока</span>
      </div>
      <div className="skill-resource-list">
        {resources[id].map((r, i) => (
          <a href={"#" + r.href} className="skill-resource" key={r.href}>
            <span className="resource-index" aria-hidden="true">
              {r.doneKey && state[r.doneKey] ? (
                <CheckCircle2 size={22} />
              ) : (
                String(i + 1).padStart(2, "0")
              )}
            </span>
            <div>
              <small>
                {r.meta}
                {r.doneKey && state[r.doneKey] ? " · Пройдено" : ""}
              </small>
              <h3>{r.title}</h3>
              <p>{r.description}</p>
            </div>
            <ArrowRight className="resource-arrow" size={22} />
          </a>
        ))}
      </div>
      {id === "listening" && (
        <p className="section-note">
          Сейчас здесь одна тематическая запись с заданиями. Это тренировка
          понимания речи, а не полный пробный Listening.
        </p>
      )}
      {id === "reading" && (
        <p className="section-note">
          Passage 1 — учебный текст с упражнениями. Полного пробного Reading из
          трёх текстов здесь пока нет.
        </p>
      )}
      <aside className="section-help">
        <b>Нужны слова для ответа?</b>
        <p>Сохраняй полезные выражения в словаре и повторяй их в карточках.</p>
        <a href="#words">
          Перейти в словарь <ArrowRight size={16} />
        </a>
      </aside>
    </div>
  );
}
