import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchFlashcardSet } from "../../api/flashcardsApi.js";
import FlashcardFlipCard from "./FlashcardFlipCard.jsx";

export default function FlashcardPractice() {
  const { setId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [setName, setSetName] = useState("");
  const [cards, setCards] = useState([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [unknown, setUnknown] = useState(0);
  const [finished, setFinished] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const s = await fetchFlashcardSet(Number(setId));
      if (!s) {
        setErr("Set nije pronađen.");
        setCards([]);
        return;
      }
      setSetName(s.title || "");
      const list = Array.isArray(s.cards) ? s.cards : [];
      setCards(list);
    } catch (e) {
      setErr(e?.message || "Greška pri učitavanju.");
    } finally {
      setLoading(false);
    }
  }, [setId]);

  useEffect(() => {
    load();
  }, [load]);

  const total = cards.length;
  const current = cards[idx];
  const n = total > 0 ? idx + 1 : 0;

  const goNext = () => {
    setFlipped(false);
    if (idx + 1 >= total) {
      setFinished(true);
    } else {
      setIdx((i) => i + 1);
    }
  };

  const onKnew = () => {
    setKnown((k) => k + 1);
    goNext();
  };

  const onUnknown = () => {
    setUnknown((u) => u + 1);
    goNext();
  };

  const onSkip = () => {
    goNext();
  };

  const percent =
    known + unknown > 0
      ? Math.round((100 * known) / (known + unknown))
      : 0;

  if (loading) {
    return (
      <div className="fc-inner">
        <p className="fc-muted">Učitavanje…</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="fc-inner">
        <p className="fc-err">{err}</p>
        <Link to="/flashcards" className="fc-linkback">
          ← Na listu
        </Link>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="fc-inner">
        <p className="fc-muted">U ovom setu još nema kartica. Dodaj ih u uredjivaču.</p>
        <button
          type="button"
          className="fc-btn fc-btn--ghost"
          onClick={() => navigate(`/flashcards/${setId}/edit`)}
        >
          Uredi set
        </button>
        <Link to="/flashcards" className="fc-linkback">
          ← Na listu
        </Link>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="fc-inner fc-result">
        <h2 className="fc-result__title">Gotovo</h2>
        <p className="fc-result__name">{setName}</p>
        <ul className="fc-result__list">
          <li>
            <strong>Znao/la si:</strong> {known}
          </li>
          <li>
            <strong>Nisi znao/la:</strong> {unknown}
          </li>
          <li>
            <strong>Uspešnost (samo karte gde si odlučio/la):</strong> {percent}%
          </li>
        </ul>
        <div className="fc-result__row">
          <button
            type="button"
            className="fc-btn fc-btn--pri"
            onClick={() => {
              setIdx(0);
              setFlipped(false);
              setKnown(0);
              setUnknown(0);
              setFinished(false);
            }}
          >
            Ponovi
          </button>
          <Link to="/flashcards" className="fc-btn fc-btn--ghost">
            Na listu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fc-inner fc-practice">
      <div className="fc-practice__head">
        <p className="fc-practice__progress">
          {n} / {total}
        </p>
        <h2 className="fc-practice__h">{setName}</h2>
      </div>
      {current ? (
        <FlashcardFlipCard
          question={current.question}
          answer={current.answer}
          flipped={flipped}
          onToggle={() => setFlipped((f) => !f)}
          difficulty={current.difficulty}
        />
      ) : null}
      <div className="fc-practice__actions">
        <button type="button" className="fc-btn fc-btn--good" onClick={onKnew}>
          Znao/la sam
        </button>
        <button type="button" className="fc-btn fc-btn--bad" onClick={onUnknown}>
          Nisam znao/la
        </button>
        <button type="button" className="fc-btn fc-btn--ghost" onClick={onSkip}>
          Sledeća
        </button>
      </div>
      <Link to="/flashcards" className="fc-linkback">
        ← Zatvori vežbanje
      </Link>
    </div>
  );
}
