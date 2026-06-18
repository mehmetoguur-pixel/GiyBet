import { Suspense } from "react";
import Home from "@/components/home/HomePage";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#08080f]" />}>
      <Home />
    </Suspense>
  );
}
