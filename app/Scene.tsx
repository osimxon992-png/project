'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

/* One fixed WebGL scene behind the whole landing page. Scroll position picks a "shot" per section
   (crystal position/scale, card layout, camera distance, colour) and everything eases between shots. */

type Shot = { cx: number; cy: number; cz: number; cs: number; word: number; ring: number; grid: number; card: number; camZ: number; lime: number; wall: number; spin: number }

const SHOTS: Record<string, Shot> = {
  kv:           { cx: 0,    cy: 0.1, cz: 0,  cs: 1,    word: 1, ring: 1,   grid: 0, card: 1,   camZ: 8,   lime: 0,    wall: 1,    spin: 0.25 },
  jarayon:      { cx: -3.3, cy: 0.9, cz: -1, cs: 0.7,  word: 0, ring: 0.1, grid: 0, card: 0.9, camZ: 8.6, lime: 0,    wall: 0.7,  spin: 0.45 },
  missiya:      { cx: 3.1,  cy: 0,   cz: 0,  cs: 1.15, word: 0, ring: 0,   grid: 0, card: 0.5, camZ: 7.2, lime: 0,    wall: 0.45, spin: 0.2 },
  vizyon:       { cx: 3.1,  cy: 0.2, cz: 0.6, cs: 1.4, word: 0, ring: 0,   grid: 0, card: 0.5, camZ: 6.8, lime: 0.45, wall: 0.6,  spin: 0.55 },
  imkoniyatlar: { cx: 4.4,  cy: -1.7, cz: -1, cs: 0.6, word: 0, ring: 0,   grid: 1, card: 0.85, camZ: 8.2, lime: 0,   wall: 0.4,  spin: 0.3 },
  narxlar:      { cx: 0,    cy: 0,   cz: -3, cs: 1.1,  word: 0, ring: 0.7, grid: 0, card: 0.7, camZ: 9,   lime: 0,    wall: 0.35, spin: 0.15 },
  boshlash:     { cx: 0,    cy: 0.35, cz: 0, cs: 1.25, word: 0, ring: 1,   grid: 0, card: 1,   camZ: 7.6, lime: 1,    wall: 1,    spin: 0.65 },
}
const ORDER = Object.keys(SHOTS)

const PRODUCTS: [string, string, number][] = [
  ["Zig'ir ko'ylak", "289 000 so'm", 250], ['Charm sumka', "450 000 so'm", 18], ['Krossovka', "520 000 so'm", 200],
  ['Atir · 30 ml', "180 000 so'm", 320], ['Kepka', "95 000 so'm", 75], ['Qo\'l soati', "1 200 000 so'm", 45],
  ["Ko'zoynak", "140 000 so'm", 180], ['Hoodie', "310 000 so'm", 280],
]

const WALL_FRAG = /* glsl */ `
  uniform float uTime; uniform float uGlow; uniform vec3 uA; uniform vec3 uB;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    vec2 cells = vec2(28.0, 7.0);
    vec2 id = floor(vUv * cells);
    float h = hash(id);
    float flick = 0.55 + 0.45 * sin(uTime * (0.35 + h * 0.9) + h * 6.2831);
    vec3 col = mix(uA, uB, h) * (0.18 + 0.55 * h * flick);
    vec2 pg = abs(fract(vUv * cells) - 0.5);
    col += vec3(0.75, 0.75, 1.0) * smoothstep(0.484, 0.5, max(pg.x, pg.y)) * 0.32;
    vec2 fg = abs(fract(vUv * cells * 4.0) - 0.5);
    col += vec3(0.6, 0.6, 1.0) * smoothstep(0.46, 0.5, max(fg.x, fg.y)) * 0.05;
    float scan = 0.92 + 0.08 * sin(vUv.y * 900.0 + uTime * 2.0);
    float fade = smoothstep(0.05, 0.4, vUv.y) * smoothstep(0.95, 0.6, vUv.y);
    gl_FragColor = vec4(col * scan * fade * uGlow, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`

const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || 'sans-serif'

function wordTexture() {
  const font = cssVar('--font-display')
  const c = document.createElement('canvas')
  const g = c.getContext('2d')!
  const setFont = () => {
    g.font = `800 340px ${font}`
    g.fontStretch = 'expanded'
    g.letterSpacing = '10px'
  }
  setFont()
  const w = Math.ceil(g.measureText('SAHIFA').width) + 60
  c.width = w
  c.height = 330
  setFont() // resizing a canvas resets its context state
  g.fillStyle = '#fff'
  g.textBaseline = 'alphabetic'
  g.fillText('SAHIFA', 30, 292)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return { texture: t, aspect: c.width / c.height }
}

function cardTexture(name: string, price: string, hue: number) {
  const sans = cssVar('--font-sans')
  const mono = cssVar('--font-mono')
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 640
  const g = c.getContext('2d')!
  g.beginPath()
  g.roundRect(4, 4, 504, 632, 36)
  g.fillStyle = '#0b0b14'
  g.fill()
  g.lineWidth = 3
  g.strokeStyle = 'rgba(255,255,255,.22)'
  g.stroke()
  g.save()
  g.beginPath()
  g.roundRect(28, 28, 456, 400, 22)
  g.clip()
  const bg = g.createLinearGradient(28, 28, 484, 428)
  bg.addColorStop(0, `hsl(${hue} 85% 58%)`)
  bg.addColorStop(1, `hsl(${hue + 40} 80% 14%)`)
  g.fillStyle = bg
  g.fillRect(28, 28, 456, 400)
  const blob = g.createRadialGradient(215, 190, 8, 256, 228, 175)
  blob.addColorStop(0, 'rgba(255,255,255,.9)')
  blob.addColorStop(0.35, `hsla(${hue} 90% 75% / .55)`)
  blob.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = blob
  g.beginPath()
  g.arc(256, 228, 175, 0, Math.PI * 2)
  g.fill()
  g.restore()
  g.fillStyle = '#fff'
  g.font = `600 36px ${sans}`
  g.fillText(name, 32, 488)
  g.fillStyle = '#d7ff00'
  g.font = `400 30px ${mono}`
  g.fillText(price, 32, 536)
  g.beginPath()
  g.roundRect(32, 564, 210, 48, 24)
  g.strokeStyle = 'rgba(255,255,255,.5)'
  g.lineWidth = 2
  g.stroke()
  g.fillStyle = '#fff'
  g.font = `400 20px ${mono}`
  g.fillText('SAVATGA +', 56, 596)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

function dotTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  r.addColorStop(0, 'rgba(255,255,255,1)')
  r.addColorStop(0.3, 'rgba(255,255,255,.5)')
  r.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = r
  g.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(c)
}

// The Sahifa mark: a triangle with a triangular window, extruded and bevelled.
function markGeometry() {
  const tri = (r: number) => [0, 1, 2].map((k) => {
    const a = Math.PI / 2 + (k * 2 * Math.PI) / 3
    return new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r)
  })
  const shape = new THREE.Shape(tri(1.75))
  shape.holes.push(new THREE.Path(tri(0.78).reverse()))
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.15, bevelSegments: 8, curveSegments: 1 })
  geo.center()
  geo.computeVertexNormals()
  return geo
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export function Scene() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const ready = () => window.dispatchEvent(new Event('sahifa:ready'))
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
    } catch {
      ready() // no WebGL: the CSS gradient behind the canvas stays
      return
    }
    const mobile = window.matchMedia('(max-width: 900px)').matches
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.3 : 1.75))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.setClearColor(0x000000, 1)

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x000000, 11, 26)
    const pmrem = new THREE.PMREMGenerator(renderer)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
    camera.position.set(0, 0, 8)
    const mobileCam = window.matchMedia('(max-width: 900px)').matches ? 3.5 : 0

    const disposables: { dispose: () => void }[] = [env, pmrem]
    const keep = <T extends { dispose: () => void }>(x: T) => (disposables.push(x), x)

    // LED wall: open cylinder around the camera with a procedural panel shader.
    const wallMat = keep(new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: { uTime: { value: 0 }, uGlow: { value: 1 }, uA: { value: new THREE.Color('#1a1060') }, uB: { value: new THREE.Color('#5a46ff') } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: WALL_FRAG,
    }))
    const wall = new THREE.Mesh(keep(new THREE.CylinderGeometry(13, 13, 30, 128, 1, true)), wallMat)
    scene.add(wall)

    // Glass crystal + shards.
    const glass = keep(new THREE.MeshPhysicalMaterial({
      color: 0xffffff, roughness: 0.04, metalness: 0, transmission: 1, thickness: 1.4, ior: 1.6, dispersion: 4,
      iridescence: 0.9, iridescenceIOR: 1.35, iridescenceThicknessRange: [120, 480], clearcoat: 1, clearcoatRoughness: 0.05,
      attenuationColor: new THREE.Color('#8a7bff'), attenuationDistance: 3, envMapIntensity: 1.5,
    }))
    const crystalGroup = new THREE.Group()
    const crystal = new THREE.Mesh(keep(markGeometry()), glass)
    crystalGroup.add(crystal)
    const shardGeo = keep(new THREE.IcosahedronGeometry(0.2, 0))
    const shards = Array.from({ length: mobile ? 4 : 7 }, (_, i) => {
      const m = new THREE.Mesh(shardGeo, glass)
      m.userData = { a: (i / 7) * Math.PI * 2, r: 2.3 + (i % 3) * 0.35, s: 0.6 + (i % 4) * 0.3 }
      crystalGroup.add(m)
      return m
    })
    scene.add(crystalGroup)

    const limeLight = new THREE.PointLight('#d7ff00', 0, 12)
    const indigoLight = new THREE.PointLight('#5a46ff', 40, 14)
    scene.add(limeLight, indigoLight)

    // Particles.
    const count = mobile ? 500 : 1400
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const lime = new THREE.Color('#d7ff00')
    const violet = new THREE.Color('#8f80ff')
    for (let i = 0; i < count; i++) {
      const r = 3 + Math.random() * 9
      const a = Math.random() * Math.PI * 2
      pos.set([Math.cos(a) * r, (Math.random() - 0.5) * 16, Math.sin(a) * r - 2], i * 3)
      ;(Math.random() < 0.12 ? lime : violet).toArray(col, i * 3)
    }
    const pGeo = keep(new THREE.BufferGeometry())
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    const points = new THREE.Points(pGeo, keep(new THREE.PointsMaterial({
      size: 0.06, map: keep(dotTexture()), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    })))
    scene.add(points)

    // Wordmark plane (opaque via alphaTest, so the glass refracts it) and product cards are built once fonts are ready.
    let word: THREE.Mesh | null = null
    let wordAspect = 1
    const cards: { mesh: THREE.Mesh; ring: number; y: number; grid: THREE.Vector3; scatter: THREE.Vector3; qs: THREE.Quaternion }[] = []
    const cardGeo = keep(new THREE.PlaneGeometry(1, 1.25))
    const gridQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.12, -0.42, 0))

    // The hidden DOM <h1> keeps its layout box; the GL wordmark is drawn over that box (stored in page pixels).
    const wordZ = -2.4
    let wordPx = { cx: 0, cy: 0, w: 0 }
    const layoutWord = () => {
      const el = document.querySelector('.kv-mark')
      if (!el) return
      const r = el.getBoundingClientRect()
      wordPx = { cx: r.left + r.width / 2, cy: r.top + window.scrollY + r.height / 2, w: r.width }
    }

    let alive = true
    document.fonts.ready.then(() => {
      if (!alive) return
      const wt = wordTexture()
      wordAspect = wt.aspect
      word = new THREE.Mesh(keep(new THREE.PlaneGeometry(1, 1)), keep(new THREE.MeshBasicMaterial({ map: keep(wt.texture), alphaTest: 0.5, color: new THREE.Color(0.95, 0.95, 1), toneMapped: false })))
      scene.add(word)
      layoutWord()

      const n = mobile ? 10 : 16
      const textures = PRODUCTS.map(([name, price, hue]) => keep(cardTexture(name, price, hue)))
      const mats = textures.map((map) => keep(new THREE.MeshStandardMaterial({ map, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.55, metalness: 0.1, envMapIntensity: 0.6 })))
      const cols = mobile ? 4 : 6
      for (let i = 0; i < n; i++) {
        const mesh = new THREE.Mesh(cardGeo, mats[i % mats.length])
        const gx = (i % cols) - (cols - 1) / 2
        const gy = Math.floor(i / cols) - (Math.ceil(n / cols) - 1) / 2
        const grid = new THREE.Vector3(gx * 1.35, -gy * 1.7, 0).applyQuaternion(gridQ).add(new THREE.Vector3(mobile ? 0 : 1.6, -0.2, -4.2))
        const scatter = new THREE.Vector3((Math.random() - 0.5) * 22, (Math.random() - 0.5) * 12, -4 - Math.random() * 8)
        const qs = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * 3, Math.random() * 3, Math.random() * 3))
        cards.push({ mesh, ring: (i / n) * Math.PI * 2, y: (Math.random() - 0.5) * 2.2, grid, scatter, qs })
        scene.add(mesh)
      }
    })

    // Bloom on desktop only; phones get the plain render.
    let composer: EffectComposer | null = null
    if (!mobile) {
      composer = new EffectComposer(renderer)
      composer.addPass(new RenderPass(scene, camera))
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.6, 0.82))
      composer.addPass(new OutputPass())
      disposables.push(composer)
    }

    const resize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
      composer?.setSize(w, h)
      layoutWord()
    }
    resize()
    window.addEventListener('resize', resize)

    const pointer = { x: 0, y: 0, sx: 0, sy: 0 }
    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onPointer, { passive: true })

    const sections = ORDER.map((id) => document.getElementById(id))
    // Hold each section's shot, then ease into the next one over the last ~0.9 screen of the section.
    const sample = (out: Shot) => {
      const mid = window.innerHeight / 2
      let i = 0
      let e = 0
      sections.forEach((s, k) => {
        if (!s) return
        const r = s.getBoundingClientRect()
        if (r.top <= mid) {
          i = k
          e = smooth(r.height - window.innerHeight * 0.9, r.height, mid - r.top)
        }
      })
      const a = SHOTS[ORDER[i]]
      const b = SHOTS[ORDER[Math.min(i + 1, ORDER.length - 1)]]
      for (const key in a) out[key as keyof Shot] = a[key as keyof Shot] + (b[key as keyof Shot] - a[key as keyof Shot]) * e
    }

    const cur: Shot = { ...SHOTS.kv }
    const target: Shot = { ...SHOTS.kv }
    const tmp = new THREE.Vector3()
    const ringPos = new THREE.Vector3()
    const dummy = new THREE.Object3D()
    const q = new THREE.Quaternion()
    const indigo = new THREE.Color('#8a7bff')
    let time = 0
    let spin = 0
    let last = performance.now()
    let raf = 0
    let first = true

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const motion = document.documentElement.dataset.motion !== 'off'
      if (motion) time += dt
      sample(target)
      const k = motion ? 1 - Math.exp(-dt * 3) : 1
      for (const key in cur) cur[key as keyof Shot] += (target[key as keyof Shot] - cur[key as keyof Shot]) * k
      const pk = motion ? 1 - Math.exp(-dt * 4) : 1
      pointer.sx += (pointer.x - pointer.sx) * pk
      pointer.sy += (pointer.y - pointer.sy) * pk

      const xs = mobile ? 0.42 : 1
      camera.position.set(pointer.sx * 0.55, pointer.sy * 0.35, cur.camZ + mobileCam)
      camera.lookAt(0, 0, 0)

      spin += dt * cur.spin * (motion ? 1 : 0)
      crystalGroup.position.set(cur.cx * xs, cur.cy + Math.sin(time * 0.8) * 0.1, cur.cz)
      crystalGroup.scale.setScalar(cur.cs * (mobile ? 0.85 : 1))
      crystal.rotation.set(Math.sin(time * 0.45) * 0.18 + pointer.sy * 0.25, spin + pointer.sx * 0.45, Math.sin(time * 0.3) * 0.05)
      shards.forEach((m) => {
        const { a, r, s } = m.userData as { a: number; r: number; s: number }
        const t = a + time * 0.35 * s
        m.position.set(Math.cos(t) * r, Math.sin(t * 1.3) * 0.9, Math.sin(t) * r * 0.6)
        m.rotation.set(time * s, time * 0.7 * s, 0)
      })
      glass.attenuationColor.copy(indigo).lerp(lime, cur.lime)
      limeLight.intensity = cur.lime * 60
      limeLight.position.set(crystalGroup.position.x + Math.cos(time) * 2.5, crystalGroup.position.y + 1.5, 2.5)
      indigoLight.position.set(crystalGroup.position.x + Math.sin(time * 0.7) * 3, -1.5, 2)

      wallMat.uniforms.uTime.value = time
      wallMat.uniforms.uGlow.value = cur.wall
      wall.rotation.y = time * 0.01 + pointer.sx * 0.03
      points.rotation.y = time * 0.025
      points.position.y = Math.sin(time * 0.2) * 0.3

      if (word) {
        // Pixel box -> world units at the plane's depth; follows the DOM while the hero scrolls away, then sinks back.
        const d = camera.position.z - wordZ
        const perPx = (2 * d * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / window.innerHeight
        const w = wordPx.w * perPx
        word.visible = cur.word > 0.01
        word.scale.set(w, w / wordAspect, 1)
        word.position.set(
          (wordPx.cx - window.innerWidth / 2) * perPx,
          -(wordPx.cy - window.scrollY - window.innerHeight / 2) * perPx,
          wordZ - (1 - cur.word) * 6,
        )
      }

      cards.forEach((c, i) => {
        const a = c.ring + time * 0.12
        const R = mobile ? 3.6 : 4.8
        ringPos.set(Math.cos(a) * R, c.y + Math.sin(time * 0.6 + i) * 0.25, Math.sin(a) * R * 0.75 - 0.5)
        tmp.copy(c.scatter).lerp(ringPos, cur.ring).lerp(c.grid, cur.grid)
        c.mesh.position.copy(tmp)
        dummy.position.copy(ringPos)
        dummy.lookAt(camera.position)
        q.copy(c.qs).slerp(dummy.quaternion, cur.ring).slerp(gridQ, cur.grid)
        c.mesh.quaternion.copy(q)
        c.mesh.scale.setScalar(Math.max(0.0001, cur.card))
        c.mesh.visible = cur.card > 0.02
      })

      if (composer) composer.render()
      else renderer.render(scene, camera)
      if (first) {
        first = false
        ready()
      }
    }
    raf = requestAnimationFrame(frame)

    const onVisibility = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
      document.removeEventListener('visibilitychange', onVisibility)
      disposables.forEach((x) => x.dispose())
      renderer.dispose()
    }
  }, [])

  return <canvas ref={ref} className="gl" aria-hidden="true" />
}
