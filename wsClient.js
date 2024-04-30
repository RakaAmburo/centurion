import properties from './securedProperties.js';
import validator from './securityUtils.js';
import responseObserver from './responseObserver.js';
import WebSocket from 'ws';
import { readFileSync } from 'fs';
import utils from './commonUtils.js';
import express, { json } from 'express';
const app = express();
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

var privateKey = readFileSync(__dirname + '/certs/SAN/client-key.pem', 'utf8');
var certificate = readFileSync(__dirname + '/certs/SAN/client-crt.pem', 'utf8');

const serverIp = properties.centurionIp
const wsClient = []
var stopping = false;
var failedConnectionsTries = 0

class heartbeat {
  getMechanism = (wss) => {
    return () => {
      utils.logInfo(`Server pinged`);
      clearTimeout(wss.pingTimeout);
      wss.pingTimeout = setTimeout(() => {
        wss.terminate();
      }, (60000 * 4) + 10000);
    }
  }
}

var currentConnStatus
var tryedIp
var lastUsedIp
var wss
wsClient.start = (ip, st) => {
  currentConnStatus = st
  tryedIp = ip
  utils.logInfo('connecting ws to ' + ip)
  let wsPort = 8888
  wss = new WebSocket(`wss://${ip}:${wsPort}`, {
    protocolVersion: 8,
    origin: `wss://${ip}:${wsPort}`,
    rejectUnauthorized: false,
    key: privateKey,
    cert: certificate,
    headers: { "authorization": validator.generateTokenWithBearer(), "client-id": 'raspberry' }
  });

  wss.on('open', function () {
    /* failedConnectionsTries = 0
    clearTimeout(this.pingTimeout);
    this.pingTimeout = setTimeout(() => {
      this.terminate();
    }, 30000 + 1000);
    lastUsedIp = tryedIp */
    utils.logInfo('socket client open');
  });

  wss.on('ping', (new heartbeat()).getMechanism(wss));

  wss.on('close', async function () {
    utils.logInfo(`ws connection to  closed`);
    clearTimeout(this.pingTimeout);
    await sleep(10000)
    wsClient.start(serverIp, "status")
    /* clearTimeout(this.pingTimeout);
    let useIp = (lastUsedIp) ? lastUsedIp : tryedIp
    gralUtils.logInfo(`ws connection to ${useIp} closed`);
    if (!stopping) {
      await sleep(10000)
      wsClient.start(useIp, currentConnStatus)
    } else {
      stopping = false;
    } */
  });

  wss.on('error', function (error) {

    utils.logError("Socket client error: " + error.message)
  });

  wss.on('message', async function incoming(message) {
    utils.logInfo("incomming raw msg: " + message);
    message = message.toString()
    if (await validator.protocolCheck(message)) {

      let extracted = validator.protocolExtract(message)
      if (extracted.type == validator.WSType.RESP) {
        responseObserver.notifyResponse(extracted.taskId, extracted.message)
      }
    } else {
      utils.logError("protocol fail!")
    }
    /* if (!validator.protocolCheck(message)) {
     gralUtils.logInfo('Wrong communication protocols structure!')
   } else {
     let action = validator.comProtExtract(message).data
     if (action.startsWith('connect2home:')) {
       let ipAndstatus = action.replace("connect2home:", "").split(':')
       gralUtils.logInfo("Trying to desconnect ws from aws and connect home")
       wsClient.stop()
       setTimeout(() => {
         wsClient.start(ipAndstatus[0], ipAndstatus[1])
       }, 10000);
     }
     let comProt = validator.getComProt(); 
     gralUtils.logInfo("Exec action: " + action);
   } */

  });

}

wsClient.stop = () => {
  lastUsedIp = null
  if (wss) {
    stopping = true
    wss.close()
  }
}

wsClient.send = (message) => {
  if (wsClient.isConnected) {
    wss.send(message)
  }
}

wsClient.isConnected = () => {
  return wss && wss.readyState === WebSocket.OPEN
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

wsClient.start(serverIp, "")

/* setInterval(function () {
  wsClient.send("to the server");
}, 60000 * 60 * 4); */

//http server
app.use(json());
app.post('/alert', async (req, res) => {
  let payload = validator.getPayloadStructure(req.body.message, validator.WSType.INST)
  wsClient.send(payload.prepareToSend());
  let response = await responseObserver
    .listenResponseOrFail(payload.getId(), 2000, "Centurion not responding!")
  res.json({ status: response });
});

const PORT = process.env.PORT || 8181;
app.listen(PORT, () => {
  console.log(`Servidor JSON corriendo en el puerto ${PORT}`);
});
