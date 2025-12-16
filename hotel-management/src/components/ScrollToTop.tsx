import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Cada vez que cambia la ruta (pathname), subimos el scroll a 0
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}