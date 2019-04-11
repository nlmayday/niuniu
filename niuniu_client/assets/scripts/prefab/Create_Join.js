cc.Class({
    extends: cc.Component,

    properties: {
        
    },

    // use this for initialization
    onLoad: function () {
        this.create = this.node.getChildByName("create");
        this.join = this.node.getChildByName("join");
        this.btn1 = this.node.getChildByName("btn1");
        this.btn2 = this.node.getChildByName("btn2");

        this.pop_bg = this.node.getChildByName("pop_bg");

        this.createEditBox1 = this.node.getChildByName("create").getChildByName("editBox1").getComponent(cc.EditBox);
        this.createEditBox2 = this.node.getChildByName("create").getChildByName("editBox2").getComponent(cc.EditBox);
        this.createEditBox3 = this.node.getChildByName("create").getChildByName("editBox3").getComponent(cc.EditBox);
        this.createEditBox4 = this.node.getChildByName("create").getChildByName("editBox4").getComponent(cc.EditBox);
        this.joinEditBox = this.node.getChildByName("join").getChildByName("editBox").getComponent(cc.EditBox);
    },
    onBtnClick:function(event){
        this.btn1.active = false;
        this.btn2.active = false;
        if(event.target.name == "btn1"){
            this.create.active = true;
            this.pop_bg.active = false;
        }
        if(event.target.name == "btn2"){
            this.join.active = true;
        }
        if(event.target.name == "create"){
            var unionName = this.createEditBox1.string;
            if(unionName == ""){
                cc.vv.prefabMgr.alertOpen(this.node,"提示","请输入公会名称");
                return;
            }
            var name = this.createEditBox2.string;
            if(name == ""){
                cc.vv.prefabMgr.alertOpen(this.node,"提示","请输入真实姓名");
                return;
            }
            var phone = this.createEditBox3.string;
            if(phone == ""){
                cc.vv.prefabMgr.alertOpen(this.node,"提示","请输入手机号码");
                return;
            }
            var wechatId = this.createEditBox4.string;
            if(wechatId == ""){
                cc.vv.prefabMgr.alertOpen(this.node,"提示","请输入微信号");
                return;
            }

            var reg = new RegExp(/[\u4e00-\u9fa5a-zA-Z0-9]{3,8}/);
            var ret1 = reg.test(unionName);
            if(ret1 == false){
                cc.vv.prefabMgr.alertOpen(this.node,"提示","公会名称输入格式有误，请重新输入");
                this.createEditBox1.string = "";
                return;
            }
            reg = new RegExp(/[\u4e00-\u9fa5]{2,6}/);
            ret1 = reg.test(name);
            if(ret1 == false){
                cc.vv.prefabMgr.alertOpen(this.node,"提示","请输入真实姓名，将更容易通过审核");
                this.createEditBox2.string = "";
                return;
            }
            reg = new RegExp(/^1[3|4|5|7|8][0-9]{9}$/);
            ret1 = reg.test(phone);
            if(ret1 == false){
                cc.vv.prefabMgr.alertOpen(this.node,"提示","请输入正确的手机号码");
                this.createEditBox3.string = "";
                return;
            }
            reg = new RegExp(/[-_a-zA-Z0-9]{5,19}$/);
            ret1 = reg.test(wechatId);
            if(ret1 == false){
                cc.vv.prefabMgr.alertOpen(this.node,"提示","请输入正确的微信号");
                this.createEditBox4.string = "";
                return;
            }
            
            unionName = cc.vv.utils.toBase64(unionName);
            name = cc.vv.utils.toBase64(name);
            var self = this;
            cc.vv.netMgr.setHandler(cc.vv.netMgr.resp.create_union_resp,function(ret){
                if(ret.errcode == 420){ 
                    cc.vv.prefabMgr.alertOpen(self.node,"提示","请勿重复申请，请耐心等待审核",function(){
                        cc.vv.prefabMgr.layoutClose();
                    });
                }
                if(ret.errcode == null){             
                    cc.vv.prefabMgr.alertOpen(self.node,"提示","创建申请已提交，请等待审核",function(){
                        cc.vv.prefabMgr.layoutClose();
                    });
                }
            });
            cc.vv.netMgr.doSend1(cc.vv.netMgr.req.create_union,{unionName:unionName,name:name,phone:phone,wechatId:wechatId}); 
        }
        if(event.target.name == "join"){
            var name = this.joinEditBox.string;
            var reg = new RegExp(/^[1-9]\d{3,7}$/);
            if(reg.test(name)){
                var unionId = parseInt(name);
                /*cc.vv.prefabMgr.alertOpen(this.node,"提示","加入申请已提交，请等待审核",function(){
                    cc.vv.prefabMgr.layoutClose();
                });*/
                cc.vv.prefabMgr.layoutClose();
                cc.vv.netMgr.doSend1(cc.vv.netMgr.req.join_union,unionId);
            }
            else{
                cc.vv.prefabMgr.alertOpen(this.node,"提示","输入格式错误，请重新输入");
                console.log("输入格式错误，请重新输入");
                this.joinEditBox.string = "";
            }
        }
    },
    onBtnClose:function(){
        cc.vv.prefabMgr.layoutClose();
    },

});
