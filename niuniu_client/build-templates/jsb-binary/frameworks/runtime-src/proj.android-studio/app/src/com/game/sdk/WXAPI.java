package com.game.sdk;

import java.io.File;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.view.WindowManager;
import android.util.Log;
import com.tencent.mm.sdk.openapi.IWXAPI;
import com.tencent.mm.sdk.openapi.SendAuth;
import com.tencent.mm.sdk.openapi.SendMessageToWX;
import com.tencent.mm.sdk.openapi.WXAPIFactory;
import com.tencent.mm.sdk.openapi.WXImageObject;
import com.tencent.mm.sdk.openapi.WXMediaMessage;
import com.tencent.mm.sdk.openapi.WXWebpageObject;

import com.renheniuniu.android.R;

public class WXAPI {
	public static IWXAPI api;
	public static Activity instance;
	public static boolean isLogin = false;
	public static boolean isShare = false;
	public static void Init(Activity context){
		WXAPI.instance = context;
		api = WXAPIFactory.createWXAPI(context, Constants.APP_ID, true);
        api.registerApp(Constants.APP_ID);
        context.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        
	}
	
	private static String buildTransaction(final String type) {
	    return (type == null) ? String.valueOf(System.currentTimeMillis()) : type + System.currentTimeMillis();
	}
	
	public static void login(){
		Log.e("WXAPI","public static void Login();  end");
		isLogin = true;
		isShare = false;
		final SendAuth.Req req = new SendAuth.Req();
		req.scope = "snsapi_userinfo";
		req.state = "carjob_wx_login";
		api.sendReq(req);
		Log.e("WXAPI","public static void Login();  end");
	}
	public static void share(String url,String title,String desc,int type){
		Log.e("cocos2d","java share start" );
		WXWebpageObject webpage = new WXWebpageObject();
		webpage.webpageUrl = url;
		WXMediaMessage msg = new WXMediaMessage(webpage);
		msg.title = title;
		msg.description = desc;
		Bitmap shareBitmap = BitmapFactory.decodeResource(instance.getResources(),R.drawable.share);
		msg.thumbData = Util.bmpToByteArray(shareBitmap, 32);
		
		SendMessageToWX.Req req = new SendMessageToWX.Req();
		req.transaction = buildTransaction("webpage");
		req.message = msg;
		if(type == 1){
			req.scene = SendMessageToWX.Req.WXSceneSession;
		}
		else{
			req.scene = SendMessageToWX.Req.WXSceneTimeline;
		}
		api.sendReq(req);
		Log.e("cocos2d","java share end" );
	}

	public static void shareIMG(String path,int type){
		Log.e("ShareIMG","path："+path );
		File file = new File(path);
		if (!file.exists()) {
			Log.e("ShareIMG","!file.exists()" );
			return;
		}
		
		Bitmap bmp = BitmapFactory.decodeFile(path);
		WXImageObject imgObj = new WXImageObject(bmp);
		//imgObj.setImagePath(path);
		
		WXMediaMessage msg = new WXMediaMessage();
		msg.mediaObject = imgObj;  
		  
		Bitmap shareBitmap = BitmapFactory.decodeResource(instance.getResources(),R.drawable.share);
		msg.thumbData = Util.bmpToByteArray(shareBitmap, 32);
		bmp.recycle();  
		
		SendMessageToWX.Req req = new SendMessageToWX.Req();
		req.transaction = buildTransaction("img");
		req.message = msg;
		if(type == 1){
			req.scene = SendMessageToWX.Req.WXSceneSession;
		}
		else{
			req.scene = SendMessageToWX.Req.WXSceneTimeline;
		}
		//req.scene = SendMessageToWX.Req.WXSceneTimeline;
		Log.e("ShareIMG","end............................." );
		api.sendReq(req);
	}
}
