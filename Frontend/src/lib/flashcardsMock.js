/** Fallback kad API nije dostupan (isti oblik kao backend). */
export const MOCK_FLASHCARD_SETS = [
  {
    id: 1,
    title: "Baze podataka",
    subject: "it",
    description: "SQL, relacije, indeksiranje",
    cards_count: 3,
    created_at: "2025-10-01T10:00:00.000000Z",
  },
  {
    id: 2,
    title: "Sistem krvnog pritiska",
    subject: "medicine",
    description: "Fiziologija, merenje, hipertenzija",
    cards_count: 2,
    created_at: "2025-10-12T10:00:00.000000Z",
  },
];

export const MOCK_SET_DETAILS = {
  1: {
    id: 1,
    title: "Baze podataka",
    subject: "it",
    description: "SQL, relacije, indeksiranje",
    created_at: "2025-10-01T10:00:00.000000Z",
    cards_count: 3,
    cards: [
      {
        id: 101,
        question: "Šta je primarni ključ?",
        answer: "Jedinstvena kolona (ili skup) koji identifikuje red u tabeli.",
        difficulty: "easy",
        flashcard_set_id: 1,
        created_at: "2025-10-01T10:00:00.000000Z",
        updated_at: "2025-10-01T10:00:00.000000Z",
      },
      {
        id: 102,
        question: "Kada se koristi JOIN?",
        answer: "Kad spajamo podatke iz više tabela u jedan rezultat.",
        difficulty: "medium",
        flashcard_set_id: 1,
        created_at: "2025-10-01T10:00:00.000000Z",
        updated_at: "2025-10-01T10:00:00.000000Z",
      },
      {
        id: 103,
        question: "Indeks i trade-off",
        answer: "Brži SELECT, više prostora, sporiji INSERT/UPDATE.",
        difficulty: "hard",
        flashcard_set_id: 1,
        created_at: "2025-10-01T10:00:00.000000Z",
        updated_at: "2025-10-01T10:00:00.000000Z",
      },
    ],
  },
  2: {
    id: 2,
    title: "Sistem krvnog pritiska",
    subject: "medicine",
    description: "Fiziologija, merenje, hipertenzija",
    created_at: "2025-10-12T10:00:00.000000Z",
    cards_count: 2,
    cards: [
      {
        id: 201,
        question: "Normalni očekivani SBP/DBP kod odraslog odmornog stanja (grubo)?",
        answer: "Cilj: oko 120/80 mmHg, varijacije su normalne; tačno po udzbeniku klinike.",
        difficulty: "easy",
        flashcard_set_id: 2,
        created_at: "2025-10-12T10:00:00.000000Z",
        updated_at: "2025-10-12T10:00:00.000000Z",
      },
      {
        id: 202,
        question: "Kratko: prehipertenzija",
        answer: "Povišen pritisak ispod kriterijuma dijagnoze hipertenzije — prati se.",
        difficulty: "medium",
        flashcard_set_id: 2,
        created_at: "2025-10-12T10:00:00.000000Z",
        updated_at: "2025-10-12T10:00:00.000000Z",
      },
    ],
  },
};

export function getMockSetList(subject) {
  if (!subject || subject === "all") {
    return [...MOCK_FLASHCARD_SETS];
  }
  return MOCK_FLASHCARD_SETS.filter((s) => s.subject === subject);
}

export function getMockSetById(id) {
  return MOCK_SET_DETAILS[Number(id)] || null;
}
