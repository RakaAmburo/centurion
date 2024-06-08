import MessageQueue from "../../messageQueue.js"

let misc = {
    'tell.status': {
        skipFolderName: false,
        func: async (data) => {
            let resp
            let message = "All good!"
            if (!data.wsConns.get("raspberry")) {
                MessageQueue.severity = 1
                message = "raspberry not connected!"
            }
            let response
            response = { "events": [{ "id": "someId", "severity": MessageQueue.severity, "message": message }] }
            MessageQueue.severity = 3;
            return ["Some alert detected"]
        }
    }
}

export default misc