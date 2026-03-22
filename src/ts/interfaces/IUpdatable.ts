export interface IUpdatable {
    updateOrder: number
    update(timeStep: number, unscaledTimeStep: number): void
}
