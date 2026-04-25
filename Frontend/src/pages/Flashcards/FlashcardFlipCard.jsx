/**
 * Jedna kartica sa 3D flip animacijom (pitanje / odgovor).
 */
export default function FlashcardFlipCard({
  question,
  answer,
  flipped,
  onToggle,
  difficulty,
}) {
  const dLabel =
    difficulty === "easy"
      ? "Lako"
      : difficulty === "hard"
        ? "Teško"
        : "Srednje";

  return (
    <button
      type="button"
      className={"fc-flip" + (flipped ? " fc-flip--back" : "")}
      onClick={onToggle}
      aria-label={flipped ? "Prikaži pitanje" : "Prikaži odgovor"}
    >
      <div className="fc-flip__inner">
        <div className="fc-flip__face fc-flip__face--front">
          <span className="fc-flip__badge">{dLabel}</span>
          <p className="fc-flip__label">Pitanje</p>
          <p className="fc-flip__text">{question}</p>
          <span className="fc-flip__hint">Klikni da okreneš</span>
        </div>
        <div className="fc-flip__face fc-flip__face--back">
          <p className="fc-flip__label">Odgovor</p>
          <p className="fc-flip__text">{answer}</p>
        </div>
      </div>
    </button>
  );
}
