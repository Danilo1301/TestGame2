import express from 'express';
import http from 'http';
import socketio from 'socket.io';
import path from 'path';

import { Debug } from '../shared/debug';
Debug.useColor = false;

const app: express.Application = express();
const server: http.Server = http.createServer(app);
const io: socketio.Server = new socketio.Server();
const port = 3000;

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.use(express.static(path.join(__dirname, "..", "..", "public")));

io.attach(server, {
  //path: '/socket',
  cors: { origin: '*' }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Express web server started: http://localhost:${port}`);
});


console.log("Starting geckos...");

class Ent {
  public positionX: number = 2.50;
}

const ent = new Ent();

import { ObjectWatcher } from "../shared/objectWatcher/objectWatcher";
const objectWatcher = new ObjectWatcher();

const entityInfo = objectWatcher.createGroup("entity_info");
entityInfo.watch("x", () => ent.positionX);

entityInfo.onChange = () => {
  console.log("something changed");
};

import '@geckos.io/phaser-on-nodejs'

const _global: any = global;
_global['phaserOnNodeFPS'] = 5

console.log("Geckos started!");

import { MasterServer } from './masterServer/masterServer';

const assetsPath = path.join(__dirname, "..", "..", "public", "assets");

console.log(assetsPath)

const masterServer = new MasterServer();
masterServer.start({
  ammo: require('@enable3d/ammo-on-nodejs/ammo/ammo.js'),
  io: io,
  assetsPath: assetsPath
});
