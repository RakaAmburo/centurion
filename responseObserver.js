class responseObserver {
    static #observers = new Map()
    static async listenResponseOrFail(id, timeOut, errMessage) {
        let observer = this.#getResponseObserver(timeOut, errMessage)
        this.#observers.set(id, observer)
        return observer.listen()
    }
    static notifyResponse(id, message) {
        this.#observers.get(id).notify(message)
    }
    static #getResponseObserver(timeOut, errMessage) {
        class Listener {
            #respond
            #timeOut
            #errMessage
            constructor(timeOut, errMessage) {
                this.#timeOut = timeOut
                this.#errMessage = errMessage
            }
            notify(message) {
                this.#respond(message)
            }
            async listen() {
                let timeLimit = new Promise((resolve, reject) => {
                    setTimeout(() => { resolve(this.#errMessage); }, this.#timeOut);
                })
                let response = new Promise((resolve, reject) => {
                    this.#respond = resolve
                })
                return Promise.race([
                    response,
                    timeLimit,
                ])
            }
        }
        return new Listener(timeOut, errMessage)
    }
}

export default responseObserver