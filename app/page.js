"use client";

import { useRef } from "react";
import { ParticlesMorphCanvas } from "@/components/particles-morph";

export default function Home() {
  const controller = useRef(null);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <ParticlesMorphCanvas controllerRef={controller} />
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          display: "flex",
          gap: 8,
        }}
      >
        {[0, 1, 2, 3].map((index) => (
          <button key={index} onClick={() => controller.current?.morph(index)}>
            Shape {index}
          </button>
        ))}
      </div>
    </div>
  );
}
