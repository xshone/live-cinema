import * as THREE from "three"
import { Space } from "../enums/Space"

export function getRight(obj: THREE.Object3D, space: Space = Space.Global): THREE.Vector3 {
    const matrix = space === Space.Local ? obj.matrix : obj.matrixWorld
    return new THREE.Vector3(matrix.elements[0], matrix.elements[1], matrix.elements[2]).normalize()
}

export function getUp(obj: THREE.Object3D, space: Space = Space.Global): THREE.Vector3 {
    const matrix = space === Space.Local ? obj.matrix : obj.matrixWorld
    return new THREE.Vector3(matrix.elements[4], matrix.elements[5], matrix.elements[6]).normalize()
}

export function getForward(obj: THREE.Object3D, space: Space = Space.Global): THREE.Vector3 {
    const matrix = space === Space.Local ? obj.matrix : obj.matrixWorld
    return new THREE.Vector3(matrix.elements[8], matrix.elements[9], matrix.elements[10]).normalize()
}

export function getBack(obj: THREE.Object3D, space: Space = Space.Global): THREE.Vector3 {
    const matrix = space === Space.Local ? obj.matrix : obj.matrixWorld
    return new THREE.Vector3(-matrix.elements[8], -matrix.elements[9], -matrix.elements[10]).normalize()
}
