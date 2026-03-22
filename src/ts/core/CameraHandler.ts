import * as THREE from "three"
import * as Lodash from "lodash"

import { KeyBinding } from "../core/KeyBinding"
import * as Utils from "../core/Utils"
import type { IInputReceiver } from "../interfaces/IInputReceiver"
import type { IUpdatable } from "../interfaces/IUpdatable"
import type { World } from "../world/World"

export class CameraHandler implements IUpdatable, IInputReceiver {
    updateOrder: number = 4

    actions: { [action: string]: KeyBinding }
    world: World
    camera: THREE.Camera

    followMode: boolean = false
    followTarget: THREE.Object3D | null = null
    sensitivity = new THREE.Vector2(1, 0.8)
    theta: number
    phi: number
    movementSpeed: number

    upVelocity: number = 0
    forwardVelocity: number = 0
    rightVelocity: number = 0

    private _charVelX: number = 0
    private _charVelZ: number = 0
    private _velY: number = 0
    private _isOnGround: boolean = false
    private _isMoving: boolean = false
    private _raycaster: THREE.Raycaster = new THREE.Raycaster()

    radius: number = 1
    target!: THREE.Vector3
    targetRadius: number = 1

    constructor(
        world: World,
        camera: THREE.Camera,
        sensitivityX: number = 1,
        sensitivityY: number = sensitivityX * 0.8,
    ) {
        this.world = world
        this.camera = camera
        this.theta = 0
        this.phi = 0
        this.sensitivity = new THREE.Vector2(sensitivityX, sensitivityY)
        this.movementSpeed = 0.06

        this.actions = {
            forward: new KeyBinding("KeyW"),
            back: new KeyBinding("KeyS"),
            left: new KeyBinding("KeyA"),
            right: new KeyBinding("KeyD"),
            up: new KeyBinding("KeyE"),
            down: new KeyBinding("KeyQ"),
            sprint: new KeyBinding("ShiftLeft"),
            jump: new KeyBinding("Space"),
        }

        this.target = new THREE.Vector3()
        this.world.registerUpdatableModule(this)
    }

    update(_timeStep: number, _unscaledTimeStep: number): void {
        if (this.followMode && this.followTarget) {
            // ── Third-person follow camera ────────────────────────────────────
            this.radius = THREE.MathUtils.lerp(this.radius, this.targetRadius, 0.1)

            const tPos = this.followTarget.position
            // Look-at point: slightly above character's origin (head height)
            const lookAt = new THREE.Vector3(tPos.x, tPos.y + 1.5, tPos.z)

            const thetaRad = THREE.MathUtils.degToRad(this.theta)
            const phiRad = THREE.MathUtils.degToRad(this.phi)

            // Spherical offset: camera sits radius units away, elevated by phi
            const desiredPos = new THREE.Vector3(
                tPos.x + this.radius * Math.sin(thetaRad) * Math.cos(phiRad),
                tPos.y + this.radius * Math.sin(phiRad),
                tPos.z + this.radius * Math.cos(thetaRad) * Math.cos(phiRad),
            )

            // Smooth camera position so it doesn't snap
            this.camera.position.lerp(desiredPos, 0.1)
            this.camera.lookAt(lookAt)
        } else {
            this.radius = THREE.MathUtils.lerp(this.radius, this.targetRadius, 0.1)
            this.camera.position.x =
                this.target.x +
                this.radius * Math.sin((this.theta * Math.PI) / 180) * Math.cos((this.phi * Math.PI) / 180)
            this.camera.position.y = this.target.y + this.radius * Math.sin((this.phi * Math.PI) / 180)
            this.camera.position.z =
                this.target.z +
                this.radius * Math.cos((this.theta * Math.PI) / 180) * Math.cos((this.phi * Math.PI) / 180)
            this.camera.updateMatrix()
            this.camera.lookAt(this.target)
        }
    }

    inputReceiverInit(): void {
        if (this.followMode && this.followTarget) {
            // Reset vertical physics so character doesn't inherit stale velocity
            this._velY = 0
            this._isOnGround = false
        } else {
            this.target.copy(this.camera.position)
            this.setRadius(0, true)
        }
    }

    inputReceiverUpdate(timeStep: number): void {
        if (this.followMode && this.followTarget) {
            // ── Horizontal movement ────────────────────────────────────────────
            const baseSpeed = 0.05 * timeStep * 60
            const speed = baseSpeed * (this.actions.sprint.isPressed ? 3 : 1)
            const thetaRad = THREE.MathUtils.degToRad(this.theta)

            let moveX = 0
            let moveZ = 0
            if (this.actions.forward.isPressed) {
                moveX -= Math.sin(thetaRad)
                moveZ -= Math.cos(thetaRad)
            }
            if (this.actions.back.isPressed) {
                moveX += Math.sin(thetaRad)
                moveZ += Math.cos(thetaRad)
            }
            if (this.actions.left.isPressed) {
                moveX -= Math.cos(thetaRad)
                moveZ += Math.sin(thetaRad)
            }
            if (this.actions.right.isPressed) {
                moveX += Math.cos(thetaRad)
                moveZ -= Math.sin(thetaRad)
            }

            const len = Math.sqrt(moveX * moveX + moveZ * moveZ)
            if (len > 0.001) {
                moveX = (moveX / len) * speed
                moveZ = (moveZ / len) * speed
            } else {
                moveX = 0
                moveZ = 0
            }

            this._charVelX = THREE.MathUtils.lerp(this._charVelX, moveX, 0.2)
            this._charVelZ = THREE.MathUtils.lerp(this._charVelZ, moveZ, 0.2)

            this.followTarget.position.x += this._charVelX
            this.followTarget.position.z += this._charVelZ

            if (Math.abs(this._charVelX) > 0.0005 || Math.abs(this._charVelZ) > 0.0005) {
                const targetAngle = Math.atan2(this._charVelX, this._charVelZ)
                let diff = targetAngle - this.followTarget.rotation.y
                while (diff > Math.PI) diff -= Math.PI * 2
                while (diff < -Math.PI) diff += Math.PI * 2
                this.followTarget.rotation.y += diff * 0.15
            }

            // ── Gravity & jump ──────────────────────────────────────────────
            const GRAVITY = -18
            const JUMP_SPEED = 8

            this._velY += GRAVITY * timeStep
            if (this.actions.jump.isPressed && this._isOnGround) {
                this._velY = JUMP_SPEED
                this._isOnGround = false
            }
            this.followTarget.position.y += this._velY * timeStep

            // Downward ray cast from 1 unit above character origin.
            // Ray far = 3.0 covers the full hall depth (platforms spread ~4 units vertically).
            // Snap only when falling (velY ≤ 0) and ground is very close (distance ≈ 1.0).
            const fPos = this.followTarget.position
            this._raycaster.set(new THREE.Vector3(fPos.x, fPos.y + 1.0, fPos.z), new THREE.Vector3(0, -1, 0))
            this._raycaster.far = 3.0
            const hits = this._raycaster.intersectObjects(this.world.collidableMeshes, false)
            if (hits.length > 0 && this._velY <= 0 && hits[0].distance <= 1.05) {
                this.followTarget.position.y = hits[0].point.y
                this._velY = 0
                this._isOnGround = true
            } else {
                this._isOnGround = false
            }

            // ── Animation state switch (idle ↔ run) ──────────────────────────────
            const isMoving = Math.abs(this._charVelX) > 0.001 || Math.abs(this._charVelZ) > 0.001
            if (isMoving !== this._isMoving) {
                this._isMoving = isMoving
                this.world.setCharacterAnimation(isMoving ? "run" : "idle")
            }

            return
        }

        // ── Free-fly camera movement ──────────────────────────────────────────
        const speed = this.movementSpeed * (this.actions.sprint.isPressed ? timeStep * 600 : timeStep * 60)

        const up = Utils.getUp(this.camera)
        const right = Utils.getRight(this.camera)
        const forward = Utils.getBack(this.camera)

        this.upVelocity = THREE.MathUtils.lerp(
            this.upVelocity,
            +this.actions.up.isPressed - +this.actions.down.isPressed,
            0.3,
        )
        this.forwardVelocity = THREE.MathUtils.lerp(
            this.forwardVelocity,
            +this.actions.forward.isPressed - +this.actions.back.isPressed,
            0.3,
        )
        this.rightVelocity = THREE.MathUtils.lerp(
            this.rightVelocity,
            +this.actions.right.isPressed - +this.actions.left.isPressed,
            0.3,
        )

        this.target.add(up.multiplyScalar(speed * this.upVelocity))
        this.target.add(forward.multiplyScalar(speed * this.forwardVelocity))
        this.target.add(right.multiplyScalar(speed * this.rightVelocity))
    }

    move(deltaX: number, deltaY: number) {
        this.theta -= deltaX * (this.sensitivity.x / 2)
        this.theta %= 360
        this.phi += deltaY * (this.sensitivity.y / 2)
        if (this.followMode) {
            // Follow mode: keep camera above the ground (10° – 80°)
            this.phi = Math.min(80, Math.max(10, this.phi))
        } else {
            this.phi = Math.min(85, Math.max(-85, this.phi))
        }
    }

    setRadius(value: number, instantly: boolean = false) {
        this.targetRadius = Math.max(0.001, value)
        if (instantly === true) {
            this.radius = value
        }
    }

    handleKeyboardEvent(_event: KeyboardEvent, code: string, isPressed: boolean): void {
        for (const action in this.actions) {
            if (Object.prototype.hasOwnProperty.call(this.actions, action)) {
                const binding = this.actions[action]
                if (Lodash.includes(binding.eventCodes, code)) {
                    binding.isPressed = isPressed
                }
            }
        }
    }

    handleMouseButton(_event: MouseEvent, _code: string, _isPressed: boolean): void {
        // no-op
    }

    handleMouseMove(_event: MouseEvent, deltaX: number, deltaY: number): void {
        this.move(deltaX, deltaY)
    }

    handleMouseWheel(_event: WheelEvent, _value: number): void {
        // no-op
    }
}
