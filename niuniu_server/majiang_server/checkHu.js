'use strict';

function getMJType(id) {
    id = parseInt( id );
    if(id >= 0 && id < 9){
        return 0;
    }
    else if(id >= 9 && id < 18){
        return 1;
    }
    else if(id >= 18 && id < 27){
        return 2;
    }
    else if(id >= 27 && id < 34){
        return 3;
    }
    else if(id >= 34 && id < 42){
        return 4;
    }
    return -1;
}
function isHun(mj,hunArr) {
    for(var i=0;i< hunArr.length;i++){
        if(mj == hunArr[i])return true;
    }
    return false;
}
function sort(arr) {
    arr.sort(function (a,b) {
        return a - b;
    })
}
function seprateArr( mjArr, hunArr ){
    var reArr = [[],[],[],[]];
    var hunMj = [];
    for(var i=0;i< mjArr.length;i++){
        var mj = mjArr[i];
        if(isHun(mj,hunArr)){
            hunMj.push(mj);
            continue;
        }
        var type = getMJType(mj);
        if(type >=0 && type < 4)
            reArr[type].push( mj );
    }
    reArr[4] = hunMj;
    return reArr
}

function test3Combine( mj1, mj2, mj3 ){
    if (mj1 == mj2 && mj1 == mj3){
        return true;
    }
    var t1 = getMJType(mj1), t2 = getMJType(mj2), t3 = getMJType(mj3);
    if (t1 != t2 || t1 != t3){
        return false;
    }
    if (t1 > 2)return false;
    if ((mj1+1) == mj2 && (mj1+2) == mj3){
        return true;
    }
    return false;
}

function test2Combine( mj1, mj2 ){
    if (mj1 == mj2){
        return true;
    }
    return false;
}

function getModNeedNum(arrLen,isJiang) {
    if (arrLen == 0) {
        return 0;
    }
    var modNum = arrLen % 3;
    var needNumArr = [0, 2, 1];
    if (isJiang) {
        needNumArr = [2, 1, 0];
    }
    return needNumArr[modNum];
}

var Rule = function() {
    this.hunTotal = 0;
    this.callTime = 0;
    this.needHunCount = 0;
    this.minHunCount = 4;
};

function getNeedHunInSub( subArr, hNum, rule) {
    rule.callTime += 1;
    var lArr = subArr.length;

    if(rule.minHunCount <= hNum + getModNeedNum(lArr, false))return;
    if (lArr == 0) {
        rule.needHunCount = 0 + hNum;
        if(rule.needHunCount < rule.minHunCount){
            rule.minHunCount = rule.needHunCount;
        }
        return;
    }
    else if (lArr == 1) {
        rule.needHunCount = 2 + hNum;
        if(rule.needHunCount < rule.minHunCount){
            rule.minHunCount = rule.needHunCount;
        }
        return;
    }
    else if (lArr == 2) {
        var type = getMJType(subArr[0]);
        var mj0 = subArr[0];
        var mj1 = subArr[1];
        if (type > 2) {
            if (mj0 == mj1) {
                rule.needHunCount = 1 + hNum;
                if(rule.needHunCount < rule.minHunCount){
                    rule.minHunCount = rule.needHunCount;
                }
                return;
            }
            else{
                rule.needHunCount = 4 + hNum;
                return;
            }
        }
        else {
            if (mj1 - mj0 < 3) {
                rule.needHunCount = 1 + hNum;
                if(rule.needHunCount < rule.minHunCount){
                    rule.minHunCount = rule.needHunCount;
                }
                return;
            }
            else{
                rule.needHunCount = 4 + hNum;
                return;
            }
        }
    }
    else if (lArr >= 3) {
        rule.needHunCount = 2 * lArr;
        var type = getMJType(subArr[0]);
        var mj0 = subArr[0];
        var mj1 = subArr[1];
        var mj2 = subArr[2];
        //第一个和另外两个一铺
        if (hNum + getModNeedNum(lArr - 3, false) <= rule.hunTotal) {
            for (var i = 1; i < lArr; i++) {
                var mji = subArr[i];
                //13444   134不可能连一起
                if (mji - mj0 > 1) break;
                if (i + 2 < lArr &&　subArr[i + 2] == mji)
                    continue;
                if (i + 1 < lArr) {
                    var tmp1 = subArr[0], tmp2 = subArr[i], tmp3 = subArr[i + 1];
                    if (test3Combine(tmp1, tmp2, tmp3)) {
                        subArr.splice(0, 1);
                        subArr.splice(i-1, 1);
                        subArr.splice(i-1, 1);
                        getNeedHunInSub(subArr, hNum, rule);
                        subArr.push(tmp1);
                        subArr.push(tmp2);
                        subArr.push(tmp3);
                        sort(subArr);
                    }
                }
            }
        }
        //第一个和第二个一铺
        if (hNum + getModNeedNum(lArr - 2, false) + 1 <= rule.hunTotal) {
            if (type > 2) {
                if (mj0 == mj1) {
                    var tmp1 = subArr[0], tmp2 = subArr[1];
                    subArr.splice(0, 1);
                    subArr.splice(0, 1);
                    getNeedHunInSub(subArr, hNum + 1, rule);
                    subArr.push(tmp1);
                    subArr.push(tmp2);
                    sort(subArr);
                }
            }
            else {
                for (var i = 1; i < lArr; i++) {
                    var v1 = subArr[i];
                    //如果当前的value不等于下一个value则和下一个结合避免重复
                    if (i + 1 != lArr) {
                        var v2 = subArr[i + 1];
                        if (v1 == v2)
                            continue;
                    }
                    var mius = v1 - mj0;
                    if (mius < 3) {
                        var tmp1 = subArr[0], tmp2 = subArr[i];
                        subArr.splice(0, 1);
                        subArr.splice(i-1, 1);
                        getNeedHunInSub(subArr, hNum + 1, rule);
                        subArr.push(tmp1);
                        subArr.push(tmp2);
                        sort(subArr);
                        if (mius >= 1) break;
                    }
                    else break;
                }
            }
        }
        //第一个自己一铺
        if (hNum + getModNeedNum(lArr - 1, false) + 2 <= rule.hunTotal) {
            var tmp1 = subArr[0];
            subArr.splice(0, 1);
            getNeedHunInSub(subArr, hNum + 2, rule);
            subArr.push(tmp1);
            sort(subArr);
        }
    }
}

function canHu( arr,rule ) {      //带将
    var arrLen = arr.length;
    if (arrLen == 0) {
        if(rule.hunTotal >= 2 + rule.needHunCount){
            return true;
        }
        return false;
    }
    else if (arrLen == 1) {
        if(rule.hunTotal >= 1 + rule.needHunCount){
            return true;
        }
        return false;
    }
    if (rule.hunTotal < getModNeedNum(arrLen, true) + rule.needHunCount)
        return false;

    var hasJiang = false;
    var needHunCount = rule.needHunCount;
    rule.minHunCount = 4;
    for (var i = 0; i < arrLen; i++) {
        if (i + 1 < arrLen && arr[i + 1] == arr[i]) {
            var tmp1 = arr[i], tmp2 = arr[i + 1];
            arr.splice(i, 1);
            arr.splice(i, 1);
            getNeedHunInSub(arr, needHunCount, rule);
            arr.push(tmp1);
            arr.push(tmp2);
            sort(arr);
            hasJiang = true;
            if (rule.hunTotal >= rule.minHunCount && hasJiang) {
                return true;
            }
        }
        if (rule.hunTotal > needHunCount) {
            if (i + 1 < arrLen && arr[i] != arr[i+1]) {
                var tmp1 = arr[i];
                arr.splice(i, 1);
                getNeedHunInSub(arr, needHunCount + 1, rule ,true);
                arr.push(tmp1);
                sort(arr);
                hasJiang = true;
                if (rule.hunTotal >= rule.minHunCount && hasJiang) {
                    return true;
                }
            }
        }
        if (i + 1 < arrLen && arr[i + 1] == arr[i]) {
            i++;
        }
        if (i + 2 < arrLen && arr[i + 2] == arr[i]) {
            i++;
        }
    }
    /*if (rule.hunTotal >= rule.minHunCount && hasJiang) {
        return true;
    }*/
    return false;
}

//判断胡牌
function doCheckHu( mjArr, hunArr ){
    var newArr = [].concat(mjArr);
    sort(newArr);
    var sptArr = seprateArr( newArr, hunArr );
    var curHunNum = sptArr[4].length;
    if (curHunNum > 3){
        return true;
    }
    var rule = new Rule();
    rule.hunTotal = curHunNum;

    var needHunArr = []; // 每个分类需要混的数组
    for(var i=0;i<4;i++){
        rule.needHunCount = 0;
        rule.minHunCount = 4;
        getNeedHunInSub( sptArr[i], 0 ,rule );
        needHunArr.push(rule.minHunCount);
    }
    var isHu = false;
    //将在万中
    //如果需要的混小于等于当前的则计算将在将在万中需要的混的个数
    var needHunAll = needHunArr[1] + needHunArr[2] + needHunArr[3];
    if (needHunAll <= rule.hunTotal){
        rule.needHunCount = needHunAll;
        isHu = canHu( sptArr[0] ,rule );
        if (isHu){
            return true;
        }
    }
    //将在饼中
    needHunAll = needHunArr[0] + needHunArr[2] + needHunArr[3];
    if (needHunAll <= rule.hunTotal){
        rule.needHunCount = needHunAll;
        isHu = canHu( sptArr[1] ,rule );
        if (isHu){
            return true;
        }
    }
    //将在条中
    needHunAll = needHunArr[0] + needHunArr[1] + needHunArr[3];
    if (needHunAll <= rule.hunTotal) {
        rule.needHunCount = needHunAll;
        isHu = canHu(sptArr[2], rule);
        if (isHu){
            return true;
        }
    }
    //将在风中
    needHunAll = needHunArr[0] + needHunArr[1] + needHunArr[2];
    if (needHunAll <= rule.hunTotal){
        rule.needHunCount = needHunAll;
        isHu = canHu( sptArr[3] ,rule );
        if (isHu) {
            return true;
        }
    }
    rule = null;
    return false;
}

function doCheckTing( mjArr, hunArr ) { //赖子未包括
    var tingMAp = [];
    var isHu = false;
    for(var i=0;i< 34;i++){
        if(isHun(i,hunArr)){
            continue;
        }
        mjArr.push(i);
        isHu = doCheckHu(mjArr, hunArr);
        mjArr.pop();
        if(isHu){
            tingMAp.push(i);
        }
    }
    return tingMAp;
}
exports.doCheckHu = doCheckHu;
exports.doCheckTing = doCheckTing;

const PAI_13YAO = [ 0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33 ]; //13yao固定牌组
//检测听牌13幺
function check13yao(countMap,hunArr) {
    var tingMap = [];
    var hasHunCount = 0;
    for (var i = 0; i < hunArr.length; i++) {
        var hun = hunArr[i];
        hasHunCount += map[hun];
        map[hun] = 0;
    }
    for(var k=0;k<PAI_13YAO.length;k++) {
        var pai = PAI_13YAO[k];
        if (isHun(pai,hunArr)) {
            continue;
        }
        var needHunCount = 0;
        var leftCard = -1;
        var map = [].concat(countMap);
        map[pai] ++;
        for (var i = 0; i < PAI_13YAO.length; i++) {
            var pai2 = PAI_13YAO[i];
            if (map[pai2] == 0) {
                needHunCount++;
            }
            else if (map[pai2] > 2) {
                return [];
            }
            else if (map[pai2] == 2) {
                if (leftCard != -1) {
                    return [];
                }
                leftCard = pai2;
            }
        }
        if (hasHunCount >= needHunCount) {
            if (leftCard != -1) {
                tingMap.push(pai);
            }
            else if (hasHunCount > needHunCount) {
                tingMap.push(pai);
            }
        }
    }
    return tingMap;
}
//检测听牌7对
function check7dui( holds, hunArr ) {
    //检查是否是七对 前提是没有碰，也没有杠 ，即手上拥有13张牌
    if( holds.length != 13 )return [];
    var tingMap = [];
    var hasHunCount = 0;
    var holds2 = [].concat(holds);
    for (var j = 0; j < holds2.length; j++) {
        if (isHun(holds2[j],hunArr)) {
            hasHunCount++;
            holds2.splice(j, 1);
            j--;
        }
    }
    for(var k=0;k<MAX_MJ;k++) {
        if (isHun(k,hunArr)) {
            continue;
        }
        var needHunCount = 0;
        var holds3 = [].concat(holds2);
        holds3.push(k);
        sort(holds3);
        for (var j = 0; j < holds3.length; j++) {
            if (j + 1 < holds3.length && holds3[j + 1] == holds3[j]) {
                j++;
            }
            else {
                needHunCount++;
            }
        }
        if (hasHunCount >= needHunCount) {
            tingMap.push(k);
        }
    }
    return tingMap;
}
exports.check13yao = check13yao;
exports.check7dui = check7dui;