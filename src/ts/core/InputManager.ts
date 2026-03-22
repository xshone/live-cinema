import type { IInputReceiver } from "../interfaces/IInputReceiver"
import type { IUpdatable } from "../interfaces/IUpdatable"
import type { World } from "../world/World"

export class InputManager implements IUpdatable {
    updateOrder: number = 3

    world: World
    domElement: HTMLElement
    isPointerLockEnabled: boolean
    isLocked: boolean
    inputReceiver!: IInputReceiver

    boundOnMouseDown: (event: MouseEvent) => void
    boundOnMouseUp: (event: MouseEvent) => void
    boundOnMouseMove: (event: MouseEvent) => void
    boundOnMouseWheelScrolled: (event: WheelEvent) => void
    boundOnPointerLockChange: (event: Event) => void
    boundOnPointerLockError: (event: Event) => void
    boundOnKeyDown: (event: KeyboardEvent) => void
    boundOnKeyUp: (event: KeyboardEvent) => void

    constructor(world: World, domElement: HTMLElement, isPointerLockEnabled: boolean) {
        this.world = world
        this.domElement = domElement
        this.isPointerLockEnabled = isPointerLockEnabled
        this.isLocked = false

        this.boundOnMouseDown = (e) => this.onMouseDown(e)
        this.boundOnMouseUp = (e) => this.onMouseUp(e)
        this.boundOnMouseMove = (e) => this.onMouseMove(e)
        this.boundOnMouseWheelScrolled = (e) => this.onMouseWheelScrolled(e)
        this.boundOnKeyDown = (e) => this.onKeyDown(e)
        this.boundOnKeyUp = (e) => this.onKeyUp(e)
        this.boundOnPointerLockChange = () => this.onPointerLockChange()
        this.boundOnPointerLockError = () => this.onPointerLockError()

        this.domElement.addEventListener("mousedown", this.boundOnMouseDown)
        document.addEventListener("keydown", this.boundOnKeyDown)
        document.addEventListener("keyup", this.boundOnKeyUp)
        document.addEventListener("wheel", this.boundOnMouseWheelScrolled)
        document.addEventListener("pointerlockchange", this.boundOnPointerLockChange)
        document.addEventListener("pointerlockerror", this.boundOnPointerLockError)

        this.world.registerUpdatableModule(this)
    }

    update(timeStep: number, unscaledTimeStep: number): void {
        if (this.inputReceiver === undefined && this.world !== undefined && this.world.cameraHandler !== undefined) {
            this.setInputReceiver(this.world.cameraHandler)
        }
        this.inputReceiver?.inputReceiverUpdate(unscaledTimeStep)
    }

    setInputReceiver(receiver: IInputReceiver) {
        this.inputReceiver = receiver
        this.inputReceiver.inputReceiverInit()
    }

    dispose() {
        this.domElement.removeEventListener("mousedown", this.boundOnMouseDown)
        this.domElement.removeEventListener("mousemove", this.boundOnMouseMove)
        this.domElement.removeEventListener("mouseup", this.boundOnMouseUp)
        document.removeEventListener("keydown", this.boundOnKeyDown)
        document.removeEventListener("keyup", this.boundOnKeyUp)
        document.removeEventListener("wheel", this.boundOnMouseWheelScrolled)
        document.removeEventListener("pointerlockchange", this.boundOnPointerLockChange)
        document.removeEventListener("pointerlockerror", this.boundOnPointerLockError)
    }

    private onPointerLockChange() {
        if (document.pointerLockElement === this.domElement) {
            this.domElement.addEventListener("mousemove", this.boundOnMouseMove)
            this.domElement.addEventListener("mouseup", this.boundOnMouseUp)
            this.isLocked = true
        } else {
            this.domElement.removeEventListener("mousemove", this.boundOnMouseMove)
            this.domElement.removeEventListener("mouseup", this.boundOnMouseUp)
            this.isLocked = false
        }
    }

    private onPointerLockError() {
        console.warn("Pointer Lock Error")
    }

    private onMouseDown(event: MouseEvent) {
        if (this.isPointerLockEnabled) {
            this.domElement.requestPointerLock()
        } else {
            this.domElement.addEventListener("mousemove", this.boundOnMouseMove)
            this.domElement.addEventListener("mouseup", this.boundOnMouseUp)
        }
        this.inputReceiver?.handleMouseButton(event, "mouse" + event.button, true)
    }

    private onMouseUp(event: MouseEvent) {
        if (!this.isPointerLockEnabled) {
            this.domElement.removeEventListener("mousemove", this.boundOnMouseMove)
            this.domElement.removeEventListener("mouseup", this.boundOnMouseUp)
        }
        this.inputReceiver?.handleMouseButton(event, "mouse" + event.button, false)
    }

    private onMouseMove(event: MouseEvent) {
        this.inputReceiver?.handleMouseMove(event, event.movementX, event.movementY)
    }

    private onMouseWheelScrolled(event: WheelEvent) {
        this.inputReceiver?.handleMouseWheel(event, event.deltaY)
    }

    private onKeyDown(event: KeyboardEvent) {
        this.inputReceiver?.handleKeyboardEvent(event, event.code, true)
    }

    private onKeyUp(event: KeyboardEvent) {
        this.inputReceiver?.handleKeyboardEvent(event, event.code, false)
    }
}
