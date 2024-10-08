import THREE from "three";

export function ammoQuaternionToThree(quaternion: Ammo.btQuaternion)
{
    return new THREE.Quaternion(quaternion.x(), quaternion.y(), quaternion.z(), quaternion.w());
}

export function ammoVector3ToThree(vector: Ammo.btVector3)
{
    return new THREE.Vector3(vector.x(), vector.y(), vector.z());
}

export function threeVector3ToAmmo(vector: THREE.Vector3)
{
    return new Ammo.btVector3(vector.x, vector.y, vector.z);
}

export function threeQuaternionToAmmo(quat: THREE.Quaternion)
{
    return new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w);
}