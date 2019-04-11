'use strict';

var crypto = require('crypto');

var secret = "ljjyxwh";

exports.hash = function (content) {
    const md5 = crypto.createHash('md5');
	md5.update(content);
	return md5.digest('hex');
}
exports.hmac = function (content) {
    const md5 = crypto.createHmac('md5', secret);
    md5.update(content);
    return md5.digest('hex');
}
exports.cipher = function(content){
    const cipher = crypto.createCipher('aes-256-ecb', secret);//aes-256-ecb
    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}
exports.decipher = function(content){
    const decipher = crypto.createDecipher('aes-256-ecb', secret);
    let decrypted = decipher.update(content , 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
exports.toBase64 = function(content){
	return new Buffer(content).toString('base64');
}

exports.fromBase64 = function(content){
	return new Buffer(content, 'base64').toString();
}
