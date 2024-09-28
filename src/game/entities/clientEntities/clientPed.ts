import THREE, { Quaternion } from "three";
import { ClientEntity } from "./clientEntity";
import { ThreeScene } from "../../three/threeScene";
import { Ped } from "../ped";
import { FormatQuaternion, Quaternion_Difference, Quaternion_Forward, Quaternion_ToEuler, Quaternion_ToEuler_2 } from "../../../utils/ammo/quaterion";
import { ammoVector3ToThree, threeQuaternionToAmmo, threeVector3ToAmmo } from "../../../utils/utils";
import { FormatVector3, getTurnDirectionSignal, rotateVectorAroundY, vectorToQuaternion } from "../../../utils/ammo/vector";
import { rotateQuaternion, THREEQuaternion_Difference } from "../../../utils/three/quaternion";
import { Input } from "../../../utils/input/input";

export class ClientPed extends ClientEntity {
    
    public get ped() { return this.entity as Ped; }

    public create()
    {
        super.create();
    }

    public update(delta: number)
    {
        super.update(delta);
    }

    public test()
    {

        const body = this.entity.collision.body!;
        const transform = body.getWorldTransform();
        const position = transform.getOrigin();

        const lookDir = this.ped.lookDir;

        const forward = Quaternion_Forward(lookDir);

        const start = new THREE.Vector3(position.x(), position.y(), position.z());

        const end = start.clone();
        end.x += forward.x();
        end.y += forward.y();
        end.z += forward.z();

        ThreeScene.Instance.drawLine(start, end, 0xff0000);
        
        Ammo.destroy(forward);

        //

        const object = this.gltfModel?.object;
        if(object)
        {
            const objectWorldPosition = new THREE.Vector3();
            object.getWorldPosition(objectWorldPosition);

            const skeletonobj = object.getObjectByProperty('type', 'SkinnedMesh') as THREE.SkinnedMesh;
            if(skeletonobj)
            {
                const skeleton = skeletonobj.skeleton;

                for(const bone of skeleton.bones)
                {
                    const boneName = "bone_" + bone.name;

                    

                    function setBoneFacingDirection(bone: THREE.Bone, targetDirection: THREE.Vector3) {
                        // Create a quaternion that represents the desired direction
                        const targetQuaternion = new THREE.Quaternion();
                        // You can use lookAt or setFromUnitVectors to create a quaternion
                        targetQuaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), targetDirection.clone().normalize());
                    
                        // Get the bone's world quaternion
                        const boneWorldQuaternion = new THREE.Quaternion();
                        bone.getWorldQuaternion(boneWorldQuaternion);
                    
                        // Get the parent's world quaternion (if any)
                        const parentWorldQuaternion = new THREE.Quaternion();
                        if (bone.parent) {
                            bone.parent.getWorldQuaternion(parentWorldQuaternion);
                        } else {
                            parentWorldQuaternion.set(0, 0, 0, 1); // No parent, default identity quaternion
                        }
                    
                        // Inverse the parent's world quaternion
                        const parentInverseQuaternion = parentWorldQuaternion.conjugate();
                    
                        // Convert the target quaternion to the bone's local space
                        const localTargetQuaternion = parentInverseQuaternion.multiply(targetQuaternion);
                    
                        // Set the bone's local quaternion to face the target direction
                        bone.quaternion.copy(localTargetQuaternion);
                    }

                    if(bone.name.includes("spine"))
                    {
                        //console.log("spine")

                        if(!(window as any)["_prevQuat"])
                        {
                            const prevQuat = bone.quaternion.clone();
                            (window as any)["_prevQuat"] = prevQuat;
                        }

                        if(Input.getKey("G"))
                        {
                            setBoneFacingDirection(bone, new THREE.Vector3(0, 1, 1))
                        } else {
                            bone.quaternion.copy((window as any)["_prevQuat"]);
                            
                        }
                        
                    }

                    const collisionShape = this.entity.collision.getShapeByName("bone_" + bone.name);
                    
                    if(collisionShape)
                    {
                        const shapeThree = this.getThreeObjectByName(boneName)!;
                        
                        const boneWorldPosition = new THREE.Vector3();
                        bone.getWorldPosition(boneWorldPosition);
                        const boneWorldQuaternion = new THREE.Quaternion();
                        bone.getWorldQuaternion(boneWorldQuaternion);
                        const boneWorldQuaternion_a = threeQuaternionToAmmo(boneWorldQuaternion);

                        //const boneLocalPosition = bone.position;
                        const boneLocalPositionFromObject = boneWorldPosition.clone();
                        boneLocalPositionFromObject.sub(objectWorldPosition);
                        //const boneLocalPositionFromObject_a = threeVector3ToAmmo(boneLocalPositionFromObject);

                        //rotate in y axis
                        const v1 = new THREE.Vector3(0, 0, 1);

                        const objectWorldQuaternion = new THREE.Quaternion();
                        object.getWorldQuaternion(objectWorldQuaternion);
                        const objectWorldQuaternion_a = threeQuaternionToAmmo(objectWorldQuaternion);

                        const v2_a = Quaternion_Forward(objectWorldQuaternion_a);
                        const v2 = ammoVector3ToThree(v2_a);
                        const angle = v1.angleTo(v2);
                        const signal = getTurnDirectionSignal(v1, v2);

                        const newPos = rotateVectorAroundY(boneLocalPositionFromObject, angle * signal);

                        shapeThree.position.set(newPos.x, newPos.y, newPos.z);

                        let euler = Quaternion_ToEuler(boneWorldQuaternion_a);

                        

 
                        let newQ = new Ammo.btQuaternion(0, 0, 0, 1);
                        newQ.setEulerZYX(euler.z(), euler.y() + (angle * signal), euler.x());


                        shapeThree.quaternion.set(newQ.x(), newQ.y(), newQ.z(), newQ.w());

                        ThreeScene.Instance.drawLine(new THREE.Vector3(0, 0, 0), boneWorldPosition, 0xFFFFFF);
                        ThreeScene.Instance.drawLine(new THREE.Vector3(0, 0, 0), objectWorldPosition, 0xFF0000);

                        // -----------------------------------

                        const collisionShapeIndex = this.entity.collision.shapes.indexOf(collisionShape);
                        const compoundShape = this.entity.collision.compoundShape!;

                        // Get the child shape (we can't get the transform directly)
                        const childShape = compoundShape.getChildShape(collisionShapeIndex);

                        // Create a new transform with the updated position
                        const origin = new Ammo.btVector3(newPos.x, newPos.y, newPos.z);
                        const rotation = new Ammo.btQuaternion(newQ.x(), newQ.y(), newQ.z(), newQ.w());
                        const newTransform = new Ammo.btTransform();
                        newTransform.setIdentity();
                        newTransform.setOrigin(origin); // New position
                        newTransform.setRotation(rotation);

                        // Remove the child shape (there is no direct remove function, so we recreate the compound shape)
                        compoundShape.removeChildShapeByIndex(collisionShapeIndex); 

                        // Re-add the child shape with the new transform
                        compoundShape.addChildShape(newTransform, childShape);
                        
                        Ammo.destroy(boneWorldQuaternion_a);
                        Ammo.destroy(objectWorldQuaternion_a);
                        Ammo.destroy(v2_a);
                        Ammo.destroy(euler);
                        Ammo.destroy(newQ);
                        Ammo.destroy(origin);
                        Ammo.destroy(rotation);

                    }
                }
            }
        }

    
        

        //

    
    }
}

