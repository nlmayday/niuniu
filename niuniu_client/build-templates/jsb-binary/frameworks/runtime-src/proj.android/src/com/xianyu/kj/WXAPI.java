package com.xianyu.kj;

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

public class WXAPI {
	public static IWXAPI api;
	public static Activity instance;
	public static boolean isLogin = false;
	public static boolean isShare = false;
	public static void Init(Activity context){
		WXAPI.instance = context;
        // ͨ��WXAPIFactory��������ȡIWXAPI��ʵ��
		api = WXAPIFactory.createWXAPI(context, Constants.APP_ID, true);
        api.registerApp(Constants.APP_ID);
        context.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        
	}
	
	private static String buildTransaction(final String type) {
	    return (type == null) ? String.valueOf(System.currentTimeMillis()) : type + System.currentTimeMillis();
	}
	
	public static void Login(){
		Log.e("WXAPI","public static void Login();  end");
		isLogin = true;
		isShare = false;
		final SendAuth.Req req = new SendAuth.Req();
		req.scope = "snsapi_userinfo";
		req.state = "carjob_wx_login";
		api.sendReq(req);
		Log.e("WXAPI","public static void Login();  end");
		//instance.finish();
	}
	public static void Share(String url,String title,String desc){
			Log.e("cocos2d","java share start" );
			WXWebpageObject webpage = new WXWebpageObject();
			webpage.webpageUrl = url;
			WXMediaMessage msg = new WXMediaMessage(webpage);
			msg.title = title;
			msg.description = desc;
			/*Bitmap shareBitmap = BitmapFactory.decodeResource(instance.getResources(),R.drawable.share);
			msg.thumbData = Util.bmpToByteArray(shareBitmap, true);*/
			
			SendMessageToWX.Req req = new SendMessageToWX.Req();
			req.transaction = buildTransaction("webpage");
			req.message = msg;
			req.scene = SendMessageToWX.Req.WXSceneSession;
			api.sendReq(req);
			Log.e("cocos2d","java share end" );
			//instance.finish();
	}
	public static void ShareUrl(String url,String title,String desc){
			isShare = true;
			isLogin = false;
			Log.e("cocos2d","java share start" );
			WXWebpageObject webpage = new WXWebpageObject();
			webpage.webpageUrl = url;
			WXMediaMessage msg = new WXMediaMessage(webpage);
			msg.title = title;
			msg.description = desc;
			/*Bitmap shareBitmap = BitmapFactory.decodeResource(instance.getResources(),R.drawable.share);
			msg.thumbData = Util.bmpToByteArray(shareBitmap, true);*/
			
			SendMessageToWX.Req req = new SendMessageToWX.Req();
			req.transaction = buildTransaction("webpage");
			req.message = msg;
			req.scene = SendMessageToWX.Req.WXSceneTimeline;
			api.sendReq(req);
			Log.e("cocos2d","java share end" );
			//instance.finish();
	}

	public static void ShareIMG(String path,int width,int height){
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
              
			/*Bitmap shareBitmap = BitmapFactory.decodeResource(instance.getResources(),R.drawable.share);
            msg.thumbData = Util.bmpToByteArray(shareBitmap, true);*/
            bmp.recycle();  
			
			SendMessageToWX.Req req = new SendMessageToWX.Req();
			req.transaction = buildTransaction("img");
			req.message = msg;
			req.scene = SendMessageToWX.Req.WXSceneTimeline;
			Log.e("ShareIMG","end............................." );
			api.sendReq(req);	
	}
}
