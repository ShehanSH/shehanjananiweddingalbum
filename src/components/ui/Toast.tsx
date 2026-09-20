"use client";

import { useEffect, useState } from "react";

export function Toast({ message }: { message: string }) {
  const [visible, setVisible] = useState(Boolean(message));
  useEffect(() => {
    setVisible(Boolean(message));
    if (!message) return;
    const timer = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(timer);
  }, [message]);
  if (!visible || !message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-brown px-5 py-2 text-sm text-ivory shadow-lg">
      {message}
    </div>
  );
}
