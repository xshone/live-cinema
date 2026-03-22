import * as THREE from "three"
import type { IWorldEntity } from "../interfaces/IWorldEntity"
import type { IUpdatable } from "../interfaces/IUpdatable"
import { EntityType } from "../enums/EntityType"
import type { World } from "../world/World"

export class Character extends THREE.Object3D implements IWorldEntity {
    entityType: EntityType = EntityType.Character
    updateOrder: number = 1

    mixer!: THREE.AnimationMixer
    orientation: THREE.Vector3 = new THREE.Vector3()
    orientationTarget: THREE.Vector3 = new THREE.Vector3()

    constructor() {
        super()
    }

    setAnimation(clipName: string, fadeIn: number, animations: THREE.AnimationClip[]) {
        const clip = THREE.AnimationClip.findByName(animations, clipName)
        if (clip) {
            const action = this.mixer.clipAction(clip)
            this.mixer.stopAllAction()
            action.fadeIn(fadeIn)
            action.play()
        }
    }

    update(timeStep: number, _unscaledTimeStep: number): void {
        if (this.mixer) {
            this.mixer.update(timeStep)
        }
    }

    addToWorld(world: World): void {
        world.characters.push(this)
        world.graphicsWorld.add(this)
    }

    removeFromWorld(world: World): void {
        const idx = world.characters.indexOf(this)
        if (idx !== -1) world.characters.splice(idx, 1)
        world.graphicsWorld.remove(this)
    }
}
