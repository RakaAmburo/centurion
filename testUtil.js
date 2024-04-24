import validator from "./securityUtils.js";

// let token = validator.generateToken();
// console.log(token)
// console.log(await validator.tokenIsNotValid(token))

let prot = validator.getPayloadStructure("hola", validator.webSocketComType.inst);
let message = prot.prepareToSend()
console.log(message)
console.log(await validator.protocolCheck(message))
console.log(validator.protocolExtract(message).message)