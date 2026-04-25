/**
 * Ako je `url` link ka YouTube stranici (watch, youtu.be, shorts, embed),
 * vraća https://www.youtube.com/embed/VIDEO_ID — za <iframe>.
 * Inače null.
 */
export function getYoutubeEmbedUrl(input) {
  if (!input || typeof input !== "string") return null;
  const s = input.trim();
  if (!s || !/youtube\.com|youtu\.be/i.test(s)) return null;

  let m = s.match(
    /(?:youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/
  );
  if (m) return `https://www.youtube.com/embed/${m[1]}`;

  m = s.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;

  m = s.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;

  return null;
}
