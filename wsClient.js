import properties from './securedProperties.js';
import validator from './securityUtils.js';
import responseObserver from './responseObserver.js';
import WebSocket from 'ws';
import { readFileSync } from 'fs';
import utils from './commonUtils.js';
import commands from './commands/commandConstructor.js';
import requestHandler from './commands/commandHandler.js';
import express, { json } from 'express';
const app = express();
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const clientId = process.env.WEBSOCKET_CLIENT_ID
import udpTransceiver from './udpTransceiver.js';
udpTransceiver.init(8284, 8285, 8286)

var privateKey = readFileSync(__dirname + '/certs/SAN/client-key.pem', 'utf8');
var certificate = readFileSync(__dirname + '/certs/SAN/client-crt.pem', 'utf8');

const serverIp = properties.centurionIp
const wsClient = []
var stopping = false;

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


var lastUsedIp
var wss
wsClient.start = (ip) => {
  utils.logInfo('connecting ws to ' + ip)
  let wsPort = 8888
  wss = new WebSocket(`wss://${ip}:${wsPort}`, {
    protocolVersion: 8,
    origin: `wss://${ip}:${wsPort}`,
    rejectUnauthorized: false,
    key: privateKey,
    cert: certificate,
    headers: {
      "authorization": validator.generateTokenWithBearer(),
      "client-id": clientId
    }
  });

  wss.on('open', function () {
    utils.logInfo('socket client open');
  });

  wss.on('ping', (new heartbeat()).getMechanism(wss));

  wss.on('close', async function () {
    utils.logInfo(`ws connection to  closed`);
    clearTimeout(this.pingTimeout);
    await utils.wait(10000)
    wsClient.start(serverIp)
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
      } else if (extracted.type == validator.WSType.INST) {
        udpTransceiver.transmit(extracted.message)
      }
    } else {
      utils.logError("protocol check failed!!!")
    }
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

wsClient.start(serverIp)

//http server
app.use(json());
app.post('/alert', async (req, res) => {
  let possibleCmds = req.body.possibleMessages
  res.json(await requestHandler(possibleCmds, commands, null, wsClient, clientId))

  /* if (req.body.dest == clientId) {
    if (req.body.message == "PULL_RESTART") {
      utils.pullFromGitAndRestart()
      res.json({ status: 'processing!' });
    } else {
      let resp = await udpTransceiver.transceive(req.body.message)
      res.json({ status: resp });
    }

  } else {
    let payload = validator.getPayloadStructure(req.body.message, validator.WSType.INST)
    wsClient.send(payload.prepareToSend());
    let response = await responseObserver
      .listenResponseOrFail(payload.getId(), 2000, "Centurion not responding!")
    res.json({ status: response });
  } */
});

const PORT = process.env.PORT || 8181;
app.listen(PORT, () => {
  console.log(`Servidor JSON corriendo en el puerto ${PORT}`);
});
