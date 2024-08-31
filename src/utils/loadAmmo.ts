const _ammo: any = require('@enable3d/ammo-on-nodejs/ammo/ammo.js')

export async function loadAmmo()
{
    await new Promise<void>((resolve) => {
        // wait for Ammo to be loaded
        _ammo().then((ammo: any) => {

            const _globalThis: any = globalThis;
            _globalThis.Ammo = ammo;
            
            resolve();
        });
    });
}