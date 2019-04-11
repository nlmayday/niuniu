var crypto = require('crypto');

var secret = "ljjyxwh";

function hmac(content) {
    const md5 = crypto.createHmac('md5', secret);
    md5.update(content);
    return md5.digest('base64');
}

console.log(hmac("内测版"))
console.log(hmac("外测版"))
console.log(hmac("江南豆牛"))
console.log(hmac("咸宁豆牛"))
console.log(hmac("德安豆牛"))
console.log(hmac("全民豆牛"))
console.log(hmac("财神豆牛"))

console.log(hmac("顶好豆牛"))
console.log(hmac("修水豆牛"))
console.log(hmac("南昌八一豆牛"))
console.log(hmac("萍乡豆牛"))
console.log(hmac("黄梅豆牛"))
console.log(hmac("乐安豆牛"))
console.log(hmac("乐平欢乐豆牛"))
console.log(hmac("天天豆牛"))

console.log(hmac("有点牛"))
console.log(hmac("斗牛哥"))