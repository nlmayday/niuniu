'use strict';

var http = require('http');
var https = require('https');
var URL = require('url');
var qs = require('querystring');
var fs = require('fs');
var path = require('path');
var crypto = require('./crypto');

var serverDir = path.resolve(__dirname, '..');
var errcodeAll;
function readErrcode(){
    fs.readFile(serverDir + '/common/errcode.json', function(err, data) {
        if (err) throw err;
        errcodeAll = data;
    });
}
exports.readErrcode = readErrcode;
readErrcode();

exports.get = function (url,data,callback,safe) {
    var content = qs.stringify(data);
    var url2 = url + '?' + content;
    var proto = http;
    if(safe){
        proto = https;
    }
    console.log(url2);
    proto.get(url2, function(res) {
        //console.log('STATUS: ' + res.statusCode);
        //console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        if(safe){
            res.on('data', function (data) {
                const json = JSON.parse(data);
                callback(true,json);
            });
        }
        else{
            let rawData = '';
            res.on('data', function(chunk) { rawData += chunk; });
            res.on('end', function() {
                try {
                    const parsedData = JSON.parse(rawData);
                    callback(true,parsedData);
                } catch (e) {
                    console.error(e.message);
                    callback(false,e);
                }
            });
        }
    }).on('error', function(e) {
        console.error(e.message);
        callback(false,e);
    });
}

exports.post = function (url,data,callback,safe) {
    let address = URL.parse(url);
    const postData = qs.stringify(data);
    const options = {
        hostname: address.host,
        port: address.port,
        path: address.path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    http.request(options, (res) => {
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => {
            rawData += chunk;
        });
        res.on('end', () => {
            try {
                callback(true,rawData);
            } catch (e) {
                console.error(e.message);
                callback(false,e);
            }
        });
    }).on('error', (e) => {
        console.error(e.message);
        callback(false,e);
    });

// 写入数据到请求主体
    req.write(postData);
    req.end();
}


exports.send = function(res,errcode,data){
    if(data == null){
        data = {};
    }
    if(errcode != 0){
        data = {};
        data.errcode = errcode;
    }
    //var jsonstr = crypto.cipher(JSON.stringify(data));
    //res.send(jsonstr);
    //console.log(data);
    res.send(JSON.stringify(data));
};

// 错误时发送错误描述（默认前端自己保存）
exports.send2 = function(res,errcode,data){
    if(data == null){
        data = {};
    }
    if(errcode != 0){
        data = {};
        data.errcode = errcode;
        data.errmsg = errcodeAll[errcode];
    }
    var jsonstr = crypto.cipher(JSON.stringify(data));
    res.send(jsonstr);
};
