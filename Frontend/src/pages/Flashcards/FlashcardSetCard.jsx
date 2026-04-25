import { useNavigate } from "react-router-dom";

export default function FlashcardSetCard({ set, rot }) {
  const navigate = useNavigate();

  const onCardClick = (e) => {
    if (e.target.closest("button")) return;
    if (set.cards_count) {
      navigate(`/flashcards/${set.id}/practice`);
    } else {
      navigate(`/flashcards/${set.id}/edit`);
    }
  };

  return (
    <article
      className="fc-set home-card home-card--flashcards"
      style={{ "--rot": rot }}
      role="group"
      onClick={onCardClick}
    >
      <div className="fc-set__visual home-card__visual" aria-hidden="true">
        🃏
      </div>
      <div className="fc-set__body home-card__body">
        <h2 className="home-card__title">{set.title}</h2>
        <p className="home-card__desc">
          {set.description || "Bez opisa"}{" "}
          <span className="fc-set__meta">· {set.cards_count ?? 0} kartica</span>
        </p>
        <div className="fc-set__row" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="home-card__btn"
            onClick={() => navigate(`/flashcards/${set.id}/practice`)}
            disabled={!set.cards_count}
          >
            Vežbaj →
          </button>
          <button
            type="button"
            className="fc-set__edit"
            onClick={() => navigate(`/flashcards/${set.id}/edit`)}
          >
            Uredi
          </button>
        </div>
      </div>
    </article>
  );
}
