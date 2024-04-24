import moment from 'moment';
import random from 'random';
import secProps from './securedProperties.js';
import gralUtils from './utils.js';
import Memcached from 'memcached';
const memcached = new Memcached('localhost:11211', { timeout: 3000, retries: 2 })

class validator {

    static #scrumblePayload(msg) {
        let blurred = Buffer.from(msg).toString('base64')
        blurred = blurred.replace(/([a-zA-Z]{1})/g, (letter) => {
            let realPos = secProps.letters.indexOf(letter)
            return secProps.scrambledLetters.charAt(realPos)
        });
        blurred = blurred.replace(/([0-9]{1})/g, (number) => {
            return secProps.scrambleddNumbers.charAt(new Number(number))
        });
        return blurred
    }

    static #unScrumblePayload(msg) {
        msg = msg.replace(/([a-zA-Z]{1})/g, (char) => {
            let fakePos = secProps.scrambledLetters.indexOf(char)
            return secProps.letters.charAt(fakePos)
        });
        msg = msg.replace(/([0-9]{1})/g, (char) => {
            return secProps.scrambleddNumbers.indexOf(new Number(char))
        });
        msg = Buffer.from(msg, 'base64').toString('utf-8');
        return msg
    }

    static generateToken() {
        let cardId = Math.floor(Math.random() * 99)
        let basicToken = this.#generateRawToken(cardId)
        let baseToken = Buffer.from(basicToken).toString('base64')
        let scrambledBaseToken = baseToken.replace(/([a-zA-Z]{1})/g, (letter) => {
            let realPos = secProps.letters.indexOf(letter)
            return secProps.scrambledLetters.charAt(realPos)
        });
        scrambledBaseToken = scrambledBaseToken.replace(/([0-9]{1})/g, (number) => {
            return secProps.scrambleddNumbers.charAt(new Number(number))
        });
        return scrambledBaseToken
    }

    static generateTokenWithBearer() {
        let scrambledBaseToken = this.generateToken()
        return `Bearer ${scrambledBaseToken}`
    }

    static async #storeToken(token) {
        return new Promise(function (resolve, reject) {
            memcached.add(token, 'exist', 80, function (err) {
                if (err) {
                    console.log(err)
                    reject("Problem connecting (add) with memchaced")
                } else {
                    resolve()
                }
            });
        })
    }

    static async #isRepeated(token) {
        return new Promise(function (resolve, reject) {
            memcached.get(token, function (err, data) {
                //console.log("checking this token " + token)
                if (err) {
                    console.log(err)
                    reject("Problem connecting (get) with memchaced")
                }
                else if (data) {
                    reject("token repeated found in cache: " + token)
                } else {
                    resolve()
                }
            });
        })
    }

    static async tokenIsNotValid(token) {
        if (!token || typeof token === 'number' || token.length < 6) {
            return true
        }
        let original = token
        await this.#isRepeated(token)
        let reSorting = token.replace(/([a-zA-Z]{1})/g, (char) => {
            let fakePos = secProps.scrambledLetters.indexOf(char)
            return secProps.letters.charAt(fakePos)
        });
        token = reSorting.replace(/([0-9]{1})/g, (char) => {
            return secProps.scrambleddNumbers.indexOf(new Number(char))
        });
        token = Buffer.from(token, 'base64').toString('utf-8');
        let chars = token.split('')
        let TokenPre = chars[0]
        let TokenPost = chars.slice(-1)
        let cardId = new Number((TokenPre === "H") ? TokenPost : TokenPre + TokenPost)
        let tokeIsValid = this.#rawTokenIsValid(token)
        if (tokeIsValid) {
            await this.#storeToken(original)
        }
        //console.log("just generated => " + validToken)
        //console.log("camming from app => " + token)
        return (tokeIsValid) ? false : true
    }

    static async tokenIsNotValidWithBearer(token) {
        token = token.replace(/Bearer /g, '')
        return this.tokenIsNotValid(token)
    }

    static #generateRawToken(cardId) {
        let timestumpLastPart = moment().unix().toString().slice(-6)
        //console.log(moment().unix())
        let card = secProps.strategy[cardId]
        let modifier = new Number(card.join(''))
        let parcial = new Number(timestumpLastPart) + modifier
        let cardIdStr = cardId.toString()
        let pre, post
        if (cardIdStr.length == 1) {
            pre = 'H'
            post = cardIdStr
        } else {
            let splited = cardIdStr.split('')
            pre = splited[0]
            post = splited[1]
        }
        let validToken = pre + parcial.toString().replace(/0/g, 'X') + post
        return validToken
    }

    static #rawTokenIsValid(token) {
        let pre = token[0]
        let post = token[token.length - 1]
        let core = new Number(token.slice(1, -1).replace(/X/g, '0'))
        let cardId
        if (pre == 'H') {
            cardId = post
        } else {
            cardId = pre + post
        }
        let card = secProps.strategy[cardId]
        let modifier = new Number(card?.join(''))
        let timestampLastPart = core - modifier
        let timestampFirstPart = moment().unix().toString().slice(0, -6)
        let sentTimestamp = timestampFirstPart + timestampLastPart.toString()
        sentTimestamp = moment.unix(sentTimestamp)
        let actualTimeStump = moment()
        let diff = actualTimeStump.diff(sentTimestamp, 'seconds')
        return diff >= 0 && diff <= 20
    }

    static webSocketComType = {
        inst : 'INSTRUCTION',
        resp : 'RESPONSE'
    }

    static getPayloadStructure(message, type, parameters) {
        class communicationProtocol {
            #message
            #type
            #parameters
            #scrumbleMethod
            constructor(message, type, parameters, scrumbleMethod) {
                this.#message = message
                this.#type = type
                this.#parameters = parameters
                this.#scrumbleMethod = scrumbleMethod
            }
            prepareToSend() {
                let tk = validator.generateToken()
                let payload = {
                    token: tk,
                    type: this.#type,
                    message: this.#message,
                    parameters: this.#parameters ?? {},//{ 'vc-vib': 2 },
                    just2annoy: ';)'
                }
                console.log(JSON.stringify(payload))
                return this.#scrumbleMethod(JSON.stringify(payload))
            }
        }
        return new communicationProtocol(message, type, parameters, this.#scrumblePayload)
    }

    static protocolExtract(incommingMessage) {
        incommingMessage = this.#unScrumblePayload(incommingMessage)
        class Payload{
            message
            type
            parameters
            constructor(message, type, parameters){
                this.message = message
                this.type = type
                this.parameters = parameters
            }
        }
        let paylod = new Payload()
        Object.assign(paylod, JSON.parse(incommingMessage))
        return paylod
    }

    static async protocolCheck(incommingMessage) {
        try {
            incommingMessage = this.#unScrumblePayload(incommingMessage)
            let parsed = JSON.parse(incommingMessage);
            if (await validator.tokenIsNotValid(parsed.token)) {
                gralUtils.logInfo('Token not valid!!')
                throw new Error('Token not valid!')
            }
            return parsed.hasOwnProperty('data') && parsed.hasOwnProperty('just2annoy')
        } catch (e) {
            gralUtils.logInfo(e)
            gralUtils.logInfo(incommingMessage)
            return false;
        }
    }
}

export default validator;