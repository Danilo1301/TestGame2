import { IPacketData_Models } from "../../game/network/packet";
import { GLTFData } from "./gltfData";

export class GLTFCollection
{
    public gltfs = new Map<string, GLTFData>();

    public fromPacketData(data: IPacketData_Models)
    {
        console.log(data);

        for(const model of data.models)
        {
            const gltfData = new GLTFData();
            gltfData.fromJSON(model);

            this.gltfs.set(gltfData.id, gltfData);
        }
    }
}