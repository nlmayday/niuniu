cc.Class({
    extends: cc.Component,

    properties: {
        label_key : cc.Label,
        label_server : cc.Label,
        node_buy : cc.Node,
        node_log : cc.Node,
        shop_content : cc.Node,
        PayRecord : cc.Node,
    },

    // use this for initialization
    onLoad: function () {
        this._page = 1;
        this._curPage = 0;
        this._record = 10;      //充值记录每页展示数量
        this.noMoreMessage = false;
        var children = this.shop_content.children;
        this._MAX_SHOP_INFO = children.length;
        this._buyNodes = [];
        for(var i=0;i<children.length;i++){
            this._buyNodes[i] = {};
            this._buyNodes[i].node = children[i];
            //this._buyNodes[i].node.active = false;
            this._buyNodes[i].title = children[i].getChildByName("Label_title").getComponent(cc.Label);
            this._buyNodes[i].money = children[i].getChildByName("Button_buy").getChildByName("Label_money").getComponent(cc.Label);
            this._buyNodes[i].add = children[i].getChildByName("Sprite_add").getChildByName("Label_add").getComponent(cc.Label);
        }

        this.node_buy.active = true;
        this.node_log.active = false;
        this.PayRecord.parent.height = 0;
        this.PayRecord.active = false;

        var self = this;
        this.node_log.getChildByName("Node_info").on("scroll-to-bottom",function(){
            if(self.noMoreMessage)return;
            self._page ++;
            self.getListOfPayRecords();
        });
        //this.getListOfShop();
    },
    getListOfShop:function(){
        var self = this;
        cc.vv.userMgr.getListOfShop(function(data){
            if(data && data.length > 0){
                self.initShopInfoList(data);
            }
        });
    },
    initShopInfoList:function(data){
        if(!data){
            this.node_buy.active = false;
            return;
        }
        var width = 0;
        for(var i=0;i<data.length;i++){
            if(i >= this._MAX_SHOP_INFO){
                break;
            }
            var shop = this._buyNodes[i];
            shop.node.active = true;
            shop.title.string = data[i].des;
            shop.money.string = "￥" + data[i].money;
            shop.add.string = data[i].send_gems;

            if(cc.vv.userMgr.code){
                this.label_key.string = "已绑定邀请码：" + cc.vv.userMgr.code;
            }
            else{
                //shop.add.node.parent.active = true;
            }
            this._buyNodes[i].data = data[i];
            width += shop.node.width + 12;
        }
        this.shop_content.width = width;
        console.log("this.shop_content.width",this.shop_content.width);
    },

    getListOfPayRecords:function(){
        var self = this;
        console.log("this._page",self._page);
        cc.vv.userMgr.getListOfPayRecords(self._page,function(data){
            if(data&& data.length > 0){
                if(self._curPage == self._page)return;
                self.initPayRecordsList(data);
                self._curPage = self._page;
            }
        });
    },
    
    initPayRecordsList:function(data){
        if(!data)return;
        if(data.length < this._record){
            this.noMoreMessage = true;
        }
        for(var i=0;i<data.length;i++){
            var record = cc.instantiate(this.PayRecord);
            record.active = true;
            record.getChildByName("Label_number").getComponent(cc.Label).string = data[i].order_id;
            record.getChildByName("Label_money").getComponent(cc.Label).string = data[i].money;
            record.getChildByName("Label_agent_id").getComponent(cc.Label).string = data[i].user_id;
            //record.getChildByName("Label_state").getComponent(cc.Label).string = data[i].aa;
            var datetime = this.dateFormat(data[i].create_time * 1000);
            record.getChildByName("Label_time").getComponent(cc.Label).string = datetime;
            this.PayRecord.parent.height += record.height + 10;
            this.PayRecord.parent.addChild(record);
        }
        console.log("this.PayRecord.parent.height",this.PayRecord.parent.height);
    },

    dateFormat:function(time){
        var date = new Date(time);
        var datetime = "{0}-{1}-{2} {3}:{4}:{5}";
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        month = month >= 10? month : ("0"+month);
        var day = date.getDate();
        day = day >= 10? day : ("0"+day);
        var h = date.getHours();
        h = h >= 10? h : ("0"+h);
        var m = date.getMinutes();
        m = m >= 10? m : ("0"+m);
        var s = date.getSeconds();
        s = s >= 10? s : ("0"+s);
        datetime = datetime.format(year,month,day,h,m,s);
        return datetime;
    },

    onWXPayClick:function(event,data){
        var index = parseInt(data);
        var info = this._buyNodes[index].data;
        if(info){
            var onGet = function(ret){
                if(ret.errcode !== 0){
                    console.log(ret.errmsg);
                }
                else{
                    console.log(ret);
                    console.log(ret.order_id,index,JSON.stringify(info));
                    var attach = {
                        userId :cc.vv.userMgr.userId,
                        rechage_id:index+1,
                        order_id:ret.order_id,
                    };
                    //var content = new Buffer(JSON.stringify(attach)).toString('base64');
                    cc.vv.anysdkMgr.onWXPay(ret.order_id,info.money,info.des,content);
                }
            };
            var data = {
                user_id:cc.vv.userMgr.userId,
                rechage_id:index+1,
            };
            cc.vv.http.sendRequest("/recharge_id",data,onGet);
        }
    },

    onToggleClick:function(event,data){
        if(data == 1){
            this.node_buy.active = true;
            this.node_log.active = false;
        }
        else if(data == 2){
            this.node_buy.active = false;
            this.node_log.active = true;
            this.getListOfPayRecords();
        }
    },

    onCloseClick:function(){
        cc.vv.prefabMgr.layoutClose();
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
