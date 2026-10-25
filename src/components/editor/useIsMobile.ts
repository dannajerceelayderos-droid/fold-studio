"use client";
import { useEffect, useState } from "react";

const QUERY = "(max-width: 767px)";

export function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(QUERY);
    const on = () => setMobile(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return mobile;
}

export const isCoarsePointer = () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
