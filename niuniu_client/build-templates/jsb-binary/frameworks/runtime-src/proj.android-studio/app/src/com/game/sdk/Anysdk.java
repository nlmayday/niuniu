package com.game.sdk;

import org.cocos2dx.lib.Cocos2dxJavascriptJavaBridge;
import org.cocos2dx.lib.Cocos2dxHelper;

import android.util.Log;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;

import android.content.ClipboardManager;
import android.content.ClipData;

import org.cocos2dx.javascript.AppActivity;

public class  Anysdk {
	public static void Init(){
	}
	public static void getGPS(){
		try{
			LocationManager locationManager = AppActivity.getLocationManager();
			LocationListener locationListener = new LocationListener() {
				@Override
				public void onStatusChanged(String provider, int status,
											Bundle extras) {

				}
				@Override
				public void onProviderEnabled(String provider) {

				}
				@Override
				public void onProviderDisabled(String provider) {

				}
				@Override
				public void onLocationChanged(Location location) {
					if (location != null) {
						final double latitude = location.getLatitude();
						final double longitude = location.getLongitude();
						Log.e("Map","Location changed : Lat: " + latitude + " Lng: " + longitude);
						//locationManager.removeUpdates(this);
						Cocos2dxHelper.runOnGLThread(new Runnable() {
							double lat = latitude;
							double lon = longitude;
							@Override
							public void run() {
								Cocos2dxJavascriptJavaBridge.evalString("cc.vv.anysdkMgr.onGPSResp('" + lat + "," + lon + "')");
							}
						});
					}
				}
			};
			//LocationProvider gpsProvider = locationManager.getProvider(LocationManager.GPS_PROVIDER);
			//LocationProvider netProvider = locationManager.getProvider(LocationManager.NETWORK_PROVIDER);
			Location location = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
			if (location != null) {
				final double latitude = location.getLatitude();
				final double longitude = location.getLongitude();
				Log.e("Map","Location changed : Lat: " + latitude + " Lng: " + longitude);
				Cocos2dxHelper.runOnGLThread(new Runnable() {
					double lat = latitude;
					double lon = longitude;
					@Override
					public void run() {
						Cocos2dxJavascriptJavaBridge.evalString("cc.vv.anysdkMgr.onGPSResp('" + lat + "," + lon + "')");
					}
				});
				return;
			}

			if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER) || locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
				locationManager.requestLocationUpdates(
						LocationManager.NETWORK_PROVIDER, 10000, 0, locationListener);
			}
			else{
				Cocos2dxHelper.runOnGLThread(new Runnable() {
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
		WXAPI.login();
	}
	public static void share(String url,String title,String desc,int type){
		WXAPI.share(url,title,desc,type);
	}

	public static void shareIMG(String path,int type){
		WXAPI.shareIMG(path,type);
	}

	public static void copyText(String text){
		//获取剪贴板管理器：
		ClipboardManager cm = AppActivity.getClipboardManager();
		// 创建普通字符型ClipData
		ClipData mClipData = ClipData.newPlainText("Label", text);
		// 将ClipData内容放到系统剪贴板里。
		cm.setPrimaryClip(mClipData);
	}

	// 游戏更新
	public static void updateGame(String updateurl,String appName) {
		final String updateurl2 = updateurl;
		final String appName2 = appName;
		AppActivity.getActivity().runOnUiThread(new Runnable() {
			@Override
			public void run() {
				AppInnerDownLoder.downLoadApk(AppActivity.getActivity(), updateurl2, appName2);
			}
		});
	}

}