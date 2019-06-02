'use strict';

const express = require('express');
//const fs = require('fs');
var path = require('path');
const http = require('../utils/http');
const logger = require('../utils/logger');
const crypto = require('../utils/crypto');
const db = require('../utils/db');
const config = require('../common/config');

const app = express();
app.listen(8001);
//设置跨域访问
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

var token_verify_config = {};
var config_servers = {};

var servers = config.servers;
var center_login = servers.center_login;
var sers = center_login.servers;
for(let i=0;i<sers.length;i++){
    let key = sers[i].index;
    let token = sers[i].token;
    token_verify_config[key] = token;
}
var login_hall = servers.login_hall;
config_servers = login_hall.servers;


function token_verify(key,token) {
    if(token_verify_config[key] === token){
        return true;
    }
    return false;
}
//wx0daaacc46ab6f676
//9f473957fbdb8fca65f3149f1dc9058a
var wxInfo = {
    Android:{
        appid:"wx8175d6c2f5f15652",
        secret:"ab93a808ec68d86d384e946c2fd56e12",
    },
    iOS:{
        appid:"wx8175d6c2f5f15652",
        secret:"ab93a808ec68d86d384e946c2fd56e12",
    }
};

function get_access_token(code,os,callback){
    var info = wxInfo[os];
    if(info == null){
        callback(false,null);
    }
    var data = {
        appid:info.appid,
        secret:info.secret,
        code:code,
        grant_type:"authorization_code"
    };
    http.get("https://api.weixin.qq.com/sns/oauth2/access_token",data,callback,true);
}
var create_coins = 10000;
var create_gems = 10000;
var create_roomCard = 10000;
function create_user(info,callback){
    db.is_user_exist(info.account,function(ret){
        if(!ret){
            info.coins = create_coins;
            info.gems = create_gems;
            info.roomCard = create_roomCard;
            db.create_user(info,function(ret){
                callback(ret);
            });
        }
        else{
            delete info.area;
            db.update_user_info(info,function(ret){
                callback(ret);
            });
        }
    });
};
function get_state_info(access_token,openid,callback){
    var data = {
        access_token:access_token,
        openid:openid
    };
    http.get("https://api.weixin.qq.com/sns/userinfo",data,callback,true);
}


app.get('/guest',function(req,res){
    var errcode = 0;
    var account = "guest_" + req.query.account;
    var sign = crypto.hmac(account + req.ip);
    var area = req.query.area;
    var data = {
        account:account,
        sign:sign
    }
    create_user({account:account,area:area},function(ret){
        if(!ret){
            errcode = 205;
        }
        http.send(res,errcode,data);
    });
});
app.get('/auth',function(req,res){
    var account = req.query.account;
    var password = req.query.password;
    let index = req.query.index;
    let token = req.query.token;
    let errcode = 0;
    let data = {};
    if(token_verify(index,token) === false){
        errcode = 203;
        http.send(res,errcode);
        return;
    }
    db.is_user_exist(account,function(ret){
        if(!ret){
            errcode = 204;
            http.send(res,errcode);
            return;
        }
        let number = config_servers.length || 0;
        let index2 = Math.floor(Math.random() * number);
        data.server = config_servers[index2];

        db.get_userInfo2(account,password,function(info){
            if(info == null){
                errcode = 206;
                http.send(res,errcode);
                return;
            }
            if(info.isBlack == 1){
                errcode = 207;
                http.send(res,errcode);
                return;
            }
            data.account = info.account;
            data.userId = info.userId;
            data.userName = info.userName;
            data.sex = info.sex;
            data.headImg = info.headImg;
            data.lv = info.lv;
            data.exp = info.exp;
            data.gems = info.gems;
            data.coins = info.coins;
            data.roomCard = info.roomCard;
            data.ip = info.ip;
            data.address = info.address;
            data.oldRoomId = info.oldRoomId;
            data.records = info.records;

            data.unionId = info.unionId;
            http.send(res,errcode,data);
        });
    });
});
app.get('/wechat_auth',function(req,res){
    var code = req.query.code;
    var os = req.query.os;
    var errcode = 0;
    if(code == null || code == "" || os == null || os == ""){
        errcode = 201;
        http.send(res,errcode);
        return;
    }
    var area = req.query.area;
    get_access_token(code,os,function(suc,data){
        if(suc && data.access_token && data.openid){
            var access_token = data.access_token;
            var openid = data.openid;
            get_state_info(access_token,openid,function(suc2,data2){
                if(suc2){
                    var openid = data2.openid;
                    var nickname = data2.nickname;
                    var sex = data2.sex;
                    var headimgurl = data2.headimgurl;
                    var account = "wx_" + openid;
                    create_user({account:account,userName:nickname,sex:sex,headImg:headimgurl,area:area},function(ret){
                        if(!ret){
                            errcode = 205;
                            http.send(res,errcode);
                            return;
                        }
                        var sign = crypto.hmac(account + req.ip);
                        var data = {
                            account:account,
                            sign:sign
                        };
                        http.send(res,errcode,data);
                    });
                }
            });
        }
        else{
            errcode = 202;
            http.send(res,errcode);
        }
    });
});
app.get('/login',function(req,res){
    let query = req.query;
    let index = query.index;
    let token = query.token;
    let account =  query.account;
    let sign = query.sign;
    let errcode = 0;

    if(token_verify(index,token) === false){
        errcode = 203;
        http.send(res,errcode);
    }
    else{
        var data={};
        data.server = config_servers;

        db.get_userInfo(account,function(info){
            if(info == null){
                errcode = 204;
                http.send(res,errcode);
                return;
            }
            if(info.isBlack == 1){
                errcode = 207;
                http.send(res,errcode);
                return;
            }
            data.account = info.account;
            data.userId = info.userId;
            if(info.userName)data.userName = crypto.toBase64(info.userName);
            data.sex = info.sex;
            data.headImg = info.headImg;
            data.lv = info.lv;
            data.exp = info.exp;
            data.gems = info.gems;
            data.coins = info.coins;
            data.roomCard = info.roomCard;
            data.ip = info.ip;
            data.address = info.address;
            data.oldRoomId = info.oldRoomId;
            data.records = info.records;

            data.area = info.area;
            data.unionId = info.unionId;

            http.send(res,errcode,data);
        });
    }
});
process.on('uncaughtException', function ( err ) {
    console.log("loginServer " + ' Caught exception: ' + err.stack);
    logger.error_log("loginServer " + ' process.pid: ' + process.pid + ' Caught exception: ' + err.stack );
});
