import { IPacketData_InitialInfo } from "../../game/network/packet";
import { GLTFData } from "./gltfData";

export class GLTFCollection
{
    public gltfs = new Map<string, GLTFData>();

    public fromPacketData(data: IPacketData_InitialInfo)
    {
        for(const model of data.models)
        {
            const gltfData = new GLTFData();
            gltfData.fromJSON(model);

            this.gltfs.set(gltfData.id, gltfData);
        }
    }
}