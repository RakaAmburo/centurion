import validator from "./securityUtils.js";

// let token = validator.generateToken();
// console.log(token)
// console.log(await validator.tokenIsNotValid(token))

/* let prot = validator.getPayloadStructure("hola", validator.webSocketComType.inst);
let message = prot.prepareToSend()
console.log(message) */
console.log(await validator.protocolCheck(1))
//console.log(validator.protocolExtract("VvL0w2hcwTD3DcELy0cGZHHLOJHjosDgDMZ5pPOToTLLectOOcHmHCcjeTDgDk8cp9tRK2OToTLRwPHvqdBTSWZuDTNTpPEvSJ8cqPHvpvD3V90gDkn8p9yvSJ5zw9XToTD7GsL4").message)