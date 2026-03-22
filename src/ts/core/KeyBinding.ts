export class KeyBinding {
    eventCodes: string[]
    isPressed: boolean = false
    justPressed: boolean = false
    justReleased: boolean = false

    constructor(...code: string[]) {
        this.eventCodes = code
    }
}
