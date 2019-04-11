var env = "product";          // local  debug   product
//var game = "ncnn"
//var game = "wcnn"
//var game = "jnnn"
var game = "renheniuniu";
var name = "人和牛牛";
//var game = "dann"
//var game = "qmnn"
//var name = "全民豆牛";
//var game = "csnn"
//

var local = function(){
    return {
        url : "47.104.255.159:7001",
        hotUrl : "",
        hotUpdate : false,
        name : name,
        title : game,
        level : 1
    }
}

var debug = function(){
    return {
        url : "127.0.0.1:7001",
        hotUrl : "",
        hotUpdate : false,
        name : name,
        title : game,
        level : 5
    }
}

var product = function(){
    return {
        url : "47.104.255.159:7001",
        hotUrl : "",
        hotUpdate : true,
        name : name,
        title : game,
        level : 8
    }
}


if(env === "local"){
    module.exports = local();
}
else if(env === "debug"){
    module.exports = debug();
}
else{
    module.exports = product();
}