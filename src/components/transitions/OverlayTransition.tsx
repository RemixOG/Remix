import { useEffect, useRef } from "react";

type Props = {
  active: boolean;
  onCovered: () => void;
  onComplete: () => void;
};

export default function OverlayTransition({
  active,
  onCovered,
  onComplete,
}: Props) {
  const completed = useRef(false);

  useEffect(() => {
    if (!active || completed.current) return;

    completed.current = true;
    onCovered();
    onComplete();
  }, [active, onCovered, onComplete]);

  return null;
}
