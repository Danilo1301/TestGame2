import THREE from "three";

export function FormatVector3(vec: Ammo.btVector3)
{
  return `${vec.x()}, ${vec.y()}, ${vec.z()}`;
}

export function Vector3_MoveAlongAngle(vector: Ammo.btVector3, angle: number, distance: number)
{
    // Create a new vector for direction calculation
    const direction = new Ammo.btVector3(0, 0, 0);

    // Compute the direction vector based on the angle (assumes angle is in radians)
    // Assuming movement in the XZ plane; adjust if using different planes
    direction.setX(Math.cos(angle));
    direction.setZ(Math.sin(angle));
    
    // Normalize the direction vector
    direction.normalize();

    // Scale the direction vector by the distance
    direction.op_mul(distance);

    // Create a new vector to store the result
    
    
    // Move the original vector along the direction vector
    vector.setX(vector.x() + direction.x());
    vector.setY(vector.y() + direction.y()); // Y is not affected in this case
    vector.setZ(vector.z() + direction.z());
    
    // Clean up temporary Ammo objects
    Ammo.destroy(direction);
}

export function Vector3_Subtract(vec1: Ammo.btVector3, vec2: Ammo.btVector3)
{
  const result = new Ammo.btVector3(
    vec1.x() - vec2.x(),
    vec1.y() - vec2.y(),
    vec1.z() - vec2.z()
  );
  return result
}

export function Vector3_DistanceTo(vec: Ammo.btVector3, vec2: Ammo.btVector3)
{
  return Math.sqrt(Vector3_DistanceToSquared(vec, vec2));
}

export function Vector3_DistanceToSquared(vec: Ammo.btVector3, vec2: Ammo.btVector3)
{
  const dx = vec.x() - vec2.x(), dy = vec.y() - vec2.y(), dz = vec.z() - vec2.z();

  return dx * dx + dy * dy + dz * dz;
}

export function Vector3_CrossVectors(a: Ammo.btVector3, b: Ammo.btVector3) {

  const result = new Ammo.btVector3(0, 0, 0);

  const ax = a.x(), ay = a.y(), az = a.z();
  const bx = b.x(), by = b.y(), bz = b.z();

  result.setX(ay * bz - az * by);
  result.setY(az * bx - ax * bz);
  result.setZ(ax * by - ay * bx);

  return result;
}

export function Vector3_Lerp_MinMovement(v1: THREE.Vector3, v2: THREE.Vector3, alpha: number, minDistance: number): THREE.Vector3 {
  // Create a new vector for the result
  const result = new THREE.Vector3();

  // Calculate the distance between the two vectors
  const distance = v1.distanceTo(v2);
  
  // If the distance is smaller than the minimum, return v2 directly
  if (distance <= minDistance) {
    return v2.clone();  // Snap to target if within the minimum distance
  }
  
  // Compute the actual lerp vector, but ensure it moves by at least 'minDistance'
  const direction = new THREE.Vector3().subVectors(v2, v1).normalize(); // Get the direction from v1 to v2
  const moveDistance = Math.max(distance * alpha, minDistance); // Ensure movement by at least 'minDistance'

  result.copy(v1).addScaledVector(direction, moveDistance);

  return result;
}

export function rotateVectorAroundY(v: THREE.Vector3, angle: number): THREE.Vector3 {
  // Create a new quaternion for rotation around the Y-axis
  const quaternion = new THREE.Quaternion();

  // Set the quaternion to rotate around the Y-axis by the given angle
  quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);

  // Apply the quaternion to the vector
  return v.clone().applyQuaternion(quaternion);
}

export function getTurnDirection(currentDirection: THREE.Vector3, targetDirection: THREE.Vector3): string {
  // Calculate the cross product between the two vectors
  const crossProduct = new THREE.Vector3().crossVectors(currentDirection, targetDirection);

  // Check the Y component of the cross product to determine left or right
  if (crossProduct.y > 0) {
      return "right";  // Target is to the right
  } else if (crossProduct.y < 0) {
      return "left";   // Target is to the left
  } else {
      return "straight"; // No turn, vectors are either parallel or directly opposite
  }
}

export function getTurnDirectionSignal(currentDirection: THREE.Vector3, targetDirection: THREE.Vector3) {
  const direction = getTurnDirection(currentDirection, targetDirection);

  if(direction == "right") return -1;
  if(direction == "left") return 1;

  return 1;
}

export function vectorToQuaternion(direction: Ammo.btVector3): Ammo.btQuaternion {
  // Normalize the input direction vector

  direction = new Ammo.btVector3(direction.x(), direction.y(), direction.z());

  direction.normalize();

  const normDirection = direction;
  
  // Default forward vector (you can change this based on your axis system)
  const forward = new Ammo.btVector3(0, 0, 1); // Z-axis is the forward vector

  // Compute the dot product between the two vectors
  const dot = forward.dot(normDirection);

  // If the dot product is 1, the vectors are already aligned, return the identity quaternion
  if (dot > 0.99999) {
      return new Ammo.btQuaternion(0, 0, 0, 1);
  }

  // If the dot product is -1, the vectors are opposite, return a 180-degree rotation
  if (dot < -0.99999) {
      const axis = new Ammo.btVector3(0, 1, 0); // Choose an arbitrary axis perpendicular to forward
      const resultQuat = new Ammo.btQuaternion(axis.x(), axis.y(), axis.z(), Math.PI);
      return resultQuat;
  }

  // Calculate the axis of rotation using the cross product
  const axis = Vector3_CrossVectors(forward, normDirection);
  axis.normalize();

  // Calculate the angle between the vectors
  const angle = Math.acos(dot);

  // Create the quaternion using the axis and angle
  const resultQuat = new Ammo.btQuaternion(0, 0, 0, 1);
  resultQuat.setRotation(axis, angle);

  return resultQuat;
}