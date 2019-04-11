package com.renheniuniu.android.wxapi;

import org.cocos2dx.javascript.AppActivity;
import org.cocos2dx.lib.Cocos2dxHelper;
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
import com.game.sdk.Constants;
import com.game.sdk.WXAPI;

public class WXEntryActivity extends Activity implements IWXAPIEventHandler{

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

	@Override
	public void onReq(BaseReq req) {
		Log.d(Constants.TAG, "WXEntryActivity.onReq onReq]" );
		this.finish();
	}

	@Override
	public void onResp(BaseResp resp) {
		int result = 0;
		
		switch (resp.errCode) {
		case BaseResp.ErrCode.ERR_OK:
		{
			if(WXAPI.isLogin){
				WXAPI.isLogin = false;
				final SendAuth.Resp authResp = (SendAuth.Resp)resp;
				if(authResp != null && authResp.token != null){
					Log.d(Constants.TAG, "WXEntryActivity.onResp login success" );
					Cocos2dxHelper.runOnGLThread(new Runnable() {
						@Override
						public void run() {
							Cocos2dxJavascriptJavaBridge.evalString("cc.vv.anysdkMgr.onLoginResp('"+ authResp.token +"')");
						}
					});
					
				}				
			}
			else if(WXAPI.isShare){
				WXAPI.isShare = false;
				Log.d(Constants.TAG, "WXEntryActivity.onResp share success" );
				Cocos2dxHelper.runOnGLThread(new Runnable() {
					@Override
					public void run() {
						Cocos2dxJavascriptJavaBridge.evalString("cc.vv.anysdkMgr.onShareResp()");
					}
				});
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