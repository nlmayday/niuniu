
var level = 0;

function setLevel(l){
    level = l;
}

function log(l){
    if(typeof l === "number" && l >= level){
        var str = "";
        for(var i = 1;i < arguments.length;i++){
            str += arguments[i];
        }
        console.log(str);
    }
}

module.exports = {
    setLevel : setLevel,
    log : log
}