interface AssetItem {
    key: string,
    path: string
}

export const imageAssets: AssetItem[] = [
    {key: "note", path: "note.png"},
];

export const audioAssets: AssetItem[] = [
    {key: "sound1", path: "sound1.mp3"},
];

export const gltfModels: AssetItem[] = [
    {key: "building", path: "building/building.glb"},
    {key: "ped", path: "ped/ped.glb"}
]