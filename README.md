# 🌌 3D Particle Morphing — Next.js & Three.js

A high-performance, interactive 3D particle morphing application built with **Next.js 16 (App Router)**, **React 19**, **Three.js**, **React Three Fiber (R3F)**, **Drei**, and **GSAP**.

This project renders thousands of particles in real-time and transitions them between distinct 3D geometric shapes using custom GLSL shaders powered by 3D Simplex noise and staggered delay curves.

---

## ✨ Features

- **🌀 GPU-Accelerated Particle Morphing**: Smoothly interpolates positions between multiple 3D models directly in GLSL vertex shaders.
- **⚡ Dynamic Vertex Resampling & Balancing**: Automatically inspects GLTF meshes with differing vertex counts and pads shorter geometries by resampling random surface points, allowing seamless morphing across arbitrary meshes.
- **🌊 3D Simplex Noise Transition Curves**: Uses 3D noise in the vertex shader to create organic, non-linear staggered particle transitions instead of uniform linear movement.
- **🎨 Dynamic Color Gradients & Glow**: Fragment and vertex shaders blend dual color tones (`uColorA` and `uColorB`) with additive blending and soft radial alpha falloff.
- **🎛️ Imperative Ref Controller**: Exposes a clean imperative API (`controllerRef.current.morph(targetIndex)`) to trigger animations from UI buttons, scroll events, or routing.
- **📦 Standalone & Composable Components**:
  - `<ParticlesMorphCanvas />`: Out-of-the-box canvas with orbital camera controls and responsive viewport handling.
  - `<ParticlesMorph />`: Embeddable R3F primitive to integrate into existing 3D scenes.
- **🚀 Optimized Asset Loading**: Includes Draco-compressed GLTF models and WebAssembly Draco decoders for rapid initial load times.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Next.js 16** | React Framework with App Router & Turbopack |
| **React 19** | Modern UI Library |
| **Three.js** | WebGL 3D Engine |
| **@react-three/fiber** | React renderer for Three.js |
| **@react-three/drei** | Useful helpers, Draco decoders, and OrbitControls |
| **GSAP** | Tweening engine for shader uniform transitions |
| **Custom GLSL** | 3D Simplex noise vertex & fragment shaders |

---

## 📁 Project Structure

```text
particles-morph-next-test/
├── app/
│   ├── globals.css                # Global styling
│   ├── layout.js                  # Root layout
│   ├── page.js                    # Interactive demo UI with shape controls
│   └── page.module.css            # Page styles
├── components/
│   └── particles-morph/
│       ├── index.js               # Component exports
│       ├── ParticlesMorph.jsx      # Core R3F Particle Morphing component & Canvas wrapper
│       └── shaders/
│           ├── vertex.js          # GLSL vertex shader with 3D simplex noise & size attenuation
│           └── fragment.js        # GLSL fragment shader with circular disc alpha falloff
├── public/
│   └── particles-morph/
│       ├── draco/                 # Draco WASM decoders for compressed GLTF geometry
│       │   ├── draco_decoder.js
│       │   ├── draco_decoder.wasm
│       │   └── draco_wasm_wrapper.js
│       └── models.glb             # Draco-compressed multi-mesh 3D asset
├── next.config.mjs                # Next.js configuration
├── package.json                   # Dependencies and scripts
└── README.md                      # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have Node.js 18.18+ or 20+ installed.

### Installation

Clone the repository and install the dependencies:

```bash
# Using npm
npm install

# Or using pnpm
pnpm install
```

### Running Locally

Start the development server:

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the interactive particle scene.

### Building for Production

```bash
npm run build
npm run start
```

---

## 📖 Component API & Usage

### 1. Standalone Canvas (`ParticlesMorphCanvas`)

```jsx
'use client'

import { useRef } from 'react'
import { ParticlesMorphCanvas } from '@/components/particles-morph'

export default function ParticleScene() {
  const controller = useRef(null)

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <ParticlesMorphCanvas
        controllerRef={controller}
        background="#160920"
        colorA="#ff7300"
        colorB="#0091ff"
        pointSize={0.4}
        initialShape={0}
      />
      
      {/* UI Controls */}
      <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', gap: 10 }}>
        <button onClick={() => controller.current?.morph(0)}>Shape 0</button>
        <button onClick={() => controller.current?.morph(1)}>Shape 1</button>
        <button onClick={() => controller.current?.morph(2)}>Shape 2</button>
        <button onClick={() => controller.current?.morph(3)}>Shape 3</button>
      </div>
    </div>
  )
}
```

### 2. Embedded in Existing Three.js Canvas (`ParticlesMorph`)

```jsx
import { Canvas } from '@react-three/fiber'
import { ParticlesMorph } from '@/components/particles-morph'

function MyCustomScene({ morphRef }) {
  return (
    <Canvas camera={{ position: [0, 0, 16], fov: 35 }}>
      <ParticlesMorph
        ref={morphRef}
        modelUrl="/particles-morph/models.glb"
        dracoDecoderPath="/particles-morph/draco/"
        colorA="#ff0055"
        colorB="#00ffff"
        pointSize={0.45}
      />
    </Canvas>
  )
}
```

### Props Reference

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `modelUrl` | `string` | `'/particles-morph/models.glb'` | Path to the GLB/GLTF model containing target meshes |
| `dracoDecoderPath` | `string` | `'/particles-morph/draco/'` | Directory containing Draco WASM decoding libraries |
| `colorA` | `string (hex)` | `'#ff7300'` | Primary gradient color |
| `colorB` | `string (hex)` | `'#0091ff'` | Secondary gradient color |
| `pointSize` | `number` | `0.4` | Particle size scaling factor |
| `initialShape` | `number` | `0` | Index of the mesh to display upon load |
| `initialTargetShape` | `number` | `3` | Secondary position buffer target initialized on geometry |
| `background` | `string (hex)` | `'#160920'` | Canvas background color (for `ParticlesMorphCanvas`) |
| `controllerRef` | `React.Ref` | `undefined` | Ref providing `.morph(index)`, `.currentShape`, `.shapeCount` |

---

## 🔮 How the Morphing Shader Works

1. **Geometry Normalization (`buildMorphTargets`)**: When the GLTF model is loaded, the component finds the mesh with the highest vertex count ($N$) and expands all meshes to $N$ vertices using random point sampling.
2. **Noise Field Generation**: The vertex shader evaluates a 3D Simplex Noise function based on both the starting vertex coordinates and the target vertex coordinates.
3. **Staggered Progression**: Rather than all particles moving at once, each particle calculates an offset delay derived from its noise value:
   $$\text{delay} = (1.0 - \text{duration}) \times \text{noise}$$
   $$\text{progress} = \text{smoothstep}(\text{delay}, \text{delay} + \text{duration}, uProgress)$$
4. **GSAP Uniform Tween**: When `morph(index)` is called, GSAP tweens the `uProgress` uniform from `0.0` to `1.0` over 3 seconds, driving the particle transition.

---

## 📜 License

Private Repository — All rights reserved.
