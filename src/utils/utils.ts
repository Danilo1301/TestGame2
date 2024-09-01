import { ExtendedObject3D } from '@enable3d/ammo-on-nodejs';
import THREE from 'three';

export function randomIntFromInterval(min: number, max: number) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export function setObjectPosition(object: ExtendedObject3D, position: THREE.Vector3)
{
    const body = object.body.ammo;
    const transform = new Ammo.btTransform();
    body.getMotionState().getWorldTransform(transform);
    transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
    body.setWorldTransform(transform);
    body.getMotionState().setWorldTransform(transform);
    Ammo.destroy(transform);
}

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

export const isNode = () =>
    typeof process !== 'undefined' &&
    !!process.versions &&
    !!process.versions.node;

export const isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function() {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
    },
    any: function() {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
};