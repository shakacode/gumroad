import * as React from "react";

import Countdown from "$app/utils/countdown";

import { useProductHydration } from "$app/components/PublicPages/ProductHydration.client";

const formatDurationComponent = (component?: number) => (component ?? 0).toString().padStart(2, "0");
const formatDuration = (remainingSeconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(remainingSeconds));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  let durationString = "";
  if (days) durationString += `${formatDurationComponent(days)}:`;
  if (days || hours) durationString += `${formatDurationComponent(hours)}:`;
  durationString += `${formatDurationComponent(minutes)}:${formatDurationComponent(seconds)}`;
  return durationString;
};

export const DiscountExpirationCountdown = ({
  onExpiration,
  expiresAt,
}: {
  expiresAt: Date;
  onExpiration: () => void;
}) => {
  const snapshot = useProductHydration();
  const [secondsUntilExpiration, setSecondsUntilExpiration] = React.useState(
    () => (expiresAt.getTime() - (snapshot?.referenceTime ?? Date.now())) / 1000,
  );

  // Deliberately a plain useEffect rather than useRunOnce: Countdown owns a 1-second setInterval
  // that has to be aborted on unmount, and useRunOnce cannot honour a returned cleanup.
  React.useEffect(() => {
    const remainingSeconds = (expiresAt.getTime() - Date.now()) / 1000;
    setSecondsUntilExpiration(remainingSeconds);
    if (remainingSeconds <= 0) {
      onExpiration();
      return;
    }
    const countdown = new Countdown(remainingSeconds, setSecondsUntilExpiration, onExpiration);
    return () => countdown.abort();
    // Mount-once, matching the previous useRunOnce contract: expiresAt and
    // onExpiration are read from the first render only, so the interval is never rebuilt.
  }, []);

  // Don't render the countdown if it's greater than 7 days
  if (secondsUntilExpiration > 60 * 60 * 24 * 7) return null;

  return (
    <div>
      This discount expires in <strong>{formatDuration(secondsUntilExpiration)}</strong>
    </div>
  );
};
