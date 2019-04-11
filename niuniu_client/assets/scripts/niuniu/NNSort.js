//顺子
function checkShuizi( cards , seleteCard ) {
    var dict = {};
    for (var i = 0; i < cards.length; i++) {
        var card = parseInt(cards[i]);
        var value = Math.floor(card / 10);
        dict[value] = dict[value] === undefined ? 1 : dict[value] + 1;
    }
    var count = [];
    var max = 0;
    var min = 99;
    for (var i in dict) {
        var j = parseInt(i);
        if(j > max){
            max = j;
        }
        if(j < min){
            min = j;
        }
        count.push(dict[i]);
    }
    if(count.length == 5 && (max - min) == 4){
        console.log("顺子222222222222222222222",cards);
        cards.sort(function(a,b){
            return parseInt(a)-parseInt(b);
        });
        if(seleteCard)seleteCard = cards;
        return true;
    }
    return false;
}
//同花
function checkTonghua( cards , seleteCard ) {
    var hua = 0;
    for (var i = 0; i < cards.length; i++) {
        var card = parseInt(cards[i]);
        var type = card % 10;
        if(hua == 0){
            hua = type;
        }
        else if(type != hua){
            return false;
        }
    }
    cards.sort(function(a,b){
        return parseInt(a)-parseInt(b);
    });
    if(seleteCard)seleteCard = cards;
    console.log("同花2222222222222222222222",hua,cards);
    return true;
}
//葫芦牛
function checkHulu( cards , seleteCard ) {
    var dict = {};
    for (var i = 0; i < cards.length; i++) {
        var card = parseInt(cards[i]);
        var value = Math.floor(card / 10);
        dict[value] = dict[value] === undefined ? 1 : dict[value] + 1;
    }
    var count = [];
    var kinds = [];
    for (var i in dict) {
        count.push(dict[i]);
        kinds.push(i);
    }
    if(count.length == 2 && (count[0] == 3 || count[1] == 3)){
        if(count[0] == 3){
            cards.sort(function(a,b){
                if(Math.floor(a / 10) == kinds[0]){
                    return -1;
                }
                if(Math.floor(b / 10) == kinds[0]){
                    return 1;
                }
                return 0;
            });
        }
        else{
            cards.sort(function(a,b){
                if(Math.floor(a / 10) == kinds[1]){
                    return -1;
                }
                if(Math.floor(b / 10) == kinds[1]){
                    return 1;
                }
                return 0;
            });
        }
        if(seleteCard){
            for(var i=0;i<3;i++){
                seleteCard.push(cards(i));
            }
        }
        console.log("葫芦牛22222222222222222222",count,cards);
        return true;
    }
    return false;
}
//炸弹牛
function checkZhadan( cards , seleteCard ) {
    var dict = {};
    for (var i = 0; i < cards.length; i++) {
        var card = parseInt(cards[i]);
        var value = Math.floor(card / 10);
        dict[value] = dict[value] === undefined ? 1 : dict[value] + 1;
    }
    var count = [];
    var kinds = [];
    for (var i in dict) {
        count.push(dict[i]);
        kinds.push(i);
    }
    if(count.length == 2 && (count[0] == 4 || count[1] == 4)){
        if(count[0] == 4){
            cards.sort(function(a,b){
                if(Math.floor(a / 10) == kinds[0]){
                    return -1;
                }
                if(Math.floor(b / 10) == kinds[0]){
                    return 1;
                }
                return 0;
            });
        }
        else{
            cards.sort(function(a,b){
                if(Math.floor(a / 10) == kinds[1]){
                    return -1;
                }
                if(Math.floor(b / 10) == kinds[1]){
                    return 1;
                }
                return 0;
            });
        }
        if(seleteCard){
            for(var i=0;i<4;i++){
                seleteCard.push(cards(i));
            }
        }
        console.log("炸弹牛2222222222222222222",count,cards);
        return true;
    }
    return false;
}
//五小牛
function checkWuxiao( cards , seleteCard ) {
    var total = 0;
    for (var i = 0; i < cards.length; i++) {
        var card = parseInt(cards[i]);
        var value = Math.floor(card / 10);
        total += value;
    }
    if(total <= 10){
        cards.sort(function(a,b){
            return parseInt(a)-parseInt(b);
        });
        if(seleteCard)seleteCard = cards;
        return true;
    }
    return false;
}
//五花牛
function checkWuhua( cards , seleteCard ) {
    var isWuhuaniu = true;
    for (var i = 0; i < cards.length; i++) {
        var card = parseInt(cards[i]);
        if(card <= 104){
            isWuhuaniu = false;
        }
    }
    if(isWuhuaniu){
        cards.sort(function(a,b){
            return parseInt(a)-parseInt(b);
        });
        if(seleteCard)seleteCard = cards;
    }
    return isWuhuaniu;
}


//计算最终为牛几
function calculate( cards , seleteCard ) {
    var s = 0;
    var dict = {};
    for (var i = 0; i < cards.length; i++) {
        var card = parseInt(cards[i]);
        var ci = Math.floor(card / 10);
        if(ci > 10)ci = 10;
        s += ci;
        dict[ci] = dict[ci] === undefined ? 1 : dict[ci] + 1;
    };
    var point = s % 10;

    var exists = false;
    var niuNumber = [];
    for (var i in dict) {
        var other = (10 + point - i) % 10;
        if(other == 0)other = 10;
        if (dict[other]) {
            if ((other == i && dict[other] >= 2) || (other!=i&&dict[other] >= 1)) {
                niuNumber = [i,other];
                exists = true;
                break;
            }
        }
    }
    if(exists){
        var last = [];
        for(var i=0;i<cards.length;i++){
            var value = Math.floor(parseInt(cards[i]) / 10);
            if(value > 10)value = 10;
            if(value == niuNumber[0]){
                niuNumber[0] = -1;
                last.push(cards[i]);
                continue;
            }
            if(value == niuNumber[1]){
                niuNumber[1] = -1;
                last.push(cards[i]);
                continue;
            }
        }
        cards.sort(function(a,b){
            if(a == last[0]){
                return 1;
            }
            if(a == last[1]){
                return 1;
            }
            return 0;
        });
        if(seleteCard){
            for(var i=0;i<3;i++){
                seleteCard.push(cards(i));
            }
        }
    }
}
//排序牌 32分开
function sort( cards2 ) {
    var cards = cards2;
    var isShuizi = checkShuizi(cards);
    var isTonghua = checkTonghua(cards);
    if(checkZhadan(cards))return;
    if(checkWuhua(cards))return;
    if(checkWuxiao(cards))return;
    if(checkHulu(cards))return;
    if(isTonghua)return;
    if(isShuizi)return;
    
    calculate(cards);
}
//提示 弹起的牌
function hint( cards2 ) {
    var cards = cards2;
    var seleteCard = [];
    var isShuizi = checkShuizi(cards,seleteCard);
    var isTonghua = checkTonghua(cards,seleteCard);
    if(checkZhadan(cards,seleteCard))return seleteCard;
    if(checkWuhua(cards,seleteCard))return seleteCard;
    if(checkWuxiao(cards,seleteCard))return seleteCard;
    if(checkHulu(cards,seleteCard))return seleteCard;
    if(isTonghua)return seleteCard;
    if(isShuizi)return seleteCard;
    
    calculate(cards,seleteCard);
    return seleteCard;
}

module.exports = {
    sort : sort,
    hint : hint
}