import socketio, { Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { BaseObject } from "../../shared/baseObject"
import { IPacket, IPacketData, IPacketData_ClientData, IPacketData_EnterLeaveVehicle, IPacketData_Entity_Info_Basic, IPacketData_JoinedServer, IPacketData_Models, IPacketData_WeaponShot, PACKET_TYPE } from "../../game/network/packet";
import { MasterServer } from '../masterServer/masterServer';
import { Server } from '../server/server';
import { Ped, PedData_JSON } from '../../game/entities/ped';
import { Entity, EntityType } from '../../game/entities/entity';
import { XYZ, XYZ_SetValue, XYZW_SetValue } from '../../shared/ammo/ammoUtils';
import THREE from 'three';
import { Vehicle } from '../../game/entities/vehicle';

export class Client extends BaseObject
{
    public get id() { return this._id; }
    public get socket() { return this._socket; }
    //public get user() { return this._user!; }

    private _id: string = uuidv4();
    private _socket: socketio.Socket;
    //private _user?: User;

    private _server?: Server;
    private _player?: Ped;

    public entitiesCreated: string[] = [];
    public isReady: boolean = false;

    constructor(socket: socketio.Socket)
    {
        super();

        this._socket = socket;

        socket.on('p', (packet: IPacket) => {
            try {
                this.onReceivePacket(packet);
            } catch (error) {
                console.error(error)
            }
        });
    }

    public send<T extends IPacketData>(packetType: PACKET_TYPE, data: T)
    {
        const packet: IPacket = {
            type: packetType,
            data: data
        }
        this.socket.emit('p', packet);

        //this.log(`sent packet '${packet.type}'`);
    }

    public onReceivePacket(packet: IPacket)
    {
        //this.log(`reiceved packet '${packet.type}'`);

        if(packet.type == PACKET_TYPE.PACKET_REQUEST_MODELS)
        {
            const server = MasterServer.Instance.getServers()[0];

            const data: IPacketData_Models = {
                models: []
            }

            for(const gltf of server.game.gltfCollection.gltfs.values())
            {
                data.models.push(gltf.toJSON());
            }

            this.send(PACKET_TYPE.PACKET_MODELS, data);

            return;
        }

        if(packet.type == PACKET_TYPE.PACKET_CLIENT_READY)
        {
            this.isReady = true;

            const server = this._server!;

            server.entityWatcher.setAllEntityAsChangedAll();

            return;
        }
        
        if(packet.type == PACKET_TYPE.PACKET_CLIENT_INFO)
        {
            const data = packet.data as IPacketData_Entity_Info_Basic;

            const player = this._player;

            if(!player) return;

            let entity: Entity = player;
            
            if(player.onVehicle) {
                entity = player.onVehicle;
            } else {
            }
            
            const type = data.type;

            const entityInput: XYZ = {x: player.inputX, y: player.inputY, z: player.inputZ};
            const input = XYZ_SetValue(data.input, entityInput);
            player.inputX = input.x!;
            player.inputY = input.y!;
            player.inputZ = input.z!;

            //console.log(data.input)

            if(type == EntityType.BIKE || type == EntityType.VEHICLE)
            {
                const entityPosition = entity.getPosition();
                
                const position = XYZ_SetValue(data.position, {x: entityPosition.x(), y: entityPosition.y(), z: entityPosition.z()});

                const posA = new THREE.Vector3(entityPosition.x(), entityPosition.y(), entityPosition.z());
                const posB = new THREE.Vector3(position.x, position.y, position.z);

                if(posA.distanceTo(posB) >= 0.3) {
                    entity.setPosition(position.x!, position.y!, position.z!);

                    const entityRotation = entity.getRotation();
                    const rotation = XYZW_SetValue(data.rotation, {x: entityRotation.x(), y: entityRotation.y(), z: entityRotation.z(), w: entityRotation.w()});
                    entity.setRotation(rotation.x!, rotation.y!, rotation.z!, rotation.w!);
                }

                // entity.setPosition(position.x!, position.y!, position.z!);

                // const entityRotation = entity.getRotation();
                // const rotation = XYZW_SetValue(data.rotation, {x: entityRotation.x(), y: entityRotation.y(), z: entityRotation.z(), w: entityRotation.w()});
                // entity.setRotation(rotation.x!, rotation.y!, rotation.z!, rotation.w!);
            }

            if(type == EntityType.PED)
            {
                const playerPosition = entity.getPosition();
                const position = XYZ_SetValue(data.position, {x: playerPosition.x(), y: playerPosition.y(), z: playerPosition.z()});

                const posA = new THREE.Vector3(playerPosition.x(), playerPosition.y(), playerPosition.z());
                const posB = new THREE.Vector3(position.x, position.y, position.z);

                if(posA.distanceTo(posB) >= 0.3) {
                    entity.setPosition(position.x!, position.y!, position.z!);
                }

                if(data.aiming != undefined) player.aiming = data.aiming;

                const pedLookDir = player.lookDir;
                const lookDir = XYZW_SetValue(data.lookDir, {x: pedLookDir.x(), y: pedLookDir.y(), z: pedLookDir.z(), w: pedLookDir.w()});
                player.lookDir.setValue(lookDir.x!, lookDir.y!, lookDir.z!, lookDir.w!);

                if(data.weapon != undefined)
                {
                    let currentWeaponId = -1;
                    if(player.weapon) currentWeaponId = player.weapon.weaponData.id;

                    if(currentWeaponId != data.weapon)
                    {
                        player.equipWeapon(data.weapon);
                    }
                }
            }
            return;
        }

        if(packet.type == PACKET_TYPE.PACKET_ENTER_LEAVE_VEHICLE)
        {
            const data = packet.data as IPacketData_EnterLeaveVehicle;

            const player = this._player;

            if(!player) return;

            if(!player.onVehicle)
            {
                const vehicle = player.game.entityFactory.entities.get(data.vehicleId) as Vehicle;

                if(!vehicle) return;

                console.log(`player entered vehicle ${vehicle.id}`)

                player.enterVehicle(vehicle);
            } else {
                console.log(`player left`)

                player.leaveVehicle();
            }
        }

        if(packet.type == PACKET_TYPE.PACKET_WEAPON_SHOT)
        {
            console.log(packet);
            
            const data = packet.data as IPacketData_WeaponShot;
            const ped = this._player;

            if(ped)
            {
                const weapon = ped.weapon;

                if(weapon)
                {
                    const hitPos = new Ammo.btVector3(data.hit[0], data.hit[1], data.hit[2]);

                    weapon.shootEx(ped.cameraPosition, hitPos, false);

                    if(data.hitEntity != undefined)
                    {
                        const entityHit = ped.game.entityFactory.entities.get(data.hitEntity)

                        if(entityHit)
                        {
                            weapon.processWeaponDamage(entityHit);
                            this._server?.broadcastEntityHealth(entityHit);
                        }
                    }

                    Ammo.destroy(hitPos);
                }
            }
        }
    }

    public onConnect()
    {
        this.log(`on connect`);

        const server = MasterServer.Instance.getServers()[0];
        this.joinServer(server);
    }

    public onDisconnect()
    {
        this.log(`on disconnect`);

        const server = MasterServer.Instance.getServers()[0];
        this.leaveServer();
    }

    public joinServer(server: Server)
    {
        this.log("joining server " + server.id);

        this._server = server;
        this._server.clients.push(this);

        const player = server.game.entityFactory.spawnPed(0, 5, 0);
        this._player = player;

        this.send<IPacketData_JoinedServer>(PACKET_TYPE.PACKET_JOINED_SERVER, {
            playerId: player.id,
            serverId: server.id
        });
    }

    public leaveServer()
    {
        if(this._server)
        {
            const server = this._server;

            server.clients.splice(server.clients.indexOf(this), 1);

            if(this._player)
                server.game.entityFactory.removeEntity(this._player);

            this._server = undefined;
        }
    }
}