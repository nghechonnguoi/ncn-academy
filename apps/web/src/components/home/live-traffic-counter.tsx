"use client";
import { useEffect, useState } from "react";

export function LiveTrafficCounter({ className }: { className?: string }) {
  const [count, setCount] = useState(500);

  useEffect(() => {
    const startDate = new Date('2026-07-02T00:00:00Z').getTime();
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - startDate) / 1000);
    let currentCount = 500 + Math.floor(elapsedSeconds / 1800);
    setCount(currentCount);

    let timeoutId: NodeJS.Timeout;
    function scheduleNext() {
      const delay = Math.floor(Math.random() * 60000) + 30000;
      timeoutId = setTimeout(() => {
        currentCount += Math.floor(Math.random() * 2) + 1;
        setCount(currentCount);
        scheduleNext();
      }, delay);
    }
    
    scheduleNext();

    return () => clearTimeout(timeoutId);
  }, []);

  return <div className={className}>{count}</div>;
}
