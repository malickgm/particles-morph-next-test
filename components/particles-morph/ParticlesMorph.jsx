'use client'

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import particlesVertexShader from './shaders/vertex'
import particlesFragmentShader from './shaders/fragment'

const DEFAULT_MODEL_URL = '/particles-morph/models.glb'
const DEFAULT_DRACO_PATH = '/particles-morph/draco/'

/**
 * Builds one equal-length position attribute per mesh in the model, padding
 * shorter meshes by resampling random points from themselves - this is what
 * lets the vertex shader morph between shapes with different vertex counts.
 */
function buildMorphTargets (scene) {
  const meshPositions = scene.children.map((child) => child.geometry.attributes.position)

  let maxCount = 0
  for (const position of meshPositions) {
    if (position.count > maxCount) maxCount = position.count
  }

  const positions = meshPositions.map((position) => {
    const originalArray = position.array
    const newArray = new Float32Array(maxCount * 3)

    for (let i = 0; i < maxCount; i++) {
      const i3 = i * 3

      if (i3 < originalArray.length) {
        newArray[i3 + 0] = originalArray[i3 + 0]
        newArray[i3 + 1] = originalArray[i3 + 1]
        newArray[i3 + 2] = originalArray[i3 + 2]
      } else {
        const randomIndex = Math.floor(position.count * Math.random()) * 3
        newArray[i3 + 0] = originalArray[randomIndex + 0]
        newArray[i3 + 1] = originalArray[randomIndex + 1]
        newArray[i3 + 2] = originalArray[randomIndex + 2]
      }
    }

    return new THREE.Float32BufferAttribute(newArray, 3)
  })

  return { positions, maxCount }
}

/**
 * Drop this inside an existing <Canvas>. Exposes an imperative `morph(index)`
 * method via ref instead of the original scene's lil-gui buttons, so it can
 * be triggered from scroll/route/whatever drives the rest of the app.
 */
export const ParticlesMorph = forwardRef(function ParticlesMorph (
  {
    modelUrl = DEFAULT_MODEL_URL,
    dracoDecoderPath = DEFAULT_DRACO_PATH,
    colorA = '#ff7300',
    colorB = '#0091ff',
    pointSize = 0.4,
    initialShape = 0,
    initialTargetShape = 3
  },
  ref
) {
  const { scene } = useGLTF(modelUrl, dracoDecoderPath)
  const geometryRef = useRef(null)
  const materialRef = useRef(null)
  const currentIndex = useRef(initialShape)
  const size = useThree((state) => state.size)
  const dpr = useThree((state) => state.viewport.dpr)

  const { geometry, positions } = useMemo(() => {
    const { positions, maxCount } = buildMorphTargets(scene)

    const sizesArray = new Float32Array(maxCount)
    for (let i = 0; i < maxCount; i++) sizesArray[i] = Math.random()

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', positions[initialShape])
    geometry.setAttribute('aPositionTarget', positions[initialTargetShape] ?? positions[initialShape])
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizesArray, 1))

    return { geometry, positions }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene])

  const uniforms = useMemo(() => ({
    uSize: new THREE.Uniform(pointSize),
    uResolution: new THREE.Uniform(new THREE.Vector2(size.width * dpr, size.height * dpr)),
    uProgress: new THREE.Uniform(0),
    uColorA: new THREE.Uniform(new THREE.Color(colorA)),
    uColorB: new THREE.Uniform(new THREE.Color(colorB))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [])

  useEffect(() => {
    currentIndex.current = initialShape
  }, [initialShape])

  useEffect(() => {
    geometryRef.current = geometry
  }, [geometry])

  useEffect(() => {
    materialRef.current?.uniforms.uResolution.value.set(size.width * dpr, size.height * dpr)
  }, [size, dpr])

  useEffect(() => {
    materialRef.current?.uniforms.uColorA.value.set(colorA)
  }, [colorA])

  useEffect(() => {
    materialRef.current?.uniforms.uColorB.value.set(colorB)
  }, [colorB])

  useEffect(() => {
    if (materialRef.current) materialRef.current.uniforms.uSize.value = pointSize
  }, [pointSize])

  const morph = (index) => {
    if (!geometryRef.current || !materialRef.current || !positions[index]) return

    geometryRef.current.attributes.position = positions[currentIndex.current]
    geometryRef.current.attributes.aPositionTarget = positions[index]

    gsap.fromTo(
      materialRef.current.uniforms.uProgress,
      { value: 0 },
      { value: 1, duration: 3, ease: 'linear' }
    )

    currentIndex.current = index
  }

  useImperativeHandle(ref, () => ({
    morph,
    get currentShape () { return currentIndex.current },
    shapeCount: positions.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [positions])

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={particlesVertexShader}
        fragmentShader={particlesFragmentShader}
        uniforms={uniforms}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
})

/**
 * Standalone drop-in with its own <Canvas> + OrbitControls, for quick testing
 * or a page that doesn't already have a shared canvas. Pass `controllerRef`
 * to reach the same morph(index) imperative API.
 */
export function ParticlesMorphCanvas ({
  background = '#160920',
  className,
  style,
  controllerRef,
  ...particlesProps
}) {
  return (
    <Canvas
      className={className}
      style={style}
      dpr={[1, 2]}
      gl={{ antialias: true }}
      camera={{ fov: 35, near: 0.1, far: 100, position: [0, 0, 16] }}
    >
      <color attach="background" args={[background]} />
      <ParticlesMorph ref={controllerRef} {...particlesProps} />
      <OrbitControls enableDamping />
    </Canvas>
  )
}

useGLTF.preload(DEFAULT_MODEL_URL)
