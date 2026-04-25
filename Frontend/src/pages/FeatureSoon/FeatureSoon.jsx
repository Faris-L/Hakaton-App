import { Link } from "react-router-dom";
import "./featureSoon.scss";

/**
 * @param {{ title: string, subtitle: string, emoji: string }} props
 */
export default function FeatureSoon({ title, subtitle, emoji = "◆" }) {
  return (
    <div className="fs">
      <div className="fs__inner">
        <span className="fs__emoji" aria-hidden>
          {emoji}
        </span>
        <h1 className="fs__title">{title}</h1>
        <p className="fs__sub">{subtitle}</p>
        <p className="fs__badge">Uskoro u Nexori</p>
        <Link to="/home" className="fs__back">
          ← Početna
        </Link>
      </div>
    </div>
  );
}
