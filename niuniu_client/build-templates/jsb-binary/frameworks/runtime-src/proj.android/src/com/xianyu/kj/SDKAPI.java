package com.xianyu.kj;

import java.io.File;
import org.cocos2dx.lib.Cocos2dxJavascriptJavaBridge;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.view.WindowManager;
import android.util.Log;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.content.Context;
import android.content.Intent;

import org.cocos2dx.javascript.AppActivity;
import com.xianyu.kj.WXAPI;

public class  SDKAPI {

	public final static int MESSAGE_PURCHASE 				= 0x101;
	private static Handler mHandler;

	public static void getGPS(){
		try{
			LocationManager locationManager = AppActivity.getLocationManager();
			LocationListener locationListener = new LocationListener() {
				// Provider鐨勭姸鎬佸湪鍙敤銆佹殏鏃朵笉鍙敤鍜屾棤鏈嶅姟涓変釜鐘舵�佺洿鎺ュ垏鎹㈡椂瑙﹀彂姝ゅ嚱鏁�
				@Override
				public void onStatusChanged(String provider, int status,
						Bundle extras) {

				}

				// Provider琚玡nable鏃惰Е鍙戞鍑芥暟锛屾瘮濡侴PS琚墦寮�
				@Override
				public void onProviderEnabled(String provider) {

				}

				// Provider琚玠isable鏃惰Е鍙戞鍑芥暟锛屾瘮濡侴PS琚叧闂�
				@Override
				public void onProviderDisabled(String provider) {

				}

				// 褰撳潗鏍囨敼鍙樻椂瑙﹀彂姝ゅ嚱鏁帮紝濡傛灉Provider浼犺繘鐩稿悓鐨勫潗鏍囷紝瀹冨氨涓嶄細琚Е鍙�
				@Override
				public void onLocationChanged(Location location) {
					if (location != null) {
						final double latitude = location.getLatitude(); // 缁忓害
						final double longitude = location.getLongitude(); // 绾害
						Log.e("Map","Location changed : Lat: " + latitude + " Lng: " + longitude);
						//locationManager.removeUpdates(this);
						AppActivity.getActivity().runOnGLThread(new Runnable() {
							double lat = latitude; // 缁忓害
							double lon = longitude; // 绾害
							@Override
							public void run() {
								Cocos2dxJavascriptJavaBridge.evalString("cc.vv.anysdkMgr.onGPSResp('" + lat + "," + lon + "')");
							}
						});
					}
				}
			};
			//LocationProvider gpsProvider = locationManager.getProvider(LocationManager.GPS_PROVIDER);//1.閫氳繃GPS瀹氫綅锛岃緝绮剧‘锛屼篃姣旇緝鑰楃數  
			//LocationProvider netProvider = locationManager.getProvider(LocationManager.NETWORK_PROVIDER);//2.閫氳繃缃戠粶瀹氫綅锛屽瀹氫綅绮惧害搴︿笉楂�
			Location location = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
			if (location != null) {
				final double latitude = location.getLatitude(); // 缁忓害
				final double longitude = location.getLongitude(); // 绾害
				Log.e("Map","Location changed : Lat: " + latitude + " Lng: " + longitude);
				AppActivity.getActivity().runOnGLThread(new Runnable() {
					double lat = latitude; // 缁忓害
					double lon = longitude; // 绾害
					@Override
					public void run() {
						Cocos2dxJavascriptJavaBridge.evalString("cc.vv.anysdkMgr.onGPSResp('" + lat + "," + lon + "')");
					}
				});
				return;
			}
			
			if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER) || locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {  
				/* 
				* 杩涜瀹氫綅 
					* provider:鐢ㄤ簬瀹氫綅鐨刲ocationProvider瀛楃涓�:LocationManager.NETWORK_PROVIDER/LocationManager.GPS_PROVIDER 
				* minTime:鏃堕棿鏇存柊闂撮殧锛屽崟浣嶏細ms 
					* minDistance:浣嶇疆鍒锋柊璺濈锛屽崟浣嶏細m 
				* listener:鐢ㄤ簬瀹氫綅鏇存柊鐨勭洃鍚�卨ocationListener 
				*/
				locationManager.requestLocationUpdates(
					LocationManager.NETWORK_PROVIDER, 10000, 0, locationListener);
			}
			else{
				AppActivity.getActivity().runOnGLThread(new Runnable() {
					@Override
					public void run() {
						Cocos2dxJavascriptJavaBridge.evalString("cc.vv.anysdkMgr.onGPSResp()");
					}
				});
			}
		}
		catch(Exception e){
			e.printStackTrace();
		}
	}
	public static String getRoomId(){
		return AppActivity.getRoomId();
	}

	public static void login(){
		Log.e("WXAPI","WXAPI.Login();  start");
		WXAPI.Login();
		Log.e("WXAPI","WXAPI.Login();  end");
	}
	public static void share(String url,String title,String desc){
		WXAPI.Share(url,title,desc);
	}
	public static void shareUrl(String url,String title,String desc){
		WXAPI.ShareUrl(url,title,desc);
	}
	public static void shareIMG(String path,int width,int height){
		WXAPI.ShareIMG(path,width,height);
	}
	
}
