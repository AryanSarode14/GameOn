import { useEffect } from "react";

export default function useBodySport(sport) {
  useEffect(() => {
    if (sport) document.body.dataset.sport = sport;
    return () => {
      delete document.body.dataset.sport;
    };
  }, [sport]);
}
