import THREE from "three";

export function THREEVector_GetDistanceFromDirection(vec: THREE.Vector3, dir: THREE.Vector3, distance: number)
{
    const add = dir.clone();
    add.multiplyScalar(distance);

    const end = vec.clone();
    end.add(add);

    return end;
}

export function THREEVector3_GetDirectionBetweenVectors(v1: THREE.Vector3, v2: THREE.Vector3) {
    // Subtract v1 from v2 to get the direction vector
    const direction = new THREE.Vector3(
        v2.x - v1.x,
        v2.y - v1.y,
        v2.z - v1.z
    );
  
    // Normalize the direction vector to make it a unit vector (length of 1)
    direction.normalize();
  
    return direction; // This is the direction vector
  }