'use strict';

const express = require('express');
//const fs = require('fs');
var path = require('path');
const http = require('../utils/http');
const config = require('../common/config');

const app = express();
app.listen(7001);
//设置跨域访问
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

var config_version = {};
var config_servers = {};
var servers = config.servers;
var data = servers.center_login;
config_version.hotUpdate = data.hotUpdate;
config_version.version = data.version;
config_servers.servers = data.servers;
config_servers.recommend = data.recommend;

app.get('/get_version',function(req,res){
    if(config_version.hotUpdate == null)return;
    let query = req.query;
    let ver = query.version;
    let ret = {};
    ret.hotUpdate = config_version.hotUpdate[ver];
    ret.version = config_version.version;
    http.send(res,0,ret);
});
app.get('/get_servers',function(req,res) {
    if(config_servers.servers == null)return;
    let query = req.query;
    let max_servers = parseInt(query.max_servers);
    let errcode = 0;
    let data = {};
    max_servers = max_servers ? max_servers : 0;
    if(max_servers <= config_servers.servers.length) {
        let servers = [];
        for (let i = max_servers; i < config_servers.servers.length; i++) {
            let server = config_servers.servers[i];
            servers.push({index:server.index,desc:server.desc,name:server.name});
        }
        data.servers = servers;
        data.recommend = config_servers.recommend;
    }
    else{
        errcode = 101;
    }
    http.send(res,errcode,data);

});
app.get('/get_address',function(req,res){
    if(config_servers.servers == null)return;
    let query = req.query;
    let index = parseInt(query.index);
    let errcode = 0;
    let data = {};
    if(isNaN(index)){
        errcode = 102;
    }
    else{
        let info = config_servers.servers[index-1];
        if(info){
            data.index = info.index;
            data.url = info.url;
            data.token = info.token;
        }
    }
    http.send(res,errcode,data);
});

process.on('uncaughtException', function ( err ) {
    console.log("centerServer " + ' Caught exception: ' + err.stack);
});
