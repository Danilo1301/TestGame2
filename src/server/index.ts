import express from 'express';
import http from 'http';
import socketio from 'socket.io';
import path from 'path';

import { Debug } from '../utils/debug/debug';
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
  Debug.log("index", `Express web server started: http://localhost:${port}`);
});


Debug.log("index", "Starting geckos...");

import '@geckos.io/phaser-on-nodejs'

const _global: any = global;
_global['phaserOnNodeFPS'] = 5

Debug.log("index", "Geckos started!");

import { MasterServer } from './masterServer/masterServer';

Debug.log("index", "index");
const masterServer = new MasterServer(io);
masterServer.start();
