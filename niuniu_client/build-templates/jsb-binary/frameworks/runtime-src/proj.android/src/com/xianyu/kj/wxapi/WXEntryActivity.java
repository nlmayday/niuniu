package com.xianyu.kj.wxapi;

import org.cocos2dx.javascript.AppActivity;
import org.cocos2dx.lib.Cocos2dxJavascriptJavaBridge;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import org.cocos2dx.lib.Cocos2dxGLSurfaceView;

import com.tencent.mm.sdk.openapi.BaseReq;
import com.tencent.mm.sdk.openapi.BaseResp;
import com.tencent.mm.sdk.openapi.IWXAPI;
import com.tencent.mm.sdk.openapi.IWXAPIEventHandler;
import com.tencent.mm.sdk.openapi.SendAuth;
import com.tencent.mm.sdk.openapi.WXAPIFactory;
import com.xianyu.kj.Constants;
import com.xianyu.kj.WXAPI;

public class WXEntryActivity extends Activity implements IWXAPIEventHandler{
	
	// IWXAPI 锟角碉拷锟斤拷锟斤拷app锟斤拷微锟斤拷通锟脚碉拷openapi锟接匡拷
    private IWXAPI _api;
	
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        //setContentView(R.layout.plugin_entry);
    	
		Log.d(Constants.TAG, "WXEntryActivity onCreate" );
		
		_api = WXAPIFactory.createWXAPI(this, Constants.APP_ID, false);  
        _api.handleIntent(getIntent(), this);
    }

	@Override
	protected void onNewIntent(Intent intent) {
		super.onNewIntent(intent);
		
		setIntent(intent);
        _api.handleIntent(intent, this);
	}

	// 微锟脚凤拷锟斤拷锟斤拷锟襟到碉拷锟斤拷锟斤拷应锟斤拷时锟斤拷锟斤拷氐锟斤拷锟斤拷梅锟斤拷锟�
	@Override
	public void onReq(BaseReq req) {
		/*
		switch (req.getType()) {
		case ConstantsAPI.COMMAND_GETMESSAGE_FROM_WX:
			//goToGetMsg();		
			break;
		case ConstantsAPI.COMMAND_SHOWMESSAGE_FROM_WX:
			//goToShowMsg((ShowMessageFromWX.Req) req);
			break;
		default:
			break;
		}
		*/
		Log.d(Constants.TAG, "WXEntryActivity.onReq onReq]" );
		this.finish();
	}

	// 锟斤拷锟斤拷锟斤拷应锟矫凤拷锟酵碉拷微锟脚碉拷锟斤拷锟斤拷锟斤拷锟斤拷锟斤拷应锟斤拷锟斤拷锟斤拷锟截碉拷锟斤拷锟矫凤拷锟斤拷
	@Override
	public void onResp(BaseResp resp) {
		int result = 0;
		Log.d(Constants.TAG, "WXEntryActivity.onResp resp.errCode[" + resp.errCode + "]" );
		
		switch (resp.errCode) {
		case BaseResp.ErrCode.ERR_OK:
		{
			if(WXAPI.isLogin){
				WXAPI.isLogin = false;
				final SendAuth.Resp authResp = (SendAuth.Resp)resp;
				if(authResp != null && authResp.token != null){
					Log.d(Constants.TAG, "WXEntryActivity.onResp login success" );
					AppActivity.getActivity().runOnGLThread(new Runnable() {
						@Override
						public void run() {
							Log.d(Constants.TAG, "WXEntryActivity.onResp login 1" );
							Cocos2dxJavascriptJavaBridge.evalString("cc.vv.anysdkMgr.onLoginResp('"+ authResp.token +"')");
						}
					});
					
				}	
				/*
				final SendAuth.Resp authResp = (SendAuth.Resp)resp;
				if(authResp != null && authResp.token != null){
					//AppActivity.getActivity().runOnGLThread(new Runnable() {
					org.cocos2dx.lib.Cocos2dxGLSurfaceView.getInstance().queueEvent(new Runnable(){
						@Override
						public void run() {
							Cocos2dxJavascriptJavaBridge.evalString("cc.vv.anysdkMgr.onLoginResp('"+ authResp.token +"')");
						}
					});
				}*/				
			}
			if(WXAPI.isShare){
				WXAPI.isShare = false;
				Log.d(Constants.TAG, "WXEntryActivity.onResp share success" );
				AppActivity.getActivity().runOnGLThread(new Runnable() {
					@Override
					public void run() {
						Log.d(Constants.TAG, "WXEntryActivity.onResp share 1" );
						Cocos2dxJavascriptJavaBridge.evalString("cc.vv.anysdkMgr.onShareResp()");
					}
					});
				
				/*
				org.cocos2dx.lib.Cocos2dxGLSurfaceView.getInstance().queueEvent(new Runnable(){
				//AppActivity.getActivity().runOnGLThread(new Runnable() {
					@Override
					public void run() {
						Cocos2dxJavascriptJavaBridge.evalString("cc.vv.anysdkMgr.onShareResp('"+ 0 +"')");
					}
				});
				*/
			}
		}
		break;
		case BaseResp.ErrCode.ERR_USER_CANCEL:
		{
			Log.d(Constants.TAG, "WXEntryActivity.onResp ERR_USER_CANCEL" );
			result = 2;//R.string.errcode_cancel;
			break;
		}
		case BaseResp.ErrCode.ERR_AUTH_DENIED:
		{
			Log.d(Constants.TAG, "WXEntryActivity.onResp ERR_AUTH_DENIED" );
			result = 3;//R.string.errcode_deny;
			break;
		}
		default:
		{
			Log.d(Constants.TAG, "WXEntryActivity.onResp errcode_unknown" );
			result = 4;//R.string.errcode_unknown;
			break;
		}
		
	}
		this.finish();
		//Toast.makeText(this, result, Toast.LENGTH_LONG).show();
	}
}