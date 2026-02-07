
import validator from "../securityUtils.js"
import responseObserver from "../responseObserver.js"

class CommandUtils {
    static async forward(data, dest) {
        let client
        if (data.env == "server") {
            client = data.wsConns.get(dest)
        } else {
            client = data.wsClient
        }
        let payload = validator.getPayloadStructure(data.originalMatchingAllConditions, validator.WSType.INST, null, data.extraParams)
        client.send(payload.prepareToSend());
        let response = await responseObserver
            .listenResponseOrFail(payload.getId(), 2000, dest + " not responding!")
        return response
    }

    //executeAndPost(setToken, (result) => ({\"possibleMessages\":[\"home bath movement detected\"]}), 'miTokenABC');
    static async execAndAlert(fn, resultBuilder, ...params) {
        const result = fn(...params);
        const postData = resultBuilder(result);
        try {
            await fetch('http://192.168.1.135:8181/alert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData)
            });
        } catch (error) {
            // Ignorar error o loguearlo
        }
    }
}

export default CommandUtils