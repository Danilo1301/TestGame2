import { BaseObject } from "../../shared/baseObject";
import { Gameface } from "../gameface/gameface";
import { IPacketData_Entities } from "./packet";

export class SyncHelper extends BaseObject {

    public static onReceiveEntitiesPacket(data: IPacketData_Entities)
    {
        const game = Gameface.Instance.game;

    }
}