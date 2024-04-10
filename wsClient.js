const WebSocket = require('ws');
const fs = require('fs');
const utils = require('./utils');
const express = require('express');
const app = express();

var privateKey = fs.readFileSync(__dirname + '/certs/SAN/client-key.pem', 'utf8');
var certificate = fs.readFileSync(__dirname + '/certs/SAN/client-crt.pem', 'utf8');

const serverIp = "217.71.203.118"
const wsClient = []
var stopping = false;
var failedConnectionsTries = 0

function noop() { }
function heartbeat() {
  utils.logInfo(`heartbeat client`);
  clearTimeout(this.pingTimeout);
  this.pingTimeout = setTimeout(() => {
    this.terminate();
  }, (60000 * 4) + 10000);
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
    headers: { "authorization": "12345", "client-id": 'asus' }
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

  wss.on('ping', heartbeat);

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

  wss.on('message', function incoming(message) {
    utils.logInfo("incomming raw msg: " + message);
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

setInterval(function () {
  wsClient.send("to the server");
}, 60000 * 60 * 4);

//http server
app.use(express.json());
app.post('/alert', (req, res) => {
  wsClient.send(req.body.message);
  res.json({});
});

const PORT = process.env.PORT || 8181;
app.listen(PORT, () => {
  console.log(`Servidor JSON corriendo en el puerto ${PORT}`);
});
