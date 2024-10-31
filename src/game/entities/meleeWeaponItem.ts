import { CollisionGroups } from '../collisionGroups';
import { MeleeWeapon } from '../weapons/meleeWeapon';
import { HandItem } from './handItem';
import { v4 as uuidv4 } from 'uuid';

export class MeleeWeaponItem extends HandItem
{
    public meleeWeapon!: MeleeWeapon;

    public init()
    {
        super.init();

        // this.game.entityFactory.spawnSensor(0, 0, 0, 3.0);
    }
}