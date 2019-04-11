
var crypto = require('../utils/crypto');

var a1 = crypto.hash("test");
var a2 = crypto.hmac("test");
var a3 = crypto.cipher("seatData.userName");
var a4 = crypto.decipher(a3);
var a5 = crypto.toBase64("test");
var a6 = crypto.fromBase64(a5);

console.log(a1,"\n",a2,"\n",a3,"\n",a4,"\n",a5,"\n",a6);


var utils = require("../utils/utils")

var aa = utils.dateFormat("yy-MM-dd hh:mm:ss");
console.log(aa)