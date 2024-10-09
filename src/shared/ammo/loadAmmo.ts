export async function loadAmmo(_ammo: any)
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