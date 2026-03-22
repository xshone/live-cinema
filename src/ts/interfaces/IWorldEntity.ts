import type { IUpdatable } from "./IUpdatable"
import type { EntityType } from "../enums/EntityType"
import type { World } from "../world/World"

export interface IWorldEntity extends IUpdatable {
    entityType: EntityType
    addToWorld(world: World): void
    removeFromWorld(world: World): void
}
