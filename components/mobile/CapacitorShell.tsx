"use client";

import { useEffect } from "react";
import { initCapacitorApp } from "@/lib/capacitor/native";

/** APK WebView: status bar, splash screen */
export function CapacitorShell() {
  useEffect(() => {
    void initCapacitorApp();
  }, []);

  return null;
}
