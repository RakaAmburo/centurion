
import validator from "../securityUtils.js"
import responseObserver from "../responseObserver.js"

class CommandUtils {
    static async forward(data, dest){
        let client
        if (data.env == "server") {
            client = data.wsConns.get(dest)
        } else {
            client = data.wsClient
        }
        let payload = validator.getPayloadStructure(data.originalMatchingAllConditions, validator.WSType.INST)
        client.send(payload.prepareToSend());
        let response = await responseObserver
            .listenResponseOrFail(payload.getId(), 2000, dest + " not responding!")
        return response
    }
}

export default CommandUtils