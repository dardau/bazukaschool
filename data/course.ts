export const lessons = [
  {
    id: "1",
    title: "Express yourself",
    subtitle: "Writing Task 2 · Personality · Пунктуация",
    tone: "peach",
    sections: [
      { id: "welcome", title: "План занятия", kind: "welcome" },
      { id: "writing", title: "Writing Task 2", kind: "writing" },
      {
        id: "personality",
        title: "Speaking · Personality",
        kind: "personality",
      },
      { id: "punctuation", title: "Пунктуация", kind: "punctuation" },
      { id: "homework", title: "Домашняя работа", kind: "homework" },
    ],
  },
  {
    id: "2",
    title: "Make connections",
    subtitle: "Reading · Passage 1 · Grammar · Family",
    tone: "mint",
    sections: [
      { id: "welcome", title: "План занятия", kind: "welcome" },
      { id: "reading", title: "Reading: введение", kind: "reading" },
      { id: "passage", title: "Passage 1: практика", kind: "passage" },
      { id: "grammar", title: "Complex structures", kind: "grammar" },
      { id: "family", title: "Speaking · Family", kind: "family" },
      { id: "homework", title: "Домашняя работа", kind: "homework" },
    ],
  },
];
export type QuizItem = {
  question: string;
  options: string[];
  answer: number;
  why: string;
};
export const punctuation: QuizItem[] = [
  {
    question: "Выбери корректное предложение.",
    options: [
      "Although she is quiet, she enjoys meeting new people.",
      "Although she is quiet she, enjoys meeting new people.",
      "Although, she is quiet she enjoys meeting new people.",
    ],
    answer: 0,
    why: "После придаточного с Although в начале предложения ставим запятую. Сам союз не отделяем от его придаточного.",
  },
  {
    question:
      "Исправь comma splice: My brother is reliable, he always keeps his promises.",
    options: [
      "My brother, is reliable he always keeps his promises.",
      "My brother is reliable; he always keeps his promises.",
      "My brother is reliable he, always keeps his promises.",
    ],
    answer: 1,
    why: "Две самостоятельные части нельзя соединять одной запятой. Здесь возможны точка с запятой, точка или союз: reliable, and he…",
  },
  {
    question: "Как оформить вводное However?",
    options: [
      "My sister is shy however she is a great speaker.",
      "My sister is shy, however she is a great speaker.",
      "My sister is shy. However, she is a great speaker.",
    ],
    answer: 2,
    why: "However не соединяет две самостоятельные части как and. Начни новое предложение или используй точку с запятой перед however.",
  },
  {
    question: "Выбери правильный апостроф: комната моих родителей (двух).",
    options: ["My parent's room", "My parents' room", "My parents room"],
    answer: 1,
    why: "Parents — множественное число на -s, поэтому апостроф ставится после s: parents’ room.",
  },
  {
    question:
      "В семье есть несколько сестёр. Уточняем, какая из них живёт в Астане.",
    options: [
      "My sister, who lives in Astana, is a teacher.",
      "My sister who lives in Astana is a teacher.",
    ],
    answer: 1,
    why: "Уточнение нужно для определения человека: defining relative clause не выделяем запятыми.",
  },
];
export const grammar: QuizItem[] = [
  {
    question: "Хотя родители заняты, они проводят время с детьми.",
    options: [
      "Although parents are busy, but they make time for their children.",
      "Although parents are busy, they make time for their children.",
      "Despite parents are busy, they make time for their children.",
    ],
    answer: 1,
    why: "Although + подлежащее + сказуемое. Не добавляй but в главную часть. После despite нужна именная группа или -ing.",
  },
  {
    question: "Выбери правильное условное предложение.",
    options: [
      "If parents will listen, children trust them.",
      "If parents listened more, their children would feel understood.",
      "If parents listened more, their children will felt understood.",
    ],
    answer: 1,
    why: "Second conditional: if + past simple, would + infinitive. Здесь воображаем изменение в настоящем.",
  },
  {
    question: "Соедини: My aunt raised me. She is very patient.",
    options: [
      "My aunt, who raised me, is very patient.",
      "My aunt, which raised me, is very patient.",
      "My aunt, who raised me is very patient.",
    ],
    answer: 0,
    why: "Для человека используем who. Дополнительная информация внутри предложения выделяется двумя запятыми.",
  },
  {
    question: "Выбери естественное противопоставление.",
    options: [
      "While my father is strict, my mother is more lenient.",
      "While my father is strict, but my mother is more lenient.",
      "Despite my father is strict, my mother is more lenient.",
    ],
    answer: 0,
    why: "While связывает две части и показывает контраст. Дополнительный but не нужен.",
  },
];
export const passage = [
  [
    "A",
    "A library of things",
    "In the fictional town of Westbridge, a public library has started lending objects as well as books. The pilot began in April with twenty household tools, including drills and sewing machines. The idea came from residents who owned equipment they used only once or twice a year. Instead of asking every household to buy the same items, the library invited people to borrow them. The project was designed to reduce unnecessary purchases, not to replace local repair businesses.",
  ],
  [
    "B",
    "Learning before borrowing",
    "Borrowers need a library card and must attend a short safety session before taking a powered tool home. During the session, a volunteer demonstrates how the tool works and asks each participant to practise using it. Tools can be borrowed for seven days. There is no borrowing fee, but damaged equipment must be reported immediately. The library does not accept every donated item: a technician checks that each object is safe and that replacement parts can be obtained.",
  ],
  [
    "C",
    "An unexpected benefit",
    "At first, organisers thought the service would mainly attract people living in small flats. In fact, the first hundred borrowers included both flat owners and people with large garages. Several participants said the practical advice mattered more to them than the money they saved. A retired carpenter now leads a weekly repair workshop. Younger residents have helped him create simple illustrated instructions, so knowledge moves in both directions rather than from one generation to another alone.",
  ],
  [
    "D",
    "Measuring success",
    "After six months, the team counted 430 loans. This figure did not show how many new purchases had actually been avoided, so a short survey was added to the return form. Borrowers were asked what they would have done if the item had not been available. Some would have bought a new tool, while others would simply have borrowed one from a friend. The organisers therefore decided against treating every loan as an avoided purchase.",
  ],
  [
    "E",
    "What happens next",
    "The next stage will test whether opening on Sunday helps residents who work during the week. A second branch is being considered, but no decision has been made. The organisers want to understand staffing and maintenance costs before expanding. They believe that a small, reliable service is more useful than a large collection of objects that cannot be repaired. The pilot suggests that sharing equipment can also create opportunities for neighbours to meet, although the town has not yet measured that effect.",
  ],
];
export const readingQuiz: QuizItem[] = [
  {
    question: "1. The pilot started with twenty household tools.",
    options: ["TRUE", "FALSE", "NOT GIVEN"],
    answer: 0,
    why: "A: “began in April with twenty household tools”. Число и предметы совпадают.",
  },
  {
    question: "2. Borrowers pay a fee for each loan.",
    options: ["TRUE", "FALSE", "NOT GIVEN"],
    answer: 1,
    why: "B: “There is no borrowing fee” прямо противоречит утверждению.",
  },
  {
    question: "3. Most borrowers were under thirty.",
    options: ["TRUE", "FALSE", "NOT GIVEN"],
    answer: 2,
    why: "Возраст большинства участников нигде не указан. Не делай вывод по упоминанию younger residents.",
  },
  {
    question: "4. Every loan was counted as an avoided purchase.",
    options: ["TRUE", "FALSE", "NOT GIVEN"],
    answer: 1,
    why: "D: команда решила не считать каждую выдачу предотвращённой покупкой.",
  },
  {
    question:
      "5. Which paragraph describes exchanging skills between generations?",
    options: ["A", "B", "C", "D", "E"],
    answer: 2,
    why: "C: плотник ведёт занятия, а молодые жители помогают с иллюстрированными инструкциями.",
  },
  {
    question: "6. What must borrowers do before taking a powered tool home?",
    options: [
      "Buy replacement parts",
      "Attend a safety session",
      "Donate a tool",
    ],
    answer: 1,
    why: "B: обязательный safety session. Не путай требования к предметам и к заёмщикам.",
  },
  {
    question: "7. Why was a survey introduced?",
    options: [
      "To estimate purchases avoided more accurately",
      "To select younger borrowers",
      "To decide which books to buy",
    ],
    answer: 0,
    why: "D: число выдач само по себе не показывает число предотвращённых покупок.",
  },
  {
    question: "8. A second branch has already been approved.",
    options: ["TRUE", "FALSE", "NOT GIVEN"],
    answer: 1,
    why: "E: “no decision has been made”. Решение ещё не принято.",
  },
];
export const topicPractice: Record<
  string,
  {
    pairs: [string, string][];
    gaps: { text: string; answer: string; why: string }[];
    short: string;
    strong: string;
    analysis: string[];
  }
> = {
  "0": {
    pairs: [
      ["reliable", "тот, на кого можно положиться"],
      ["open-minded", "готовый рассматривать новые идеи"],
      ["resilient", "умеющий восстанавливаться после трудностей"],
      ["approachable", "тот, к кому легко обратиться"],
    ],
    gaps: [
      {
        text: "You can always count on Sara. She is ___.",
        answer: "reliable",
        why: "Count on someone = rely on someone: можно положиться.",
      },
      {
        text: "He considers views that differ from his own. He is ___.",
        answer: "open-minded",
        why: "Не просто friendly: здесь готовность рассматривать другие взгляды.",
      },
      {
        text: "After a setback, she tries again. She is ___.",
        answer: "resilient",
        why: "Resilience проявляется в реакции на трудности.",
      },
    ],
    short: "My friend is nice. She helps me.",
    strong:
      "I would say my friend Amina is very reliable. When I missed a week of classes, she shared her notes and helped me catch up without making me feel awkward. What I appreciate most is that she follows through on her promises, even when she is busy.",
    analysis: [
      "Reliable точнее, чем nice: названо конкретное качество.",
      "Пример с пропущенной неделей показывает качество в действии.",
      "When и what I appreciate помогают связать детали и объяснить личную оценку.",
    ],
  },
  "1": {
    pairs: [
      ["bring up", "воспитывать ребёнка"],
      ["keep in touch", "поддерживать связь"],
      ["sibling rivalry", "соперничество братьев и сестёр"],
      ["quality time", "время с полноценным вниманием друг к другу"],
    ],
    gaps: [
      {
        text: "Even though we live in different cities, we ___ every week.",
        answer: "keep in touch",
        why: "Поддерживать связь на расстоянии: keep in touch.",
      },
      {
        text: "My parents put their phones away so we can spend ___ together.",
        answer: "quality time",
        why: "Важна вовлечённость, а не просто количество часов.",
      },
      {
        text: "Competition between brothers and sisters is called ___.",
        answer: "sibling rivalry",
        why: "Устойчивое сочетание из исходного семейного словаря.",
      },
    ],
    short: "Family is important. They help me a lot.",
    strong:
      "My family is a real source of support, especially when I am under pressure. Before my final exams, my sister took over some of my household chores so I could concentrate on revision. That small gesture meant a lot because it showed that I did not have to manage everything on my own.",
    analysis: [
      "Source of support раскрывается через конкретную ситуацию.",
      "Household chores употреблено в естественном контексте.",
      "Последнее предложение объясняет значение события, а не повторяет family is important.",
    ],
  },
};
