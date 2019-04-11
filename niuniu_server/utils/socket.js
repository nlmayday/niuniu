'use strict';

const stream = require('./binstream');
//const stream = new binstream();
const headerLength = 17;
function buildData(commandId, msgContent) {
    // 协议头
    /**
     HEAD_0 = ord(ud[0])
     HEAD_1 = ord(ud[1])
     HEAD_2 = ord(ud[2])
     HEAD_3 = ord(ud[3])
     protoVersion = ord(ud[4])
     serverVersion = ud[5]
     length = ud[6] + 4
     command = ud[7]
     */
    var writeStream = stream.WriteStream;
    writeStream.init();
    writeStream.uint8(0);
    writeStream.uint8(0);
    writeStream.uint8(0);
    writeStream.uint8(0);
    writeStream.uint8(0);
    writeStream.uint32(0);
    var length = msgContent.length + 4;
    writeStream.uint32(length);
    writeStream.uint32(commandId);
    writeStream.utf8(msgContent);
    return writeStream.bytes();
}

exports.send = function(res,commandId, msgContent) {
    var jsonContent = JSON.stringify(msgContent);
    var sendData = buildData(commandId, jsonContent);
    if(res != null && res.readyState == 1) {
        res.send(sendData);
    }
}

exports.parse = function(parsedData) {
    var readStream = stream.ReadStream;
    readStream.init(parsedData);
    var head0 = readStream.uint8();
    var head1 = readStream.uint8();
    var head2 = readStream.uint8();
    var head3 = readStream.uint8();
    var protoVersion = readStream.uint8();
    var serverVersion = readStream.uint32();
    var length = readStream.uint32();
    length -= 4;
    var commandId = readStream.uint32();
    if (readStream.length() >= length + headerLength) {
        var msgContent = readStream.utf8(length);
        var content = JSON.parse(msgContent);
        return content;
    }
}
exports.req = {
    getLeaderboard           : 1,    //得到排行榜列表
    getOpenedRooms           : 2,    //得到创建房间列表
    getMatchOfToday          : 3,    //得到今日赛事列表
    create_room              : 4,
    enter_private_room       : 5,
    enter_public_room        : 6,
    getHistoryList           : 7,
    getGamesOfRoom           : 8,
    getDetailOfGame          : 9,
    getListOfShop            : 10,
    getListOfPayRecords      : 11,
    updateTaskState          : 12,
    getRoomConfig            : 13,
    getNotify                 : 14,
    getRoomsList              : 15,
    leave_roomList            : 16,
    save_money                : 17,
    takeOut_money            : 18,

    create_union             : 20,
    join_union               : 21,
    get_unionInfo            : 22,
    apply_coin               : 23,
    offer_coin               : 24,
    join_list                : 25,
    apply_list                : 26,
    apply_record             : 27,
    offer_record             : 28,

    apply_record_all         : 30,
    offer_record_all         : 31,
    member_list              : 32,
    award_coin               : 33,
    award_coin_list          : 34,
    exit_union               : 35,
    dealDoudou               : 36,
    dealJoin                 : 37,
    award_count               : 38,
    setManager               : 39,

    sitDown                   : 48,
    start                     : 49,
    login                      : 50,
    ready                      : 51,
    chupai                     : 52,
    peng                        : 53,
    gang                        : 54,
    hu                          : 55,
    guo                         : 56,
    exit                        : 57,
    dispress                    : 58,
    dissolve_request           : 59,
    dissolve_agree              : 60,
    dissolve_reject             : 61,
    chat                         : 62,
    quick_chat                  : 63,
    emoji                        : 64,
    voice                        : 65,
    magic                       : 66,

    chi                          : 70,
    dingque                      : 71,
    tianTing                     : 72,

    qiangzhuang                 : 101,
    xiazhu                      : 102,
    kanpai                       : 103,
    liangpai                    : 104,

    niuniu                      : 150,
};

exports.resp = {
    leaderboard_resp         : 1,
    openedRooms_resp         : 2,
    matchOfToday_resp        : 3,
    create_room_resp         : 4,
    enter_private_room_resp  : 5,
    enter_public_room_resp   : 6,
    getHistoryList_resp      : 7,
    getGamesOfRoom_resp      : 8,
    getDetailOfGame_resp     : 9,
    getListOfShop_resp       : 10,
    getListOfPayRecords_resp : 11,
    updateTaskState_resp     : 12,
    getRoomConfig_resp        : 13,
    getNotify_resp             : 14,
    getRoomsList_resp         : 15,
    roomsList_refresh         : 16,

    create_union_resp          : 20,
    get_unionInfo_resp         : 21,
    apply_record_resp          : 22,
    offer_record_resp          : 23,
    join_list_resp              : 24,
    apply_list_resp             : 25,
    apply_record_all_resp      : 26,
    offer_record_all_resp      : 27,
    member_list_resp            : 28,
    award_coin_resp             : 29,
    award_coin_list_resp       : 30,
    award_count_resp            : 31,

    union_change                : 40,
    money_change                : 41,
    unoin_coins_change          : 42,
    unoin_member_change         : 43,
    dealDoudou_resp             : 44,
    dealJoin_resp               : 45,

    user_sit                   :49,
    login_result               :50,
    new_user                   :51,
    user_state                 :52,
    user_ready                 :53,
    dispress                    :54,
    exit_result                :55,
    exit_notify                :56,
    game_holds                 :57,
    game_begin                 :58,
    game_sync                  :59,
    game_state                  :60,
    game_num                    :61,
    mj_count                    :62,
    game_chupai                 :63,
    game_chupai_notify          :64,
    guo_notify                  :65,
    game_mopai                  :66,
    game_action                 :67,
    peng_notify                 :68,
    gang_notify                 :69,
    hangang_notify              :70,
    game_ting                   :71,
    game_over                    :72,
    game_hupai                   :73,
    chi_notify                   :74,
    game_dingque                :75,
    result_dingque              :76,
    game_tianTing               :77,
    chongfengji                  :78,

    dissolve_notice             :80,
    dissolve_cancel             :81,
    chat                         :82,
    quick_chat                  :83,
    emoji                        :84,
    voice                       :85,
    magic                       : 86,

    qiangzhuang_all           : 101,
    dingzhuang_all            : 102,
    xiazhu_all                : 103,
    cuopai_all                : 104,
    bipai_all                 : 105,
    next_all                  : 106,
    qiangzhuang_notify       : 107,
    xiazhu_notify            : 108,
    kanpai_notify            : 109,
    liangpai_notify          : 110,

    niuniu_resp               : 150,
};