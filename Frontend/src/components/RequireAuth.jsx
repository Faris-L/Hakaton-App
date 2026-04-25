import { Navigate, useLocation } from "react-router-dom";
import { isSessionActive } from "../lib/nexoraSession.js";

export default function RequireAuth({ children }) {
  const loc = useLocation();
  if (!isSessionActive()) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  return children;
}
