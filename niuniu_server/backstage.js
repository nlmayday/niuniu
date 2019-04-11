'use strict';

const express = require('express');
var path = require('path');
const http = require('./utils/http');
const db = require('./utils/dbStage');

const app = express();
app.listen(7010);
//设置跨域访问
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});
var serverDir = path.resolve(__dirname, '..');
console.log(serverDir);

app.get('/auth',function(req,res){
    var account = req.query.account;
    var password = req.query.password;
    let errcode = 0;

    db.get_agecyInfo(account,password,function(ret){
        if(ret == null){
            errcode = 1;
            http.send(res,errcode);
            return;
        }
        let data = {};
        data.id = ret.id;
        data.account = ret.account;
        data.area = ret.area;
        data.name = ret.name;
        data.level = ret.level;

        http.send(res,errcode,data);
    });
});

app.get('/get_notice',function(req,res){
    var area = req.query.area;
    db.get_notice(area,function(ret){
        let data = ret;
        http.send(res,0,data);
    });
});

app.get('/change_notify',function(req,res){
    var area = req.query.area;
    var notify = req.query.notify;
    db.change_notify(area,notify,function(){
        http.send(res,0);
    });
});
app.get('/get_unionInfo',function(req,res){
    var area = req.query.area;
    var unionId = req.query.unionId;
    db.get_unionInfo(area,unionId,function(code,ret){
        http.send(res,code,ret);
    });
});

app.get('/add_coins_union',function(req,res){
    var account = req.query.account;
    var area = req.query.area;
    var unionId = req.query.unionId;
    var num = req.query.num;
    num = parseInt(num);
    if(num > 0 == false)return;
    db.add_coins_union(account,area,unionId,num,function(ret){
        http.send(res,0,ret.coins);
    });
});
app.get('/minus_coins_union',function(req,res){
    var account = req.query.account;
    var area = req.query.area;
    var unionId = req.query.unionId;
    var num = req.query.num;
    num = parseInt(num);
    if(num > 0 == false)return;
    db.minus_coins_union(account,area,unionId,num,function(ret){
        http.send(res,0,ret.coins);
    });
});
app.get('/get_union_by_id',function(req,res){
    var area = req.query.area;
    var unionId = req.query.unionId;
    db.get_union_by_id(area,unionId,function(ret){
        var errcode = 0;
        if(ret == null){
            errcode = 1;
        }
        http.send(res,errcode,ret);
    });
});
app.get('/get_union_all',function(req,res){
    var area = req.query.area;
    var start = req.query.start;
    var rows = req.query.rows;
    start = parseInt(start);
    if(start >= 0 == false)return;
    rows = parseInt(rows);
    if(rows > 0 == false)return;
    db.get_union_all(area,start,rows,function(ret){
        http.send(res,0,ret);
    });
});
app.get('/union_score_detail',function(req,res){
    var area = req.query.area;
    var unionId = req.query.unionId;
    db.union_score_detail(area,unionId,function(ret){
        if(ret){
            http.send(res,0,ret);
        }
    });
});
app.get('/rateChange',function(req,res){
    var area = req.query.area;
    var unionId = req.query.unionId;
    var rate = req.query.rate;
    if(rate >= 0 && rate <= 100){
        db.rateChange(area,unionId,rate,function(ret){
            if(ret){
                http.send(res,0,ret);
            }
        });
    }
});
app.get('/get_applyList_by_id',function(req,res){
    var area = req.query.area;
    var userId = req.query.userId;
    db.get_applyList_by_id(area,userId,function(ret){
        var errcode = 0;
        if(ret == null){
            errcode = 1;
        }
        http.send(res,errcode,ret);
    });
});
app.get('/get_applyList_all',function(req,res){
    var area = req.query.area;
    var start = req.query.start;
    var rows = req.query.rows;
    start = parseInt(start);
    if(start >= 0 == false)return;
    rows = parseInt(rows);
    if(rows > 0 == false)return;
    db.get_applyList_all(area,start,rows,function(ret){
        http.send(res,0,ret);
    });
});
app.get('/applyList_operate',function(req,res){
    var area = req.query.area;
    var userId = req.query.userId;
    var operate = req.query.operate;
    db.applyList_operate(area,userId,operate,function(code){
        if(code == 0){
            http.send(res,0,{});
        }
        else{
            http.send(res,code,{});
        }
    });
});



process.on('uncaughtException', function ( err ) {
    console.log("loginServer " + ' Caught exception: ' + err.stack);

});
