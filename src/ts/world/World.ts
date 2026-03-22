import * as THREE from "three"
import * as CANNON from "cannon"
import * as dat from "dat.gui"

import Stats from "three/examples/jsm/libs/stats.module"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { PositionalAudioHelper } from "three/examples/jsm/helpers/PositionalAudioHelper"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { FontLoader } from "three/examples/jsm/loaders/FontLoader"
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry"
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib"

import { InputManager } from "../core/InputManager"
import { CameraHandler } from "../core/CameraHandler"
import type { IUpdatable } from "../interfaces/IUpdatable"
import type { IWorldEntity } from "../interfaces/IWorldEntity"
import * as Utils from "../core/Utils"
import type { Character } from "../characters/Character"

// Inlined shaders (not applied to scene — kept for reference)
const _vertexShader = `
void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;
}
`
const _fragmentShader = `
void main() {
    gl_FragColor = vec4(1.0, 0.33, 0.33, 1.0);
}
`

export class World {
  document: Document
  worldContainer: HTMLElement
  inputManager!: InputManager
  cameraHandler!: CameraHandler
  updatableModules: IUpdatable[] = []
  characters: Character[] = []
  character!: THREE.Group
  useOrbitControls: boolean

  stats!: Stats
  clock!: THREE.Clock

  graphicsWorld!: THREE.Scene
  physicsWorld!: CANNON.World
  physicsFrameRate: number
  physicsFrameTime: number

  listener!: THREE.AudioListener
  positionalAudio!: THREE.PositionalAudio
  camera!: THREE.PerspectiveCamera
  renderer!: THREE.WebGLRenderer
  orbitControls!: OrbitControls
  textMesh!: THREE.Mesh
  mixer!: THREE.AnimationMixer

  videoTexture!: THREE.VideoTexture
  screenMaterial!: THREE.MeshStandardMaterial
  screenMesh!: THREE.Mesh

  // Physics / animation helpers
  collidableMeshes: THREE.Mesh[] = []
  charAnimations: { [name: string]: THREE.AnimationAction } = {}
  private _currentCharAnim: string = ""

  sceneSizes = {
    width: window.innerWidth,
    height: window.innerHeight,
  }
  filmScreenSizes = {
    width: 1920,
    height: 1080,
  }
  preTime: number = 0

  screenWidthSegments = 16
  screenHeightSegments = 16

  gui!: dat.GUI

  boundResize!: () => void
  boundFullscreen!: () => void

  private animFrameId: number = 0

  constructor(
    document: Document,
    worldContainerId: string,
    statsContainerId: string,
    videoElementId: string,
    useOrbitControls: boolean,
  ) {
    this.document = document
    this.worldContainer = document.getElementById(worldContainerId) as HTMLElement
    this.useOrbitControls = useOrbitControls

    this.physicsFrameRate = 60
    this.physicsFrameTime = 1 / this.physicsFrameRate

    this.init(statsContainerId, videoElementId)
  }

  init(statsContainerId: string, videoElementId: string) {
    const statElement = this.document.getElementById(statsContainerId)
    const videoElement = this.document.getElementById(videoElementId) as HTMLVideoElement | null

    if (!this.worldContainer || !statElement) {
      console.error("World: required DOM elements not found")
      return
    }

    RectAreaLightUniformsLib.init()

    this.clock = new THREE.Clock()

    // ── Stats ─────────────────────────────────────────────────────────────
    this.stats = Stats()
    statElement.appendChild(this.stats.domElement)
    for (let i = 0; i < this.stats.domElement.children.length; i++) {
      const panel = this.stats.domElement.children[i] as HTMLElement
      panel.style.display = "inline-block"
    }

    // ── GUI ───────────────────────────────────────────────────────────────
    this.gui = new dat.GUI({ width: 400 })

    // ── Renderer ──────────────────────────────────────────────────────────
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.outputEncoding = THREE.sRGBEncoding
    this.renderer.setSize(this.sceneSizes.width, this.sceneSizes.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.worldContainer.appendChild(this.renderer.domElement)

    // ── Params ────────────────────────────────────────────────────────────
    const controlParams = {
      refDistance: 7,
      coneInnerAngle: 180,
      coneOuterAngle: 230,
      screenWidth: 12,
      wallColor: "#696969",
      wallThickness: 0.5,
      hallWidth: 20,
      hallDepth: 20,
      screenPositionZ: 7,
      screenOffsetZ: 1,
      screenLiftDistance: 1.1,
    }

    // ── Scene ─────────────────────────────────────────────────────────────
    this.graphicsWorld = new THREE.Scene()

    this.physicsWorld = new CANNON.World()
    this.physicsWorld.gravity.set(0, -9.81, 0)
    this.physicsWorld.broadphase = new CANNON.SAPBroadphase(this.physicsWorld)
    this.physicsWorld.allowSleep = true

    // ── Video Texture ─────────────────────────────────────────────────────
    if (videoElement) {
      this.videoTexture = new THREE.VideoTexture(videoElement)
      this.videoTexture.minFilter = THREE.LinearFilter
      this.videoTexture.format = THREE.RGBAFormat
      this.videoTexture.needsUpdate = true
      this.videoTexture.encoding = THREE.sRGBEncoding
    }

    // ── Geometry ──────────────────────────────────────────────────────────
    const screenWidth = controlParams.screenWidth
    const screenHeight = (screenWidth * this.filmScreenSizes.height) / this.filmScreenSizes.width
    const wallOffsetX = screenWidth / 2 + controlParams.wallThickness / 2

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(controlParams.wallColor),
    })
    const wallGeometry = new THREE.BoxGeometry(
      controlParams.hallWidth,
      controlParams.hallDepth,
      controlParams.wallThickness,
      128,
      128,
    )

    const wallMeshLeft = new THREE.Mesh(wallGeometry, wallMaterial)
    wallMeshLeft.castShadow = true
    wallMeshLeft.rotation.y = -Math.PI / 2
    wallMeshLeft.position.set(-wallOffsetX, 0, 0)

    const wallMeshRight = new THREE.Mesh(wallGeometry, wallMaterial)
    wallMeshRight.castShadow = true
    wallMeshRight.rotation.y = Math.PI / 2
    wallMeshRight.position.set(wallOffsetX, 0, 0)

    const wallMeshBack = new THREE.Mesh(
      wallGeometry,
      new THREE.MeshStandardMaterial({ color: new THREE.Color("#000000") }),
    )
    wallMeshBack.castShadow = true
    wallMeshBack.position.set(0, 0, -controlParams.hallDepth / 2 - controlParams.wallThickness / 2)

    const groundMesh = new THREE.Mesh(
      new THREE.BoxGeometry(
        controlParams.hallWidth,
        controlParams.hallDepth,
        controlParams.wallThickness,
        128,
        128,
      ),
      new THREE.MeshStandardMaterial({ color: controlParams.wallColor }),
    )
    groundMesh.rotation.x = -Math.PI / 2
    groundMesh.position.y = -screenHeight / 2
    groundMesh.receiveShadow = true

    const hallGroup = new THREE.Group()
    hallGroup.add(wallMeshLeft, wallMeshRight, wallMeshBack, groundMesh)
    this.graphicsWorld.add(hallGroup)

    // Invisible low-poly ground collider (avoids raycasting the 32 K-triangle visual mesh)
    const groundCollider = new THREE.Mesh(
      new THREE.BoxGeometry(
        controlParams.hallWidth,
        controlParams.hallDepth,
        controlParams.wallThickness,
      ),
    )
    groundCollider.rotation.x = -Math.PI / 2
    groundCollider.position.y = -screenHeight / 2
    groundCollider.visible = false
    this.graphicsWorld.add(groundCollider)
    this.collidableMeshes.push(groundCollider)

    // ── Screen ────────────────────────────────────────────────────────────
    const screenGroup = new THREE.Group()
    const screenGeometry = new THREE.PlaneGeometry(
      screenWidth,
      screenHeight,
      this.screenWidthSegments,
      this.screenHeightSegments,
    )

    this.screenMaterial = new THREE.MeshStandardMaterial({
      side: THREE.DoubleSide,
      color: new THREE.Color("#111111"),
      emissive: new THREE.Color("#060d1a"),
      emissiveIntensity: 1.0,
    })

    const positionArray = new Float32Array(screenGeometry.attributes.position.array.length)
    const transformedPositionArray = new Float32Array(
      screenGeometry.attributes.position.array.length,
    )
    for (let i = 0; i < screenGeometry.attributes.position.array.length; i++) {
      positionArray[i] = screenGeometry.attributes.position.array[i]
      transformedPositionArray[i] = screenGeometry.attributes.position.array[i]
    }

    const generateScreen = () => {
      for (let rowIndex = 0; rowIndex <= this.screenHeightSegments; rowIndex++) {
        for (let colIndex = 0; colIndex <= this.screenWidthSegments; colIndex++) {
          const pointIndex = rowIndex * (this.screenWidthSegments + 1) + colIndex
          const curveDistance =
            controlParams.screenOffsetZ * Math.sin(Math.PI * (colIndex / this.screenWidthSegments))
          transformedPositionArray[pointIndex * 3 + 2] =
            positionArray[pointIndex * 3 + 2] - curveDistance
        }
      }
      screenGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(transformedPositionArray, 3),
      )
      screenGroup.position.y = controlParams.screenLiftDistance
    }
    generateScreen()

    // ── 3D Text ───────────────────────────────────────────────────────────
    const fontLoader = new FontLoader()
    fontLoader.load("/fonts/Inter_Bold.json", (font) => {
      const textGeometry = new TextGeometry("Press START to play", {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        font: font as any,
        size: 0.4,
        height: 0.05,
        curveSegments: 64,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelOffset: 0,
        bevelSegments: 64,
      })
      textGeometry.center()
      this.textMesh = new THREE.Mesh(textGeometry, new THREE.MeshNormalMaterial())
      screenGroup.add(this.textMesh)
    })

    this.screenMesh = new THREE.Mesh(screenGeometry, this.screenMaterial)
    this.screenMesh.receiveShadow = true
    screenGroup.add(this.screenMesh)

    // ── Hall generation ───────────────────────────────────────────────────
    const scaleRatio = 0.01
    const chairRowCount = 5
    const chairColCount = 15
    const chairIntervalX = 0.65
    const chairIntervalY = 0.4
    const chairIntervalZ = 1.2
    const originPostionX = -4.5
    const originPostionY = -screenHeight / 2 + controlParams.wallThickness / 2
    const originPostionZ = 2

    const generateHall = () => {
      const platformHeight = 0.4
      const platformGeometry = new THREE.BoxGeometry(screenWidth, platformHeight, 1.5)
      const lightPlatGeometry = new THREE.PlaneGeometry()
      const lightPlatMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })

      for (let row = 0; row < chairRowCount; row++) {
        const positionZ = originPostionZ + chairIntervalZ * row

        const platformMesh = new THREE.Mesh(platformGeometry, wallMaterial)
        platformMesh.position.set(0, originPostionY + chairIntervalY * row - 0.2, positionZ)
        hallGroup.add(platformMesh)
        this.collidableMeshes.push(platformMesh) // walkable surface

        if (row === chairRowCount - 1) {
          const platformBack = new THREE.Mesh(
            new THREE.BoxGeometry(screenWidth, platformHeight * chairRowCount, 1),
            wallMaterial,
          )
          platformBack.position.set(
            0,
            originPostionY + chairIntervalY + 0.2,
            positionZ + chairIntervalZ,
          )
          hallGroup.add(platformBack)
        }

        if (row % 2 === 0) {
          const lightOffsetX = screenWidth / 2 - 0.01
          const lightOffsetY = screenHeight / 2 - 5

          const rectLightLeft = new THREE.RectAreaLight("#ffffff", 1, 0.1, 10)
          rectLightLeft.rotation.y = -Math.PI / 2
          rectLightLeft.position.set(-lightOffsetX, -lightOffsetY, positionZ)
          hallGroup.add(rectLightLeft)
          const platMeshLeft = new THREE.Mesh(lightPlatGeometry, lightPlatMaterial)
          platMeshLeft.scale.set(0.1, 10, 1)
          rectLightLeft.add(platMeshLeft)

          const rectLightRight = rectLightLeft.clone()
          rectLightRight.rotation.y = Math.PI / 2
          rectLightRight.position.set(lightOffsetX, -lightOffsetY, positionZ)
          hallGroup.add(rectLightRight)
        }
      }
    }
    generateHall()

    // ── Models ────────────────────────────────────────────────────────────
    const generateChairs = (scene: THREE.Group) => {
      const chairList: THREE.Group[] = []

      const baseChair = scene
      baseChair.scale.set(scaleRatio, scaleRatio, scaleRatio)
      baseChair.position.set(originPostionX, originPostionY, originPostionZ)
      baseChair.rotation.y = Math.PI
      baseChair.castShadow = true

      for (let row = 0; row < chairRowCount; row++) {
        const positionZ = originPostionZ + chairIntervalZ * row

        const rowChair = baseChair.clone()
        rowChair.position.y = originPostionY + chairIntervalY * row
        rowChair.position.z = positionZ
        chairList.push(rowChair)

        for (let col = 1; col < chairColCount; col++) {
          const chair = rowChair.clone()
          chair.position.x = originPostionX + chairIntervalX * col
          chairList.push(chair)
        }

        for (let i = 0; i < chairList.length; i++) {
          chairList[i].traverse((child) => {
            if (
              child instanceof THREE.Mesh &&
              child.material instanceof THREE.MeshStandardMaterial
            ) {
              child.material.needsUpdate = true
              child.castShadow = false // 75 chairs casting shadows = messy floor shadow overdraw
              child.receiveShadow = true
            }
          })
          hallGroup.add(chairList[i])
        }
      }
    }

    const gltfLoader = new GLTFLoader()
    gltfLoader.load("/models/seats/cinema_chair.glb", (gltf) => {
      // generateChairs(gltf.scene)
    })

    gltfLoader.load("/models/characters/boxman.glb", (gltf) => {
      this.character = gltf.scene
      this.graphicsWorld.add(gltf.scene)
      // 1 unit above floor so gravity physics settles the character naturally
      gltf.scene.position.set(0, -screenHeight / 2 + controlParams.wallThickness / 2 + 1.0, 3)
      gltf.scene.rotation.y = Math.PI

      this.mixer = new THREE.AnimationMixer(gltf.scene)

      // Register every clip by lowercase name so we can look up 'run', 'idle', etc.
      gltf.animations.forEach((clip) => {
        this.charAnimations[clip.name.toLowerCase()] = this.mixer.clipAction(clip)
      })

      // Start in idle state.  If the model only ships a 'run' clip, we simply
      // leave no clip playing (character holds the rest/bind pose = visual idle).
      const idleAction =
        this.charAnimations["idle"] ??
        this.charAnimations["idle pose"] ??
        this.charAnimations["standing"] ??
        null
      if (idleAction) {
        idleAction.play()
      }
      this._currentCharAnim = "idle"

      // Activate third-person follow camera once character is in the scene
      if (this.cameraHandler) {
        this.cameraHandler.followTarget = gltf.scene
        this.cameraHandler.followMode = true
        this.cameraHandler.theta = 0
        this.cameraHandler.phi = 30
        this.cameraHandler.setRadius(6, true)
      }
    })

    // ── Lighting ──────────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.08)
    this.graphicsWorld.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
    directionalLight.position.set(0, 14, 8)
    directionalLight.target.position.set(0, -1, 2)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.set(4096, 4096)
    directionalLight.shadow.camera.left = -14
    directionalLight.shadow.camera.right = 14
    directionalLight.shadow.camera.top = 16
    directionalLight.shadow.camera.bottom = -10
    directionalLight.shadow.camera.near = 1
    directionalLight.shadow.camera.far = 50
    directionalLight.shadow.bias = -0.0003
    directionalLight.shadow.normalBias = 0.02
    directionalLight.shadow.camera.updateProjectionMatrix()
    this.graphicsWorld.add(directionalLight)
    this.graphicsWorld.add(directionalLight.target)

    const fromScreenLight = new THREE.RectAreaLight("#ffffff", 0.05, screenWidth, screenHeight)
    fromScreenLight.rotation.y = Math.PI
    fromScreenLight.position.set(0, 0, -0.001)
    screenGroup.add(fromScreenLight)

    const toScreenLight = new THREE.DirectionalLight("#ffffff", 0.3)

    toScreenLight.position.set(0, 0, 6)
    toScreenLight.target.position.set(
      0,
      controlParams.screenLiftDistance,
      -controlParams.screenPositionZ,
    )
    this.graphicsWorld.add(toScreenLight)
    this.graphicsWorld.add(toScreenLight.target)

    // Finish screen placement
    screenGroup.position.z = -controlParams.screenPositionZ
    screenGroup.position.y = controlParams.screenLiftDistance
    this.graphicsWorld.add(screenGroup)

    // ── Camera ────────────────────────────────────────────────────────────
    this.camera = new THREE.PerspectiveCamera(
      30,
      this.sceneSizes.width / this.sceneSizes.height,
      1,
      1000,
    )
    this.camera.position.set(0, -0.8, 6)
    this.graphicsWorld.add(this.camera)

    // ── Positional Audio ──────────────────────────────────────────────────
    this.listener = new THREE.AudioListener()
    this.camera.add(this.listener)
    this.positionalAudio = new THREE.PositionalAudio(this.listener)

    try {
      if (videoElement) {
        this.positionalAudio.setMediaElementSource(videoElement)
      }
    } catch (e) {
      console.warn(
        "PositionalAudio: could not connect media element source (likely already connected):",
        e,
      )
    }
    this.positionalAudio.setRefDistance(controlParams.refDistance)
    this.positionalAudio.setDirectionalCone(
      controlParams.coneInnerAngle,
      controlParams.coneOuterAngle,
      0.1,
    )

    const paHelper = new PositionalAudioHelper(this.positionalAudio, controlParams.refDistance)
    paHelper.position.set(0, -screenHeight / 2 + 0.1, 0)
    paHelper.visible = false
    this.positionalAudio.add(paHelper)
    this.screenMesh.add(this.positionalAudio)

    const changeRefDistance = () => {
      this.positionalAudio.setRefDistance(controlParams.refDistance)
      this.positionalAudio.setDirectionalCone(
        controlParams.coneInnerAngle,
        controlParams.coneOuterAngle,
        0.1,
      )
    }

    // ── dat.GUI ───────────────────────────────────────────────────────────
    const screenFolder = this.gui.addFolder("Screen")
    screenFolder
      .add(controlParams, "screenOffsetZ")
      .name("OffsetZ")
      .min(0)
      .max(5)
      .step(0.001)
      .onFinishChange(generateScreen)
    screenFolder
      .add(controlParams, "screenLiftDistance")
      .name("Lift Height")
      .min(0)
      .max(5)
      .step(0.001)
      .onFinishChange(generateScreen)

    const fieldFolder = this.gui.addFolder("Sound Field")
    fieldFolder
      .add(controlParams, "refDistance")
      .name("Ref Distance")
      .min(1)
      .max(20)
      .step(0.001)
      .onFinishChange(changeRefDistance)
    fieldFolder
      .add(controlParams, "coneInnerAngle")
      .name("ConeInnerAngle")
      .min(10)
      .max(360)
      .step(1)
      .onFinishChange(changeRefDistance)
    fieldFolder
      .add(controlParams, "coneOuterAngle")
      .name("ConeOuterAngle")
      .min(10)
      .max(360)
      .step(1)
      .onFinishChange(changeRefDistance)
    fieldFolder.add(paHelper, "visible").name("PositionalAudioHelper")

    const ambientLightFolder = this.gui.addFolder("Ambient Light")
    ambientLightFolder.add(ambientLight, "intensity").name("Intensity").min(0).max(5).step(0.001)

    const directionalLightFolder = this.gui.addFolder("Directional Light")
    directionalLightFolder
      .add(directionalLight, "intensity")
      .name("Intensity")
      .min(0)
      .max(10)
      .step(0.001)

    const screenLightFolder = this.gui.addFolder("Screen Light")
    screenLightFolder
      .add(fromScreenLight, "intensity")
      .name("Glow Intensity")
      .min(0)
      .max(10)
      .step(0.001)
    screenLightFolder
      .add(toScreenLight, "intensity")
      .name("Projection Intensity")
      .min(0)
      .max(10)
      .step(0.001)

    // ── Controls ──────────────────────────────────────────────────────────
    if (this.useOrbitControls) {
      this.orbitControls = new OrbitControls(this.camera, this.worldContainer)
      this.orbitControls.enableDamping = true
      this.orbitControls.dampingFactor = 0.05
    } else {
      this.inputManager = new InputManager(this, this.renderer.domElement, true)
      this.cameraHandler = new CameraHandler(this, this.camera)
    }

    // ── Event Listeners ───────────────────────────────────────────────────
    this.boundResize = () => this.resize()
    this.boundFullscreen = () => this.fullScreen()
    window.addEventListener("resize", this.boundResize)
    window.addEventListener("dblclick", this.boundFullscreen)

    this.animate()
  }

  animate() {
    this.animFrameId = requestAnimationFrame(() => this.animate())
    this.update()
    this.renderer.render(this.graphicsWorld, this.camera)
  }

  update() {
    const elapsedTime = this.clock.getElapsedTime()
    const deltaTime = elapsedTime - this.preTime
    this.preTime = elapsedTime

    this.updatableModules.forEach((module) => module.update(deltaTime, deltaTime))

    this.stats.update()

    if (this.mixer) {
      this.mixer.update(deltaTime)
    }
  }

  registerUpdatableModule(module: IUpdatable) {
    this.updatableModules.push(module)
    this.updatableModules.sort((a, b) => (a.updateOrder > b.updateOrder ? 1 : -1))
  }

  add(worldEntity: IWorldEntity) {
    worldEntity.addToWorld(this)
    this.registerUpdatableModule(worldEntity)
  }

  resize() {
    this.sceneSizes.width = window.innerWidth
    this.sceneSizes.height = window.innerHeight
    this.camera.aspect = this.sceneSizes.width / this.sceneSizes.height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.sceneSizes.width, this.sceneSizes.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  fullScreen() {
    const fullscreenElement = document.fullscreenElement
    if (!fullscreenElement) {
      if (this.worldContainer?.requestFullscreen) {
        this.worldContainer.requestFullscreen()
      }
    } else {
      document.exitFullscreen?.()
    }
  }

  dispose() {
    cancelAnimationFrame(this.animFrameId)

    this.gui?.destroy()

    this.graphicsWorld.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose())
        } else {
          child.material.dispose()
        }
      }
    })

    this.orbitControls?.dispose()
    this.inputManager?.dispose()
    this.renderer.dispose()

    window.removeEventListener("resize", this.boundResize)
    window.removeEventListener("dblclick", this.boundFullscreen)

    if (this.worldContainer && this.renderer.domElement.parentNode === this.worldContainer) {
      this.worldContainer.removeChild(this.renderer.domElement)
    }
  }

  setCharacterAnimation(name: string, fadeTime: number = 0.15): void {
    if (this._currentCharAnim === name) return
    const oldAction = this.charAnimations[this._currentCharAnim]
    const newAction = this.charAnimations[name]
    oldAction?.fadeOut(fadeTime)
    if (newAction) {
      newAction.reset().fadeIn(fadeTime).play()
    }
    this._currentCharAnim = name
  }
}
