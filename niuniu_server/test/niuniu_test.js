

//顺子
function checkShuizi( cards ) {
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
        if(i > max){
            max = i;
        }
        if(i < min){
            min = i;
        }
        count.push(dict[i]);
    }
    if(count.length == 5 && (max - min) == 4){
        return true;
    }
    return false;
}

console.log(checkShuizi([11,21,32,52,111]))