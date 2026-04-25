export const MOCK_LECTURES = [
  {
    id: 1,
    title: "Uvod u fiziologiju",
    description:
      "Kratka priprema: srčana funkcija, krvni pritisak, osnove dijagnoze.",
    subject: "medicine",
    duration: "18 min",
    type: "audio",
    file_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    video_url: null,
    created_at: "2025-12-10T10:00:00.000000Z",
  },
  {
    id: 2,
    title: "Kognitivno ponašanje u stresu",
    description:
      "Kako stres menja fokus; saveti studentima za ispitne nedelje.",
    subject: "psychology",
    duration: "12 min",
    type: "audio",
    file_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    video_url: null,
    created_at: "2025-12-12T10:00:00.000000Z",
  },
  {
    id: 3,
    title: "Ponuda i tržišna cena",
    description:
      "Osnove ponude, potražnje, ravnoteže — primeri iz stvarnog života.",
    subject: "economy",
    duration: "9 min",
    type: "video",
    file_url: null,
    video_url:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
    created_at: "2025-12-15T10:00:00.000000Z",
  },
  {
    id: 4,
    title: "Nizovi u JavaScriptu",
    description: "Map, filter, immutability — bazični pristupi.",
    subject: "it",
    duration: "15 min",
    type: "video",
    file_url: null,
    video_url:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
    created_at: "2025-12-20T10:00:00.000000Z",
  },
];

export function getMockLectures(subject) {
  if (!subject || subject === "all") {
    return [...MOCK_LECTURES];
  }
  return MOCK_LECTURES.filter((L) => L.subject === subject);
}

export function getMockLectureById(id) {
  return MOCK_LECTURES.find((L) => L.id === Number(id)) || null;
}
