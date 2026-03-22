import type { KeyBinding } from "../core/KeyBinding"

export interface IInputReceiver {
    actions: { [action: string]: KeyBinding }
    handleKeyboardEvent(event: KeyboardEvent, code: string, isPressed: boolean): void
    handleMouseButton(event: MouseEvent, code: string, isPressed: boolean): void
    handleMouseMove(event: MouseEvent, deltaX: number, deltaY: number): void
    handleMouseWheel(event: WheelEvent, value: number): void
    inputReceiverInit(): void
    inputReceiverUpdate(timeStep: number): void
}
