//https://github.com/enable3d/enable3d/blob/8cc4833689fa240ca9418dd61497081c4d5da84d/packages/ammoPhysics/src/constraints.ts

export interface XYZ {
    x?: number
    y?: number
    z?: number
}

export class AmmoUtils
{
  public physicsWorld!: Ammo.btSoftRigidDynamicsWorld;

  public add_constraints_hinge(
    bodyA: Ammo.btRigidBody,
    bodyB: Ammo.btRigidBody,
    config: {
      pivotA?: XYZ
      pivotB?: XYZ
      axisA?: XYZ
      axisB?: XYZ
    } = {},
    disableCollisionsBetweenLinkedBodies = true
  ) {
    const { pivotA, pivotB, axisA, axisB } = config
    const pivotV3 = new Ammo.btVector3(pivotA?.x || 0, pivotA?.y || 0, pivotA?.z || 0)
    const targetPivotV3 = new Ammo.btVector3(pivotB?.x || 0, pivotB?.y || 0, pivotB?.z || 0)
    const axisV3 = new Ammo.btVector3(axisA?.x || 0, axisA?.y || 0, axisA?.z || 0)
    const targetAxisV3 = new Ammo.btVector3(axisB?.x || 0, axisB?.y || 0, axisB?.z || 0)
    const constraint = new Ammo.btHingeConstraint(
      bodyA,
      bodyB,
      pivotV3,
      targetPivotV3,
      axisV3,
      targetAxisV3,
      true
    )
    
    this.physicsWorld.addConstraint(constraint, disableCollisionsBetweenLinkedBodies)

    return constraint
  }

  public add_constraints_lock(
    bodyA: Ammo.btRigidBody,
    bodyB: Ammo.btRigidBody,
    disableCollisionsBetweenLinkedBodies = true
  ) {
    const zero = { x: 0, y: 0, z: 0 }
    return this.add_constraints_dof(
      bodyA,
      bodyB,
      { angularLowerLimit: zero, angularUpperLimit: zero },
      disableCollisionsBetweenLinkedBodies
    )
  }

  public add_constraints_dof(
    bodyA: Ammo.btRigidBody,
    bodyB: Ammo.btRigidBody,
    config: {
      linearLowerLimit?: XYZ
      linearUpperLimit?: XYZ
      angularLowerLimit?: XYZ
      angularUpperLimit?: XYZ
      center?: boolean
      offset?: XYZ
    } = {},
    disableCollisionsBetweenLinkedBodies = true
  ) {
    const { offset, center = false } = config
    const off = { x: 0, y: 0, z: 0, ...offset }

    const transform = this.getTransform(bodyA, bodyB, off, center)

    const constraint = new Ammo.btGeneric6DofConstraint(
      bodyA,
      bodyB,
      transform.transformA,
      transform.transformB,
      true
    )

    const { linearLowerLimit, linearUpperLimit, angularLowerLimit, angularUpperLimit } = config

    const lll = this.toAmmoV3(linearLowerLimit)
    const lul = this.toAmmoV3(linearUpperLimit)
    const all = this.toAmmoV3(angularLowerLimit, -Math.PI)
    const aul = this.toAmmoV3(angularUpperLimit, Math.PI)

    constraint.setLinearLowerLimit(lll)
    constraint.setLinearUpperLimit(lul)
    constraint.setAngularLowerLimit(all)
    constraint.setAngularUpperLimit(aul)

    Ammo.destroy(lll)
    Ammo.destroy(lul)
    Ammo.destroy(all)
    Ammo.destroy(aul)

    this.physicsWorld.addConstraint(constraint, disableCollisionsBetweenLinkedBodies)

    return constraint
  }

  public getTransform(
    bodyA: Ammo.btRigidBody,
    bodyB: Ammo.btRigidBody,
    offset: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
    center: boolean = false
  ) {
    // @ts-expect-error: Should be refactored to avoid the ts error.
    offset = { x: 0, y: 0, z: 0, ...offset }

    const centerVector = (v1: Ammo.btVector3, v2: Ammo.btVector3) => {
      var dx = (v1.x() - v2.x()) / 2 + offset.x
      var dy = (v1.y() - v2.y()) / 2 + offset.y
      var dz = (v1.z() - v2.z()) / 2 + offset.z
      return new Ammo.btVector3(dx, dy, dz)
    }

    const transformB = new Ammo.btTransform()
    transformB.setIdentity()

    if (!center) {
      // offset
      transformB.setOrigin(new Ammo.btVector3(offset.x, offset.y, offset.z))

      const transformA = bodyA.getCenterOfMassTransform().inverse().op_mul(bodyB.getWorldTransform()).op_mul(transformB)

      return { transformA: transformA, transformB: transformB }
    } else {
      const center = centerVector(bodyA.getWorldTransform().getOrigin(), bodyB.getWorldTransform().getOrigin())

      const transformB = new Ammo.btTransform()
      transformB.setIdentity()
      transformB.setOrigin(center)

      const transformA = bodyA.getCenterOfMassTransform().inverse().op_mul(bodyB.getWorldTransform())

      transformA.op_mul(transformB)

      return { transformA: transformA, transformB: transformB }
    }
  }

  public toAmmoV3(v?: XYZ, d: number = 0) {
    return new Ammo.btVector3(
      typeof v?.x !== 'undefined' ? v.x : d,
      typeof v?.y !== 'undefined' ? v.y : d,
      typeof v?.z !== 'undefined' ? v.z : d
    )
  }
}