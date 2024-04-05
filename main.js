const https = require('https');
const WebSocket = require('ws');
const fs = require('fs');
const express = require('express');
const app = express();
const rateLimit = require('ws-rate-limit')
var limiter = rateLimit('10s', 20)
const utils = require('./utils');

var privateKey = fs.readFileSync(__dirname + '/certs/server.key', 'utf8');
var certificate = fs.readFileSync(__dirname + '/certs/server.crt', 'utf8');
var clientCert = [fs.readFileSync(__dirname + '/certs/client-ca-crt.pem', 'utf8')]
var options = {
    key: privateKey,
    cert: certificate,
    ca: clientCert,
    requestCert: true
};
var server = https.createServer(options, app)

/* WEB SOCKET CONFIG START */
const wsConns = new Map();
//checker.setWsConns(wsConns)
function noop() { }
function heartbeat() {
    utils.logInfo("heartbeat server")
    this.isAlive = true;
}
const wss = new WebSocket.Server({
    noServer: true,
    maxPayload: 450,
    verifyClient: async (info, callback) => {
        /* try {
            let clientId = info.req.headers['client-id']
            let token = info.req.headers.authorization
            if (wsConns.get(clientId)) {
                gralUtils.logInfo(`${clientId} allready connected, so rejecting!`)
                callback(false, 401, 'Unauthorized');
            }
            if (await validator.isNotValid(token)) {
                gralUtils.logInfo(`token (${token}) not authorized from ${clientId}`)
                callback(false, 401, 'Unauthorized');
            } else {
                callback(true);
            }
        } catch (error) {
            gralUtils.logInfo(error)
            callback(false, 404, 'Not Found');
        } */
        callback(true);
    }

});
server.on('upgrade', function upgrade(request, socket, head) {
    wss.handleUpgrade(request, socket, head, function done(ws) {
        wss.emit('connection', ws, request);
    });
})

const respObserver = (timeout, errMessage) => {
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
}

wss.on('connection', function connection(ws, req) {

    // limit requests -> 2 per second
    limiter(ws)

    ws.isAlive = true;
    ws.on('pong', heartbeat);

    let clientId = req.headers['client-id']
    utils.logInfo("ws connected " + clientId)
    let obs = respObserver(4000, "web socket time out")
    wsConns.set(clientId, { ws, obs })

    ws.on('message', function incoming(msg) {
        utils.logInfo("incomming raw msg: " + msg)
        ws.send("received")
        /* if (validator.protocolCheck(msg)){
            let message = validator.comProtExtract(msg).data
            gralUtils.logInfo("incomming ws msg: " + message)
            if (message.startsWith('BI-INSTRUCTION:')) {
                if (!wsConns.get("BI_COMPUTER")) {
                    gralUtils.logInfo("BI_COMPUTER web client not connected!")
                } else {
                    let { ws, obs } = wsConns.get("BI_COMPUTER")
                    let comProt = validator.getComProt();
                    comProt.data = message.replace("BI-INSTRUCTION:", "")
                    ws.send(comProt.prepare())
                    gralUtils.logInfo('Instruction to BI sent!')
                }
            } else {
                obs.redirect(message)
            }
        } else {
            gralUtils.logInfo('Wrong communication protocols structure!')
            gralUtils.logInfo(msg)
            ws.send('You are and intruder, authorities has been adviced!')
        } */
    });

    ws.on('limited', msg => {
        utils.logInfo('Rate limit activated!')
        utils.logInfo(JSON.stringify(req.headers))
        ws.send('I got your information.');
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

app.use(express.json());

/* validates each request with token */
var validate = async (req, res, next) => {
    //gralUtils.logInfo("endpint auth token: " + req.headers['authorization'])
    try {
        //if (await validator.isNotValid(req.headers['authorization'])) {
        if (false) {
            //gralUtils.logInfo("token not authorized: " + req.headers['authorization'])
            return res.sendStatus(401)
        }
    } catch (error) {
        //gralUtils.logError(error)
        return res.sendStatus(404)
    }
    next();
}
app.use(validate)

app.post('/exec', async (req, res, next) => {

    let response
    response = "{\"events\":[{\"id\":\"articles\",\"severity\":\"1\",\"message\":\"All good\"}]}"//await postHanler(req)
    //gralUtils.logInfo(JSON.stringify(response))
    res.json(response)

})

app.use(function (req, res, next) {
    //gralUtils.logInfo('requested Route that not exist')
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

