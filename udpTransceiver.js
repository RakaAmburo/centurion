import { createSocket } from 'dgram';
import utils from './commonUtils.js';
import responseObserver from './responseObserver.js';

class udpTransceiver {
    static #client
    static #destPort
    static init(serverPort, clientPort, destPort){
        if (!this.#client){
            this.#destPort = destPort
            this.#client = this.#createAndConfigServerAndClient(serverPort, clientPort)
        }
    }
    static #createAndConfigServerAndClient(serverPort, clientPort){
        const server = createSocket('udp4');
        const client = createSocket('udp4');
        server.bind(serverPort);
        client.bind(clientPort, function () { client.setBroadcast(true) });
        server.on('listening', function () {
            var address = server.address();
            console.log("UDP Server listening on localhost:" + address.port);
        });
        server.on('message', function (message, remote) {
            utils.logInfo('msg from: ' + remote.address + ':' + remote.port + ' - ' + message)
            responseObserver.notifyResponse("UDP_TRANSCEIVER", message.toString())
        });
        return client
    }
    static async transceive(message){ 
        this.transmit(message)
        return responseObserver.listenResponseOrFail("UDP_TRANSCEIVER", 1000, "NO UDP RESPONSE")
    }
    static transmit(message){
        this.#client?.send(message, this.#destPort, '192.168.1.255', (err) => {
            if (err){
                utils.logInfo("Error sending udp message: " + message)
                utils.logInfo(err)
                utils.logInfo(err.stack)
            }
        });
    }
}


export default udpTransceiver;