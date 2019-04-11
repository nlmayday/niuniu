"use strict";

const configAll = {
    wd_nn:[{
        title:"玩法",
        content: {
            wanfa:[{
                title: "看牌抢庄",
                value: 1,
                default: 1,
            },{
                title: "轮庄模式",
                value: 2,
            }],
        }
    },{
        title:"局数",
        content:{
            maxGames: [{
                title:"10局",
                value : 10,
            },{
                title:"不夜场",
                value : -1,
            }]
        }
    },{
        title:"人数",
        content:{
            roomNum: [{
                title:"6人",
                value : 6,
            }]
        }
    },{
        title:"私密",
        content:{
            simi: [{
                title:"",
                value : 1,
            }]
        }
    },{
        title:"底分",
        content:{
            difen:[{
                title:"5",
                value : 5,
                default:1,
            },{
                title:"10",
                value : 10,
            },{
                title:"20",
                value : 20,
            },{
                title:"30",
                value : 30,
            },{
                title:"50",
                value : 50,
            },{
                title:"100",
                value : 100,
            },{
                title:"200",
                value : 200,
            },{
                title:"300",
                value : 300,
            },{
                title:"500",
                value : 500,
            }]
        }
    }],
}

exports.parse = function (conf) {
    var parse = JSON.parse(conf);
    var type = parse.type;
    var config = configAll[type];
    var config_parse = {};
    for(var i=0;i<config.length;i++){
        var content = config[i].content;
        for(var k in content){
            if(!parse[k])continue;
            if((parse[k]>=1 && parse[k]-1<content[k].length) == false)
                return null;
            config_parse[k] = content[k][parse[k]-1].value;
            console.log(k,parse[k],config_parse[k]);
        }
    }
    if(!config_parse.hasOwnProperty("maxGames")){
        return null;
    }
    if(!config_parse.hasOwnProperty("roomNum")){
        return null;
    }
    config_parse.type = type;
    //config_parse.laizi = [];
    //config_parse.roomName = parse.roomName;

    if(type == "wd_nn"){
        var condition = 1;
        if(parse.condition == 2)condition = 2;
        config_parse.condition = config_parse.difen * condition * 100;
    }
    else if(type == "mj"){
        config_parse.cost = 1;
    }

    return config_parse;
}

exports.getConfig = function (type) {
    return configAll[type];
}