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