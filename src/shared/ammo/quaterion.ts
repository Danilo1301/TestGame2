import THREE from "three";
import { Vector3_Clone, Vector3_CrossVectors } from "./vector";

export function FormatQuaternion(q: Ammo.btQuaternion)
{
  return `${q.x().toFixed(2)}, ${q.y().toFixed(2)}, ${q.z().toFixed(2)}, ${q.w().toFixed(2)}`;
}

// Rotates the point /point/ with /rotation/.
// Quaternion * Vector3
export function Quaternion_Multiply_Vector3(rotation: Ammo.btQuaternion, point: Ammo.btVector3)
{
    var x = rotation.x() * 2;
    var y = rotation.y() * 2;
    var z = rotation.z() * 2;
    var xx = rotation.x() * x;
    var yy = rotation.y() * y;
    var zz = rotation.z() * z;
    var xy = rotation.x() * y;
    var xz = rotation.x() * z;
    var yz = rotation.y() * z;
    var wx = rotation.w() * x;
    var wy = rotation.w() * y;
    var wz = rotation.w() * z;

    var res = {x: 0, y: 0, z: 0};
    res.x = (1 - (yy + zz)) * point.x() + (xy - wz) * point.y() + (xz + wy) * point.z();
    res.y = (xy + wz) * point.x() + (1 - (xx + zz)) * point.y() + (yz - wx) * point.z();
    res.z = (xz - wy) * point.x() + (yz + wx) * point.y() + (1 - (xx + yy)) * point.z();
    return new Ammo.btVector3(res.x, res.y, res.z);
}

export function Quaternion_Forward(q: Ammo.btQuaternion)
{
    const vecForward = new Ammo.btVector3(0, 0, 1);
    const forward = Quaternion_Multiply_Vector3(q, vecForward)
    Ammo.destroy(vecForward);
    return forward;
}

export function Quaternion_Right(q: Ammo.btQuaternion)
{
    const vecRight = new Ammo.btVector3(1, 0, 0);
    const right = Quaternion_Multiply_Vector3(q, vecRight)
    Ammo.destroy(vecRight);
    return right;
}

export function Quaternion_Up(q: Ammo.btQuaternion)
{
    const vecUp = new Ammo.btVector3(0, 1, 0);
    const up = Quaternion_Multiply_Vector3(q, vecUp)
    Ammo.destroy(vecUp);
    return up;
}

export function Quaternion_Clone(q: Ammo.btQuaternion)
{
    const clone = new Ammo.btQuaternion(q.x(), q.y(), q.z(), q.w());
    return clone;
}

export function Quaternion_BetweenTwoVectors(from: Ammo.btVector3, to: Ammo.btVector3)
{
    // Step 1: Calculate the direction vector
    const direction = Vector3_Clone(to);
    direction.op_sub(from); // target - current
    direction.normalize();  // Normalize the direction vector

    // Step 2: Define the object's forward vector (default is along z-axis in local space)
    const forward = new Ammo.btVector3(0, 0, 1);

    // Step 3: Calculate the quaternion that rotates 'forward' to 'direction'
    const quat = quaternionFromVectors(forward, direction);

    Ammo.destroy(forward);
    Ammo.destroy(direction);

    return quat;
}

export function quaternionFromVectors(vFrom: Ammo.btVector3, vTo: Ammo.btVector3) {
    // Normalize the vectors
    vFrom.normalize();
    vTo.normalize();

    // Step 1: Calculate the rotation axis (cross product of the two vectors)
    const cross = Vector3_CrossVectors(vFrom, vTo);

    // Step 2: Calculate the angle between the two vectors
    const dot = vFrom.dot(vTo);
    const angle = Math.acos(dot); // Returns the angle in radians

    // Step 3: Create quaternion from axis and angle
    const quat = new Ammo.btQuaternion(0, 0, 0, 1);
    quat.setRotation(cross, angle);

    // Clean up temporary vectors
    Ammo.destroy(cross);

    return quat;
}

export function Quaternion_Difference(q1: Ammo.btQuaternion, q2: Ammo.btQuaternion) {
    // Step 1: Get the inverse (or conjugate) of q1
    const q1Inverse = new Ammo.btQuaternion(q1.x(), q1.y(), q1.z(), q1.w());
    q1Inverse.inverse(); // or you can use .conjugate()

    q2.op_mulq(q1Inverse)

    return q2;
}

// to exactly precise
export function Quaternion_ToEuler(quat: Ammo.btQuaternion)
{
    let heading = 0, attitude = 0, bank = 0;
    const q1 = new Ammo.btQuaternion(0, 0, 0, 1);
    q1.setX(quat.x());
    q1.setY(quat.y());
    q1.setZ(quat.z());
    q1.setW(quat.w());
    const test = q1.x() * q1.y() + q1.z() * q1.w();
    if (test > 0.499) { // singularity at north pole
        heading = 2 * Math.atan2(q1.x(), q1.w());
        attitude = Math.PI/2;
        bank = 0;
        return new Ammo.btVector3(0, 0, 0)
    }
    if (test < -0.499) { // singularity at south pole
        heading = -2 * Math.atan2(q1.x(), q1.w());
        attitude = -Math.PI/2;
        bank = 0;
        return new Ammo.btVector3(0, 0, 0)
    }
    const sqx = q1.x() * q1.x();
    const sqy = q1.y() * q1.y();
    const sqz = q1.z() * q1.z();
    heading = Math.atan2(2*q1.y()*q1.w()-2*q1.x()*q1.z() , 1 - 2*sqy - 2*sqz);
    attitude = Math.asin(2*test);
    bank = Math.atan2(2*q1.x()*q1.w()-2*q1.y()*q1.z() , 1 - 2*sqx - 2*sqz);

    Ammo.destroy(q1);

    const vec = new Ammo.btVector3(bank,heading,attitude);
    return vec;
}

// test 2
export function Quaternion_ToEuler_2(quaternion: Ammo.btQuaternion) {
    const x = quaternion.x();
    const y = quaternion.y();
    const z = quaternion.z();
    const w = quaternion.w();

    // Roll (X-axis rotation)
    const sinr_cosp = 2 * (w * x + y * z);
    const cosr_cosp = 1 - 2 * (x * x + y * y);
    const roll = Math.atan2(sinr_cosp, cosr_cosp);

    // Pitch (Y-axis rotation)
    const sinp = 2 * (w * y - z * x);
    let pitch;
    if (Math.abs(sinp) >= 1)
        pitch = Math.sign(sinp) * Math.PI / 2; // Use 90 degrees if out of range
    else
        pitch = Math.asin(sinp);

    // Yaw (Z-axis rotation)
    const siny_cosp = 2 * (w * z + x * y);
    const cosy_cosp = 1 - 2 * (y * y + z * z);
    const yaw = Math.atan2(siny_cosp, cosy_cosp);

    return new Ammo.btVector3(roll, pitch, yaw);
}

export function Quaternion_RotateQuaternion(q1: Ammo.btQuaternion, q2: Ammo.btQuaternion)
{
    // Rotate q1 by q2
    q1.op_mulq(q2);  // This modifies q1 in place to be the result of the multiplication
}