'use strict';

var db = require("./db");
var utils = require("./utils");
var query = db.query;

exports.get_agecyInfo = function(account,password,callback){
    if(account == null || password == null){
        if(callback)callback(null);
        return;
    }
    var sql = 'SELECT * FROM s_agecy WHERE account="' + account + '" and password="' + password + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        if (rows.length == 0) {
            if(callback)callback(null);
            return;
        }
        if(callback)callback(rows[0]);
    });
};

exports.get_notice = function(area,callback){
    var sql = 'SELECT * FROM t_notify WHERE type="' + area + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        if(callback && rows)callback(rows);
    });
}
exports.change_notify = function(area,msg,callback){
    var date = Date.now();
    var sql = 'UPDATE t_notify SET msg="' + msg + '",time="'+ date + '" WHERE type="' + area + '"';
    console.log(sql)
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        if(callback)callback(true);
    });
}

exports.get_unionInfo = function(area,unionId,callback) {
    var sql = 'SELECT * FROM t_union_list WHERE unionId="' + unionId + '" and area="' + area + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        if(rows.length == 0){
            if(callback)callback(1);
        }
        else {
            if(callback)callback(0,rows[0]);
        }
    });
};
exports.add_coins_union = function(account,area,unionId,num,callback) {
    var sql = 'UPDATE t_union_list SET coins=coins+"'+ num + '" WHERE unionId="' + unionId + '" and area="' + area + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        var sql2 = 'SELECT coins FROM t_union_list WHERE unionId="' + unionId + '" and area="' + area + '"';
        query(sql2, function(err, rows, fields) {
            if (err) {
                throw err;
                return;
            }
            if(callback)callback(rows[0]);
        });
        var time = Date.now();
        var sql3 = insertSQL("s_agecy_records",{account:account,area:area,unionId:unionId,type:1,coins:num,time:time});
        query(sql3, function(err, rows, fields) {
            if (err) {
                throw err;
                return;
            }
        });
    });
};
exports.minus_coins_union = function(account,area,unionId,num,callback) {
    var sql = 'UPDATE t_union_list SET coins=coins-"'+ num + '" WHERE unionId="' + unionId + '" and area="' + area + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        var sql2 = 'SELECT coins FROM t_union_list WHERE unionId="' + unionId + '" and area="' + area + '"';
        query(sql2, function(err, rows, fields) {
            if (err) {
                throw err;
                return;
            }
            if(callback)callback(rows[0]);
        });
        var time = Date.now();
        var sql3 = insertSQL("s_agecy_records",{account:account,area:area,unionId:unionId,type:2,coins:num,time:time});
        query(sql3, function(err, rows, fields) {
            if (err) {
                throw err;
                return;
            }
        });
    });
};

exports.get_union_by_id = function(area,unionId,callback) {
    var sql1 = 'SELECT * FROM t_union_list WHERE unionId="' + unionId + '" and area="' + area + '"';
    query(sql1, function(err, rows, fields) {
        if (err) {
            throw err;
            return;
        }
        if(callback)callback(rows[0]);
    });
};
exports.get_union_all = function(area,start,rows,callback) {
    var sql1 = 'SELECT * FROM t_union_list WHERE area="' + area + '" order by id desc LIMIT ' + start + ',' + rows;
    query(sql1, function(err, rows, fields) {
        if (err) {
            throw err;
            return;
        }
        if(callback)callback(rows);
    });
};
exports.union_score_detail = function(area,unionId,callback) {
    var sql1 = 'SELECT * FROM s_union_score_detail WHERE userId="' + unionId + '" and area="' + area + '"';
    query(sql1, function(err, rows, fields) {
        if (err) {
            throw err;
            return;
        }
        if(callback)callback(rows[0]);
    });
};
exports.rateChange = function(area,unionId,rate,callback) {
    var rate1 = rate;
    var rate2 = 100 - rate;
    var sql1 = 'UPDATE s_union_score_detail SET taxRate1=' + rate1 + ',taxRate2=' + rate2 + ' WHERE userId="' + unionId + '" and area="' + area + '"';
    query(sql1, function(err, rows, fields) {
        if (err) {
            throw err;
            return;
        }
        if(callback)callback(true);
    });
};

exports.get_applyList_by_id = function(area,userId,callback) {
    var sql1 = 'SELECT * FROM s_union_apply_list WHERE userId="' + userId + '" and area="' + area + '"';
    query(sql1, function(err, rows, fields) {
        if (err) {
            throw err;
            return;
        }
        if(callback)callback(rows[0]);
    });
};
exports.get_applyList_all = function(area,start,rows,callback) {
    var sql1 = 'SELECT * FROM s_union_apply_list WHERE area="' + area + '" order by id desc LIMIT ' + start + ',' + rows;
    query(sql1, function(err, rows, fields) {
        if (err) {
            throw err;
            return;
        }
        if(callback)callback(rows);
    });
};
exports.applyList_operate = function(area,userId,operate,callback) {
    var sql1 = 'SELECT * FROM s_union_apply_list WHERE area="' + area + '" and userId="' + userId + '"';
    query(sql1, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        if(rows.length == 0){
            if(callback)callback(1);
            return;
        }
        if(operate == 1){
            create_union(userId,area,rows[0].unionName,callback);
        }
        var sql2 = 'DELETE FROM s_union_apply_list WHERE area="' + area + '" and userId="' + userId + '"';
        query(sql2, function(err, rows2, fields) {
            if (err) {
                throw err;
            }
            if(callback)callback(0);
        });
    });
};
function create_union (userId,area,name,callback) {
    var sql = 'SELECT * FROM t_union_user WHERE area="' + area + '" and userId="' + userId + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        if(rows.length == 0){
            var unionId = userId;
            var createTime = utils.dateFormat("yyyy-MM-dd hh:mm:ss");
            var uuid = Date.now();
            var creator = userId;
            var manager = "[" + userId + "]";
            var member = "[" + userId + "]";

            var data = {uuid:uuid,unionId:unionId,area:area,name:name,createTime:createTime,coins:0,creator:creator,manager:manager,member:member};
            var sql2 = insertSQL("t_union_list",data);
            query(sql2, function(err, rows, fields) {
                if (err) {
                    throw err;
                }
                if(callback){
                    callback(0,data);
                }
            });
            var data2 = {area:area,userId:userId,unionId:unionId};
            var sql3 = insertSQL("t_union_user",data2);
            query(sql3, function(err, rows, fields) {
                if (err) {
                    throw err;
                }
            });
            var data3 = {area:area,unionId:unionId};
            var sql4 = insertSQL("s_union_score_detail",data3);
            query(sql4, function(err, rows, fields) {
                if (err) {
                    throw err;
                }
            });
        }
        else{
            if(callback){
                callback(2);
                return;
            }
        }
    });
}

function insertSQL( tablename, data ) {
    var tname = [];
    var tval = [];
    for( var key in data ) {
        tname.push( key );
        tval.push( "'" + data[key] + "'" );
    }
    return 'INSERT INTO ' + tablename + ' (' + tname.join( ',' ) + ') VALUES (' + tval.join( ',' ) + ')';
}

function updateSQL( tablename, data, where )
{
    var setdata = [];
    for( var key in data ) {
        setdata.push( key + "='" + data[ key ] + "'" );
    }
    return 'UPDATE ' + tablename + ' SET ' + setdata.join(',') + ' WHERE ' + where + ';';
}