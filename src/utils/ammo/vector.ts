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