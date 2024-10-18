// Definindo grupos de colisão
export const GROUP_CHASSIS = 1 << 0; // Grupo 1 para o chassis
export const GROUP_WHEELS = 1 << 1;  // Grupo 2 para as rodas

// Máscara de colisão (com quem eles podem colidir)
export const MASK_CHASSIS = ~GROUP_WHEELS; // Chassis colide com tudo, menos com as rodas
export const MASK_WHEELS = ~GROUP_CHASSIS; // Rodas colidem com tudo, menos com o chassis

export class CollisionGroups {
    public static groups: number[] = [1];

    public static createCollisionGroup()
    {
        var group = 1 << 0;
        var i = 0;
        while(this.groups.includes(group))
        {
            i++;
            group = 1 << i;
        }
        this.groups.push(group);

        console.log(`[CollisionGroups] Created group ${group} (total: ${this.groups.join("|")})`);

        return group;
    }
}