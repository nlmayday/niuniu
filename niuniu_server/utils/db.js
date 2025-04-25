'use strict';

var mysql = require("mysql2");
var utils = require("./utils");

var pool = null;
function init(){
    pool = mysql.createPool({
        host: "127.0.0.1",
        user: "root",
        password: "Aa123456",
        database: "qp",
        port: 3306,
        connectionLimit: 100
    });
}
init();

function query(sql,callback){
    pool.getConnection(function(err,conn){
        if(err){
            callback(err,null,null);
        }else{
            conn.query(sql,function(qerr,vals,fields){
                //释放连接
                conn.release();
                //事件驱动回调
                callback(qerr,vals,fields);
            });
        }
    });
}
exports.query = query;

exports.get_notify = function(callback){
    var sql = 'SELECT type,msg FROM t_notify';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        if(callback)callback(rows);
    });
}

exports.is_user_exist = function(account,callback){
    if(account == null){
        if(callback)callback(false);
        return;
    }

    var sql = 'SELECT userId FROM t_userinfo WHERE account="' + account + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        if(rows.length == 0){
            if(callback)callback(false);
            return;
        }
        if(callback)callback(true);
    });
}

var user_index = 10000;
var sql = 'SELECT userId FROM t_userinfo order by id desc LIMIT 1';
query(sql, function(err, rows, fields) {
    if (err) {
        throw err;
        return;
    }
    if (rows[0]) {
        var lastUserId = rows[0].userId;
        user_index = parseInt(lastUserId);
        console.log("user_index",user_index);
    }
})

function create_userId(){
    user_index = user_index + Math.ceil(10 * Math.random());
    return user_index;
}

exports.create_user = function(data,callback){
    if(data.account == null){
        if(callback)callback(false);
        return;
    }
    data.userId = create_userId();
    if(data.userName == null){
        data.userName = data.account;
    }
    data.createTime = Date.now();
    var sql = insertSQL("t_userinfo",data);
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        if(callback)callback(true);
    });
};

exports.update_user_info = function(data,callback){
    if(data == null){
        if(callback)callback(false);
        return;
    }
    var where = "";
    if(data.account){
        where = 'account="' + data.account +  '"';
    }
    else if(data.userId){
        where = 'userId="' + data.userId +  '"';
    }
    var sql = updateSQL("t_userinfo",data,where);
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        if(callback)callback(true);
    });
};

exports.get_userInfo2 = function(account,password,callback){
    if(account == null){
        if(callback)callback(null);
        return;
    }
    var sql = 'SELECT t_userinfo.*,t_union_user.unionId FROM t_userinfo left outer join  t_union_user on t_userinfo.userId=t_union_user.userId WHERE account="' + account + '" and sign="' + password + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        if (rows.length == 0) {
            if(callback)callback(null);
            return;
        }
        if(callback)callback(rows[0]);

        var time = Date.now();
        var sql2 = "UPDATE t_userinfo SET lastLogin='"+ time + "' WHERE account='" + account + '" and sign="' + password + '"';
        query(sql2, function(err, rows, fields) {
            if (err) {
                throw err;
            }
        });
    });
};

exports.get_userInfo = function(account,callback){
    if(account == null){
        if(callback)callback(null);
        return;
    }
    var sql = 'SELECT t_userinfo.*,t_union_user.unionId FROM t_userinfo left outer join  t_union_user on t_userinfo.userId=t_union_user.userId WHERE t_userinfo.account="' + account + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        if (rows.length == 0) {
            if(callback)callback(null);
            return;
        }
        if(callback)callback(rows[0]);

        var time = Date.now();
        var sql2 = "UPDATE t_userinfo SET lastLogin='"+ time + "' WHERE account='" + account + "'";
        query(sql2, function(err, rows, fields) {
            if (err) {
                throw err;
            }
        });
    });
};

exports.get_user_base_info = function(userId,callback){
    if(userId == null){
        if(callback)callback(null);
        return;
    }
    var sql = 'SELECT userName,sex,headImg,coins,roomCard FROM t_userinfo WHERE userId="' + userId + '"';
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

exports.create_room = function(roomInfo,callback){
    if(roomInfo == null){
        if(callback)callback(false);
        return;
    }
    var sql = insertSQL("t_room_play",{roomId:roomInfo.roomId,type:roomInfo.type,owner:roomInfo.owner,numOfGames:roomInfo.numOfGames,
        createTime:roomInfo.createTime,config:JSON.stringify(roomInfo.conf),url:roomInfo.url});
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }
        if(callback)callback(true);
    });
};

exports.update_seat_info = function(roomId,index,userId,name,score){
    if(roomId == null){
        return;
    }
    var where = 'roomId="' + roomId +  '"';
    var data = {};
    if(userId != null)data["user_id"+ index] = userId;
    if(name != null)data["user_name"+ index] = name;
    if(score != null)data["user_score"+ index] = score;
    var sql = updateSQL("t_room_play",data,where);

    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
    });
};

exports.delete_room = function(roomId){
    if(roomId == null){
        return;
    }
    var sql = 'DELETE FROM t_room_play WHERE roomId="' + roomId +  '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
    });
};

//存储房间总记录 ，并删除t_room_play记录
exports.store_history = function(history){
    if(history == null){
        return;
    }
    var uuid = history.time + history.roomId;
    var numOfGames = "" + history.index + "/" + history.conf.maxGames;
    var data = {uuid:uuid,roomId:history.roomId,type:history.type,numOfGames:numOfGames,owner:history.owner,time:history.time,
        config:JSON.stringify(history.conf), url:history.url};
    for(var i=0;i<history.seats.length;i++){
        if(history.seats[i] == null)continue;
        data["userId" + i] = history.seats[i].userId;
        data["name" + i] = history.seats[i].name;
        data["score" + i] = history.seats[i].score;
    }
    var sql = insertSQL("t_room_history",data);
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
    });
    for(var i=0;i<history.seats.length;i++) {
        if(history.seats[i] == null)continue;
        var userId = history.seats[i].userId;
        if(userId == 0)continue;
        var sql = 'SELECT records FROM t_userinfo WHERE userId="' + userId + '"';
        query(sql, function(err, rows, fields) {
            if (err) {
                throw err;
            }
            var ret = rows[0].records;
            if(ret == null)ret = "[]";
            var records = JSON.parse(ret);
            var records2 = [uuid];
            for(var i=0;i<records.length;i++){
                if(records2.length >= 20)break;
                records2.push(records[i]);
            }
            var sql2 = "UPDATE t_userinfo SET records='"+ JSON.stringify(records2)+ "' WHERE userId='" + userId + "'";
            query(sql2, function(err, rows, fields) {
                if (err) {
                    throw err;
                }
            });
        },userId);
    }
};

exports.update_numOfGames = function(roomId,numOfGames){
    var where = 'roomId = "' + roomId +  '"';
    var data = {};
    data.numOfGames = numOfGames;
    var sql = updateSQL("t_room_play",data,where);
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
    });
};

exports.insert_game_records = function(roomId,type,createTime,numOfGames,userArr,scoreArr,actionList){
    var uuid = createTime + roomId;
    var userArr1 = JSON.stringify(userArr);
    var scoreArr1 = JSON.stringify(scoreArr);
    var actionList1 = JSON.stringify(actionList);
    var sql = insertSQL("t_game_records",{uuid:uuid,roomId:roomId,type:type,numOfGames:numOfGames,userArr:userArr1,scoreArr:scoreArr1,actionList:actionList1});
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
    });
};

exports.cost_gems = function(users,cost){
    for(var i=0;i<users.length;i++){
        var sql = 'UPDATE t_userinfo SET gems=gems-' + cost + ' WHERE userId="' + users[i] + '"';
        query(sql, function(err, rows, fields) {
            if (err) {
                throw err;
            }
        });
    }
};

exports.cost_coins = function(userId,rs,coins,callback){
    var area = rs.area;
    var sql = 'UPDATE t_userinfo SET coins=coins-' + coins + ' WHERE userId="' + userId + '" and area="' + area + '"';
    query(sql, function (err, rows, fields) {
        if (err) {
            throw err;
        }
        var sql = 'SELECT coins FROM t_userinfo WHERE userId="' + userId + '" and area="' + area + '"';
        query(sql, function (err, rows2, fields) {
            if (err) {
                throw err;
            }
            if(rows2.length == 0){
                if(callback)callback({});
                return;
            }
            if(callback)callback({userId:userId,coins:rows2[0].coins,cost:coins});
        });
    });
};

exports.rate_coins2 = function(userId,area,cost) {
        var sql2 = 'SELECT unionId FROM t_union_user WHERE userId="' + userId + '" and area="' + area + '"';
        query(sql2, function (err, rows, fields) {
            if (err) {
                throw err;
            }
            if(rows.length == 0)return;

            var unionId = rows[0].unionId;
            var sql3 = 'SELECT * FROM s_union_score_detail WHERE area="' + area + '" and userId="' + unionId + '"';
            query(sql3, function (err, rows, fields) {
                if (err) {
                    throw err;
                }
                if(rows.length == 0)return;
                var taxRate1 = rows[0].taxRate1;
                var taxRate2 = rows[0].taxRate2;
                if(taxRate2 != 100 - taxRate1)return;
                var totalTax1 = Math.round(cost*taxRate1/100);
                var totalTax2 = cost - totalTax1;

                var sql4 = 'UPDATE s_union_score_detail SET totalTax1=totalTax1+' + totalTax1 + ',totalTax2=totalTax2+' + totalTax2 + ' WHERE area="' + area + '" and userId="' + unionId + '"';
                query(sql4, function (err, rows, fields) {
                    if (err) {
                        throw err;
                    }
                });

                var sql5 = 'SELECT userName FROM t_userinfo WHERE userId="' + userId + '" and area="' + area + '"';
                query(sql5, function(err, rows, fields) {
                    if (err) {
                        throw err;
                        return;
                    }
                    var name = rows[0].userName;
                    var time = Date.now();
                    var sql6 = insertSQL("s_agecy_tax",{area:area,userId:userId,name:name,coins:cost,tax1:totalTax1,tax2:totalTax2,time:time});
                    query(sql6, function (err, rows, fields) {
                        if (err) {
                            throw err;
                        }
                    });
                });
            });
        });

}

exports.rate_coins = function(data,callback){
    var sql1 = 'SELECT rate FROM s_agecy limit 1';
    query(sql1, function (err, rows, fields) {
        if (err) {
            throw err;
        }
        var rate = rows[0] != null?rows[0].rate:0;

        var userId = data.userId;
        var area = data.area;
        var score = data.score;

        var costScore = -score;
        if(score > 0){
            var cost = Math.round(score * rate / 100);
            if (cost >= 2) {
                exports.rate_coins2(userId,area,cost);
                costScore += cost;
            }
        }
        exports.cost_coins( userId,{area:area},costScore,callback);
    });
};

exports.save_money  = function(userId,area,coins,callback){
    var sql = 'UPDATE t_userinfo SET coins=coins-' + coins + ',roomCard=roomCard+' + coins + ' WHERE userId="' + userId + '" and area="' + area + '"';
    query(sql, function (err, rows, fields) {
        if (err) {
            //throw err;
            return;
        }
        var sql = 'SELECT coins,roomCard FROM t_userinfo WHERE userId="' + userId + '" and area="' + area + '"';
        query(sql, function (err, rows, fields) {
            if (err) {
                throw err;
                return;
            }
            if(callback)callback({coins:rows[0].coins,roomCard:rows[0].roomCard});
        });
    });
}

exports.takeOut_money  = function(userId,area,coins,callback){
    var sql = 'UPDATE t_userinfo SET coins=coins+' + coins + ',roomCard=roomCard-' + coins + ' WHERE userId="' + userId + '" and area="' + area + '"';
    query(sql, function (err, rows, fields) {
        if (err) {
            //throw err;
            return;
        }
        var sql = 'SELECT coins,roomCard FROM t_userinfo WHERE userId="' + userId + '" and area="' + area + '"';
        query(sql, function (err, rows, fields) {
            if (err) {
                throw err;
            }
            if(callback)callback({coins:rows[0].coins,roomCard:rows[0].roomCard});
        });
    });
}

var sql2 = 'DELETE from t_room_play';
query(sql2, function(err, rows, fields) {
    if (err) {
        throw err;
    }
});

//公会功能
/*var union_index = 1000;
var sql = 'SELECT unionId FROM t_union_list order by id desc LIMIT 1';
query(sql, function(err, rows, fields) {
    if (err) {
        throw err;
        return;
    }
    if (rows[0]) {
        var lastUnionId = rows[0].unionId;
        union_index = parseInt(lastUnionId);
        console.log("union_index",union_index);
    }
})
function create_unionId(){
    union_index = union_index + Math.ceil(100 * Math.random());
    return union_index;
}*/

exports.create_limit = function(userId,area,limit,callback) {
    var sql = insertSQL("t_union_create_limit",{userId:userId,area:area,isLimit:limit});
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        callback();
    });
};

exports.create_union_apply = function(data,callback) {
    var sql = 'SELECT * FROM s_union_apply_list WHERE userId="' + data.userId + '" and area="' + data.area + '" and stat="0"';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        if (rows.length > 0){
            callback(1);
            return;
        }
        var sql2 = insertSQL("s_union_apply_list",data);
        query(sql2, function(err, rows, fields) {
            if (err) {
                throw err;
                return;
            }
            callback(0);
        });
    });
};

exports.get_unionInfo = function(unionId,area,callback) {
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

exports.apply_coin = function(userId,unionId,area,coins) {
    var time = Date.now();
    var sql = 'SELECT userName FROM t_userinfo WHERE userId="' + userId + '" and area="' + area + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
            return;
        }
        var userName = rows[0].userName;
        var sql = 'SELECT * FROM t_union_record WHERE unionId="' + unionId + '" and area="' + area + '" and memberId="' + userId + '" and stat="0"';
        query(sql, function(err, rows, fields) {
            if (err) {
                throw err;
                return;
            }
            if (rows.length > 2) return;
            var data = {
                unionId: unionId,
                area: area,
                memberId: userId,
                memberName: userName,
                type: 1,
                coins: coins,
                time: time
            };
            var sql2 = insertSQL("t_union_record", data);
            query(sql2, function (err, rows, fields) {
                if (err) {
                    throw err;
                }
            });
        });
    });
};

exports.join_union = function(userId,unionId,area,callback) {
    var sql1 = 'SELECT * FROM t_union_user WHERE userId="' + userId + '" and area="' + area + '"';
    query(sql1, function(err, rows2, fields) {
        if (err) {
            throw err;
        }
        if (rows2.length > 0) {
            if (callback) callback(1);
            return;
        }

        var sq4 = 'SELECT creator,manager,member FROM t_union_list WHERE unionId="' + unionId + '" and area="' + area + '"';
        query(sq4, function (err, rows, fields) {
            if (err) {
                throw err;
            }
            if (rows.length == 0) {
                if (callback) callback(2);
                return;
            }
            var member = rows[0].member;
            member = JSON.parse(member);
            member.push(userId);
            var data = {member: JSON.stringify(member)};
            var where = 'unionId="' + unionId + '" and area="' + area + '"';
            var sql5 = updateSQL("t_union_list", data, where);
            query(sql5, function (err, rows, fields) {
                if (err) {
                    throw err;
                }
            });

            var data = {area: area, userId: userId, unionId: unionId};
            var sql3 = insertSQL("t_union_user", data);
            query(sql3, function (err, rows, fields) {
                if (err) {
                    throw err;
                }
                if (callback) callback(0);
            });
        });
    });
};

exports.exit_union = function(userId,unionId,area) {
    var sql = 'SELECT creator,manager,member FROM t_union_list WHERE unionId="' + unionId + '" and area="' + area + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
            return;
        }
        if(rows.length == 0)return;
        var creator = rows[0].creator;
        var manager = rows[0].manager;
        var member = rows[0].member;
        if(userId == creator)return;
        manager = JSON.parse(manager);
        for(var i=0;i<manager.length;i++){
            if(manager[i] == userId){
                manager.splice(i,1);
                break;
            }
        }
        member = JSON.parse(member);
        for(var j=0;j<member.length;j++){
            if(member[j] == userId){
                member.splice(j,1);
                break;
            }
        }
        var data = {manager:JSON.stringify(manager),member:JSON.stringify(member)};
        var where = 'unionId="' + unionId + '" and area="' + area + '"';
        var sql1 = updateSQL("t_union_list",data,where);
        query(sql1, function(err, rows, fields) {
            if (err) {
                throw err;
                return;
            }
        });
        var sql2 = 'DELETE FROM t_union_user WHERE userId="' + userId + '" and area="' + area + '"';
        query(sql2, function(err, rows, fields) {
            if (err) {
                throw err;
                return;
            }
        });
    });
};

exports.offer_coins = function(userId,unionId,area,coins,callback) {
    var time = Date.now();
    var sql = 'SELECT userName,coins FROM t_userinfo WHERE userId="' + userId + '" and area="' + area + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
            return;
        }
        if(rows.length == 0)return;
        var userName = rows[0].userName;
        var data = {unionId:unionId,area:area,memberId:userId,memberName:userName,type:2,coins:coins,time:time,stat:1};
        var sql1 = insertSQL("t_union_record",data);
        query(sql1, function(err, rows, fields) {
            if (err) {
                throw err;
            }
        });

        var sql2 = 'UPDATE t_union_list SET coins=coins+' + coins + ' WHERE unionId="' + unionId + '" and area="' + area + '"';
        query(sql2, function (err, rows, fields) {
            if (err) {
                console.log(2222)
                throw err;
            }
            var sql3 = 'SELECT coins FROM t_union_list WHERE unionId="' + unionId + '" and area="' + area + '"';
            query(sql3, function (err, rows, fields) {
                if (err) {
                    console.log(33333)
                    throw err;
                }
                if(callback)callback(rows[0].coins);
            });
        });
    });
};

exports.get_record = function(userId,unionId,area,type,callback) {
    var sql = 'SELECT * FROM t_union_record WHERE unionId="' + unionId + '" and area="'+ area +'" and memberId="' + userId + '" and type="' + type + '" and stat="1" order by time desc LIMIT 20';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
            return;
        }
        if(callback)callback(rows);
    });
};

exports.get_record_all = function(unionId,area,type,callback) {
    var sql = 'SELECT * FROM t_union_record WHERE unionId="' + unionId + '" and area="'+ area + '" and type="' + type + '" and stat="1" order by time desc LIMIT 20';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
            return;
        }
        if(callback)callback(rows);
    });
};

exports.get_record_apply = function(unionId,area,type,callback) {
    var sql = 'SELECT * FROM t_union_record WHERE unionId="' + unionId + '" and area="'+ area + '" and type="' + type + '" and stat="0"';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
            return;
        }
        if(callback)callback(rows);
    });
};

exports.get_member_list = function(unionId,area,callback) {
    var sql = 'SELECT * FROM t_union_list WHERE unionId="' + unionId + '" and area="'+ area + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
            return;
        }
        if(callback)callback(rows);
    });
};

exports.dealDoudou = function(unionId,userId,area, id,isAgree,callback) {
    var sql = 'SELECT * FROM t_union_record WHERE unionId="' + unionId + '" and area="'+ area + '" and id="'+ id + '" and stat="0"';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
            return;
        }
        if(rows.length == 0)return;
        var coins = rows[0].coins;
        var memberId = rows[0].memberId;

        if(isAgree){
            var sql1 = 'SELECT * FROM t_union_list WHERE unionId="' + unionId + '" and area="' + area + '"';
            query(sql1, function(err, rows2, fields) {
                if (err) {
                    throw err;
                    return;
                }
                if(rows2.length == 0)return;
                var manager = rows2[0].manager;
                manager = JSON.parse(manager);
                var isManager = false;
                for(var i=0;i<manager.length;i++){
                    if(manager[i] == userId){
                        isManager = true;
                        break;
                    }
                }
                if(isManager == false)return;
                if((rows2[0].coins >= coins) == false){
                    if(callback)callback(1);
                    return;
                }

                var where1 = ' WHERE unionId="' + unionId + '" and area="' + area + '" and id="'+ id + '"';
                var sql2 = 'UPDATE t_union_record SET stat="1"' + where1;
                query(sql2, function(err, rows, fields) {
                    if (err) {
                        throw err;
                    }
                });

                var where2 = ' WHERE area="' + area + '"' + ' and userId="' + memberId + '" and unionId="' + unionId + '"';
                var sql3 = 'UPDATE t_union_user SET apply=apply+' + coins + where2;
                query(sql3, function(err, rows, fields) {
                    if (err) {
                        throw err;
                    }
                });
                var where3 = ' WHERE unionId="' + unionId + '" and area="' + area + '"';
                var sql4 = 'UPDATE t_union_list SET coins=coins-' + coins + where3;
                query(sql4, function(err, rows, fields) {
                    if (err) {
                        throw err;
                    }
                });

                var sql5 = 'UPDATE t_userinfo SET coins=coins+' + coins + ' WHERE userId="' + memberId + '" and area="' + area + '"';;
                query(sql5, function(err, rows, fields) {
                    if (err) {
                        throw err;
                        return;
                    }
                    var sql = 'SELECT coins FROM t_userinfo WHERE userId="' + memberId + '" and area="' + area + '"';
                    query(sql, function (err, rows, fields) {
                        if (err) {
                            throw err;
                            return;
                        }
                        var sql6 = 'SELECT coins FROM t_union_list WHERE  unionId="' + unionId + '" and area="' + area + '"';
                        query(sql6, function(err, rows2, fields) {
                            if (err) {
                                throw err;
                            }
                            if(callback)callback(0,{userId:memberId,coins:rows[0].coins,unoinCoins:rows2[0].coins});
                        });
                    });
                });
            });
        }
        else{
            var where = ' WHERE unionId="' + unionId + '" and area="' + area + '" and id="'+ id + '"';
            var sql = 'UPDATE t_union_record SET stat="-1"' + where;
            query(sql, function(err, rows, fields) {
                if (err) {
                    throw err;
                }
            });
            if(callback)callback(2);
        }
    });
};

exports.dealJoin = function(unionId,userId,area, id,isAgree,callback) {
    var sql = 'SELECT * FROM t_union_record WHERE unionId="' + unionId + '" and area="'+ area + '" and id="'+ id + '" and stat="0"';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
            return;
        }
        if(rows.length == 0)return;

        var memberId = rows[0].memberId;

        if(isAgree){
            var sql1 = 'SELECT * FROM t_union_user WHERE userId="' + memberId + '" and area="' + area + '"';
            query(sql1, function(err, rows2, fields) {
                if (err) {
                    throw err;
                    return;
                }
                if(rows2.length > 0){
var where = ' WHERE unionId="' + unionId + '" and area="' + area + '" and id="'+ id + '"';
                    var sql = 'UPDATE t_union_record SET stat="-1"' + where;
                    query(sql, function(err, rows, fields) {
                        if (err) {
                            throw err;
                        }
                    });
                    if(callback)callback(1);
                    return;
                }

                var sq4 = 'SELECT creator,manager,member FROM t_union_list WHERE unionId="' + unionId + '" and area="' + area + '"';
                query(sq4, function(err, rows, fields) {
                    if (err) {
                        throw err;
                        return;
                    }
                    var manager = rows[0].manager;
                    manager = JSON.parse(manager);
                    var isManager = false;
                    for(var i=0;i<manager.length;i++){
                        if(manager[i] == userId){
                            isManager = true;
                            break;
                        }
                    }
                    if(isManager == false)return;

                    var member = rows[0].member;
                    member = JSON.parse(member);
                    member.push(memberId);
                    var data = {member: JSON.stringify(member)};
                    var where = 'unionId="' + unionId + '" and area="' + area + '"';
                    var sql5 = updateSQL("t_union_list", data, where);
                    query(sql5, function (err, rows, fields) {
                        if (err) {
                            throw err;
                            return;
                        }
                    });

                    var data = {area:area,userId:memberId,unionId:unionId};
                    var sql3 = insertSQL("t_union_user",data);
                    query(sql3, function(err, rows, fields) {
                        if (err) {
                            throw err;
                            return;
                        }
                        if(callback)callback(0,{userId:memberId});
                    });

                    var where2 = ' WHERE unionId="' + unionId + '" and area="' + area + '" and id="'+ id + '"';
                    var sql4 = 'UPDATE t_union_record SET stat="1"' + where2;
                    query(sql4, function(err, rows, fields) {
                        if (err) {
                            throw err;
                        }
                    });
                });
            });
        }
        else{
            var where = ' WHERE unionId="' + unionId + '" and area="' + area + '" and id="'+ id + '"';
            var sql = 'UPDATE t_union_record SET stat="-1"' + where;
            query(sql, function(err, rows, fields) {
                if (err) {
                    throw err;
                }
            });
            if(callback)callback(2);
        }
    });
};

exports.setManager = function(unionId,creator,area, userId,isAgree) {
    var sql = 'SELECT * FROM t_union_list WHERE unionId="' + unionId + '" and area="'+ area + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
            return;
        }
        if(rows.length == 0 || creator != rows[0].creator)return;

        var member = rows[0].member;
        member = JSON.parse(member);
        var isMember = false;
        for(var i=0;i<member.length;i++){
            if(member[i] == userId){
                isMember = true;
                break;
            }
        }
        if(isMember == false)return;

        var manager = rows[0].manager;
        manager = JSON.parse(manager);
        for(var i=0;i<manager.length;i++){
            if(manager[i] == userId){
                manager.splice(i,1);
                break;
            }
        }
        if(isAgree){
            manager.push(userId);
        }
        var data = {manager: JSON.stringify(manager)};

        var where = 'unionId="' + unionId + '" and area="' + area + '"';
        var sql5 = updateSQL("t_union_list", data, where);
        query(sql5, function (err, rows, fields) {
            if (err) {
                throw err;
                return;
            }
        });

    });
};

exports.get_award_count = function(unionId,area,callback) {
    var sql = 'SELECT * FROM s_union_score_detail WHERE userId="' + unionId + '" and area="'+ area + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
            return;
        }
        if(rows.length == 0){
            if(callback)callback(0);
            return;
        }
        var count = rows[0].totalTax1 - rows[0].getTax;
        if(callback)callback(count);
    });
};

exports.award_coin = function(unionId,area,callback) {
    var sql = 'SELECT * FROM s_union_score_detail WHERE userId="' + unionId + '" and area="'+ area + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
            return;
        }
        if(rows.length == 0)return;
        var totalTax1 = rows[0].totalTax1;
        var count = totalTax1 - rows[0].getTax;
        if(count == 0){
            if(callback)callback(0,count);
            return;
        }
        var sql2 = 'UPDATE s_union_score_detail SET getTax=' + totalTax1 + ' WHERE userId="' + unionId + '" and area="'+ area + '"';
        query(sql2, function(err, rows, fields) {
            if (err) {
                throw err;
                return;
            }
            if(callback)callback(0,count);
        });

        var sql3 = 'UPDATE t_union_list SET coins=coins+' + count + ' WHERE unionId="' + unionId + '" and area="'+ area + '"';
        query(sql3, function(err, rows, fields) {
            if (err) {
                throw err;
                return;
            }
            if(callback)callback(0,count);
        });

        var time = Date.now();
        var data = {unionId:unionId,area:area,memberId:unionId,memberName:unionId,type:3,coins:count,time:time,stat:1};
        var sql4 = insertSQL("t_union_record",data);
        query(sql4, function(err, rows, fields) {
            if (err) {
                throw err;
            }
        });

    });
};

exports.niuniu_permission = function(userId,callback) {
    var sql = 'SELECT * FROM t_niuniu_permission WHERE userId="' + userId + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
            return;
        }
        if(rows.length == 0){
            if(callback)callback(2);
            return;
        }
        if(rows[0].times <= 0){
            if(callback)callback(1);
            return;
        }

        if(callback)callback(0);
        /*var data = {};
        data.times = rows[0].times - 1;
        var where = 'userId="' + userId +  '"';
        var sql = updateSQL("t_niuniu_permission",data,where);
        query(sql, function(err, rows2, fields) {
            if (err) {
                throw err;
            }
            if(callback)callback(0);
        });*/
    });
};

exports.getNiuniu2 = function(userId,callback) {
    var sql = 'SELECT * FROM t_niuniu_rate WHERE userId="' + userId + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
            return;
        }
        if(rows.length == 0){
            if(callback)callback(0);
            return;
        }
        if(callback)callback(rows[0].rate);
    });
};

exports.set_niuniu_permission = function(userId,niuniu,callback) {
    var sql = 'SELECT * FROM t_niuniu_permission WHERE userId="' + userId + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
            if(callback)callback(1);
            return;
        }
        if(rows.length == 0){
            if(niuniu == false){
                if(callback)callback(0);
                return;
            }
            var sql2 = insertSQL("t_niuniu_permission",{area:"wdnn",userId:userId,times:3});
            query(sql2, function(err, rows2, fields) {
                if (err) {
                    throw err;
                    if(callback)callback(2);
                    return;
                }
                if(callback)callback(0);
            });
            return;
        }
        var times = 0;
        if((niuniu == false && rows[0].times <= 0) || (niuniu && rows[0].times > 0)){
            if(callback)callback(0);
            return;
        }
        if(niuniu){
            times = 3;
        }
        var where =  'userId="' + userId + '"';
        var sql3 = updateSQL("t_niuniu_permission",{times:times},where);
        query(sql3, function(err, rows, fields) {
            if (err) {
                throw err;
                if(callback)callback(3);
                return;
            }
            if(callback)callback(0);
        });
    });
};

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