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