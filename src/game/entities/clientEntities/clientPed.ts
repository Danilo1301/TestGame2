import THREE from "three";
import { ClientEntity } from "./clientEntity";
import { ThreeScene } from "../../three/threeScene";
import { Ped } from "../ped";
import { Quaternion_Forward } from "../../../utils/ammo/quaterion";

export class ClientPed extends ClientEntity {
    
    public get ped() { return this.entity as Ped; }

    public create()
    {
        super.create();
    }

    public update(delta: number)
    {
        super.update(delta);

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
                    const boneWorldPosition = new THREE.Vector3();
                    bone.getWorldPosition(boneWorldPosition);
                    const boneQuaternion = new THREE.Quaternion();
                    bone.getWorldQuaternion(boneQuaternion);

                    const boneLocalPosition = boneWorldPosition.clone();
                    boneLocalPosition.sub(objectWorldPosition);

                    const boneName = "bone_" + bone.name;

                    const collisionShape = this.entity.collision.getShapeByName("bone_" + bone.name);
                    
                    if(collisionShape)
                    {
                        const shapeThree = this.getThreeObjectByName(boneName);

                        if(shapeThree)
                        {
                            //shapeThree.position.set(boneLocalPosition.x, boneLocalPosition.y, boneLocalPosition.z);
                            //shapeThree.quaternion.set(boneQuaternion.x, boneQuaternion.y, boneQuaternion.z, boneQuaternion.w);
                        }

                        ThreeScene.Instance.drawLine(new THREE.Vector3(0, 0, 0), boneWorldPosition, 0xFFFFFF);

                        const collisionShapeIndex = this.entity.collision.shapes.indexOf(collisionShape);
                        const compoundShape = this.entity.collision.compoundShape!;

                        // Get the child shape (we can't get the transform directly)
                        const childShape = compoundShape.getChildShape(collisionShapeIndex);

                        /*
                        // Create a new transform with the updated position
                        const newTransform = new Ammo.btTransform();
                        newTransform.setIdentity();
                        newTransform.setOrigin(new Ammo.btVector3(boneLocalPosition.x, boneLocalPosition.y, boneLocalPosition.z)); // New position
                        newTransform.setRotation(new Ammo.btQuaternion(boneQuaternion.x, boneQuaternion.y, boneQuaternion.z, boneQuaternion.w));

                        // Remove the child shape (there is no direct remove function, so we recreate the compound shape)
                        compoundShape.removeChildShapeByIndex(collisionShapeIndex); 

                        // Re-add the child shape with the new transform
                        compoundShape.addChildShape(newTransform, childShape);
                        */
                 
                    }
                }
            }
        }

    
        

        //

    
    }
}

