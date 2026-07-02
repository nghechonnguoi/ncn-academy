"use client";
import { useEffect, useState } from "react";

export function LiveTrafficCounter({ className }: { className?: string }) {
  const [count, setCount] = useState(500);

  useEffect(() => {
    const startDate = new Date('2026-07-02T00:00:00Z').getTime();
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - startDate) / 1000);
    
    // Base traffic: +1.5 every minute => elapsedSeconds / 40
    let baseCount = 500 + Math.floor(elapsedSeconds / 40);
    
    // Read from localStorage to ensure it never decreases for the user
    try {
      const saved = localStorage.getItem('ncn_traffic_count');
      if (saved && parseInt(saved) > baseCount) {
        baseCount = parseInt(saved);
      }
    } catch (e) {}

    let currentCount = baseCount;
    setCount(currentCount);

    let timeoutId: NodeJS.Timeout;
    function scheduleNext() {
      const delay = Math.floor(Math.random() * 40000) + 20000; // 20s - 60s
      timeoutId = setTimeout(() => {
        currentCount += Math.floor(Math.random() * 2) + 1;
        setCount(currentCount);
        try {
          localStorage.setItem('ncn_traffic_count', currentCount.toString());
        } catch (e) {}
        scheduleNext();
      }, delay);
    }
    
    scheduleNext();

    return () => clearTimeout(timeoutId);
  }, []);

  return <div className={className}>{count}</div>;
}
