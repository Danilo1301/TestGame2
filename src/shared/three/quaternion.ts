import THREE from "three"

export function THREEQuaternion_Rotate(axis: THREE.Vector3, q: THREE.Quaternion, angle: number): THREE.Quaternion {
    // Create a quaternion representing the rotation around the Y-axis
    const rotationQuaternion = new THREE.Quaternion();
    rotationQuaternion.setFromAxisAngle(axis, angle); // Y-axis

    // Multiply the original quaternion by the rotation quaternion
    const newQuaternion = q.clone().multiply(rotationQuaternion);

    return newQuaternion.normalize(); // Normalize the result
}

export function THREEQuaternion_Difference(q1: THREE.Quaternion, q2: THREE.Quaternion) {
    // Step 1: Get the inverse (or conjugate) of q1
    const q1Inverse = new THREE.Quaternion(q1.x, q1.y, q1.z, q1.w);
    q1Inverse.invert(); // or you can use .conjugate()

    q2.multiply(q1Inverse)

    return q2;
}