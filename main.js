import { createServer } from 'https';
import { WebSocketServer } from 'ws';
import { readFileSync } from 'fs';
import express, { json } from 'express';
const app = express();
import rateLimit from 'ws-rate-limit';
var limiter = rateLimit('10s', 20)
import utils from './commonUtils.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import validator from './securityUtils.js';
import requestHandler from './commands/commandHandler.js';
import commands from './commands/commandConstructor.js';
import MessageQueue from './messageQueue.js';
import responseObserver from './responseObserver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


var privateKey = readFileSync(__dirname + '/certs/SAN/server.key', 'utf8');
var certificate = readFileSync(__dirname + '/certs/SAN/server.crt', 'utf8');
var clientCert = [readFileSync(__dirname + '/certs/SAN/client-ca-crt.pem', 'utf8')]
var options = {
    key: privateKey,
    cert: certificate,
    ca: clientCert,
    requestCert: true
};
var server = createServer(options, app)

/* WEB SOCKET CONFIG START */
const wsConns = new Map();
//checker.setWsConns(wsConns)
function noop() { }

class heartbeat {
    getMechanism = (clientId, ws) => {
        return () => {
            utils.logInfo("pong from " + clientId);
            ws.isAlive = true;
        }
    }
}

const wss = new WebSocketServer({
    noServer: true,
    maxPayload: 450,
    verifyClient: async (info, callback) => {
        try {
            utils.logInfo("Verifying Client!")
            let clientId = info.req.headers['client-id']
            let token = info.req.headers.authorization
            if (wsConns.get(clientId)) {
                utils.logInfo(`${clientId} allready connected, so rejecting!`)
                callback(false, 401, 'Unauthorized');
            }
            if (await validator.tokenIsNotValidWithBearer(token)) {
                utils.logInfo(`token (${token}) not authorized from ${clientId}`)
                callback(false, 401, 'Unauthorized');
            } else {
                callback(true);
            }
        } catch (error) {
            utils.logInfo(error)
            callback(false, 404, 'Not Found');
        }
        callback(true);
    }
});

server.on('upgrade', function upgrade(request, socket, head) {
    console.log('Upgrade request received');
    wss.handleUpgrade(request, socket, head, (ws) => {
        console.log('llamanding upgrade');
        wss.emit('connection', ws, request);
    });
})

/* const respObserver = (timeout, errMessage) => {
    return {
        res: null,
        redirect: (message) => {
            res(message)
        },
        expect: async () => {
            let timeOutProm = new Promise((resolve, reject) => {
                setTimeout(() => { reject(errMessage); }, timeout);
            })
            let messageProm = new Promise((resolve, reject) => {
                res = resolve
            })
            return Promise.race([
                messageProm,
                timeOutProm,
            ])
        }
    }
} */

wss.on('connection', function connection(ws, req) {
    utils.logInfo("remote address: " + req.socket.remoteAddress)
    // limit requests -> 2 per second
    limiter(ws)
    ws.isAlive = true;
    let clientId = req.headers['client-id']
    ws.on('pong', (new heartbeat).getMechanism(clientId, ws));
    utils.logInfo("ws connected " + clientId)
    //let obs = respObserver(4000, "web socket time out")
    wsConns.set(clientId, ws)
    ws.on('message', async function incoming(payload) {
        payload = payload.toString()
        utils.logInfo("incomming raw message: " + payload)
        if (await validator.protocolCheck(payload)) {
            let extracted = validator.protocolExtract(payload)
            if (extracted.type == validator.WSType.RESP) {
                utils.logInfo("Response from client: " + extracted.message)
                responseObserver.notifyResponse(extracted.taskId, extracted.message)
            } else if (extracted.type == validator.WSType.INST) {
                utils.logInfo("Instruction from client")
                let cmdResponse = await requestHandler([extracted.message], commands, wsConns, null, "server")
                let response = validator
                    .getPayloadStructure(cmdResponse, validator.WSType.RESP, extracted.taskId)
                ws.send(response.prepareToSend())
            }



            /* if (extracted.message == "alert bath") {
                severity = 1;
                let response = validator
                    .getPayloadStructure("alert received!", validator.WSType.RESP, extracted.taskId)
                ws.send(response.prepareToSend())
            } else if (extracted.message == "PULL_RESTART") {
                utils.pullFromGitAndRestart()
                let response = validator
                    .getPayloadStructure("instruction processed!", validator.WSType.RESP, extracted.taskId)
                ws.send(response.prepareToSend())
            } */
        } else {
            utils.logInfo("Closing web socket due to an invalid protocol!!!")
            //blacklist when stable
            ws.close();
        }
    });

    ws.on('limited', msg => {
        utils.logInfo('Rate limit activated!')
        utils.logInfo(JSON.stringify(req.headers))
        ws.send('I got your information!');
    })

    ws.on('close', function close() {
        utils.logInfo(clientId + ' ws closed')
        wsConns.delete(clientId)
    });

    ws.on('error', function (err) {
        utils.logError('ws error: ' + err);
    });
});

/* ping heartbeat interval, terminates the connections if idle */
const interval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping(noop);
    });
}, 60000 * 4);

wss.on('close', function close() {
    clearInterval(interval);
});
/* WEB SOCKET CONFIG END */

app.use(json());

/* validates each request with a token */
var validate = async (req, res, next) => {
    //utils.logInfo("endpint auth token: " + req.headers['authorization'])
    try {
        utils.logInfo("checking ip: " + req.ip)
        if (await validator.isblackListed(req.ip)) {
            return res.status(403).send('Not authorized!');
        }
        if (await validator.tokenIsNotValidWithBearer(req.headers['authorization'])) {
            utils.logInfo("token not authorized: " + req.headers['authorization'])
            //blacklist when stable
            return res.sendStatus(401)
        }
    } catch (error) {
        utils.logError(error)
        //blacklist when stable?
        return res.sendStatus(404)
    }
    next();
}
app.use(validate)

app.get('/status', async (req, res, next) => {
    let message = "All good!"
        if (!wsConns.get("raspberry")) {
            MessageQueue.severity = 1
            message = "raspberry not connected!"
        }
    let response = { "events": [{ "id": "someId", "severity": MessageQueue.severity, "message": "All good not imp" }] }
    MessageQueue.severity = 3
    res.json(response)
})

app.post('/exec', async (req, res, next) => {
    let possibleCmds = req.body.possibleMessages
    let cmdResponse = await requestHandler(possibleCmds, commands, wsConns, null, "server")
    utils.logInfo("cmdResponse: " + cmdResponse)
    let response = { "events": [{ "id": "someId", "severity": MessageQueue.severity, "message": cmdResponse.status[0] }] }
    res.json(response)
    /* if (req.body.dest == "raspberry") {
        let ws = wsConns.get("raspberry")
        let payload = validator
            .getPayloadStructure(req.body.message, validator.WSType.INST)
        ws.send(payload.prepareToSend())
        res.json({ "events": [{ "id": "someId", "severity": 0, "message": "OK" }] })
    } else {
        let message = "All good!"
        if (!wsConns.get("raspberry")) {
            MessageQueue.severity = 1
            message = "raspberry not connected!"
        }
        let response
        //response = "{\"events\":[{\"id\":\"articles\",\"severity\":\"1\",\"message\":\"All good\"}]}"
        //await postHanler(req)
        response = { "events": [{ "id": "someId", "severity": MessageQueue.severity, "message": message }] }
        MessageQueue.severity = 3;
        //gralUtils.logInfo(JSON.stringify(response))
        res.json(response)
    } */
})

app.use(function (req, res, next) {
    utils.logInfo('requested Route that not exist')
    res.status(404).send({
        status: 404,
        message: 'you have nothing to do here! you will be banned',
        type: 'just4lelos'
    })
})

server.listen(8888, function () {
    let host = server.address().address
    let port = server.address().port
    utils.logInfo(`Started voice command app, listening at port ${port}`)
})

