package com.keplr;

import android.content.Context;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.content.ContentResolver;
import android.os.Bundle;
import android.net.Uri;
import android.os.Build;
import android.content.Intent;
import android.util.Log;

import com.facebook.react.ReactActivity;
// import com.facebook.react.BuildConfig;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class MainActivity extends ReactActivity {

  public boolean isOnNewIntent = false;

  @Override
  protected void onCreate(Bundle savedInstanceState) {

    super.onCreate(savedInstanceState);

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          NotificationChannel notificationChannel = new NotificationChannel("all", "Keplr", NotificationManager.IMPORTANCE_HIGH);
          notificationChannel.setShowBadge(true);
          notificationChannel.setDescription("");
          AudioAttributes att = new AudioAttributes.Builder()
                  .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                  .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                  .build();
          notificationChannel.setSound(Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + getPackageName() + "/raw/notification"), att);
          notificationChannel.enableVibration(true);
          notificationChannel.setVibrationPattern(new long[]{400, 400});
          // notificationChannel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
          NotificationManager manager = getSystemService(NotificationManager.class);
          manager.createNotificationChannel(notificationChannel);
      }

  }

  @Override
  public void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    isOnNewIntent = true;
    ForegroundEmitter(intent);
  }

   @Override
  protected void onStart() {
    super.onStart();
    if(isOnNewIntent == true){}else {
      ForegroundEmitter(getIntent());
    }
  }


  public void ForegroundEmitter(Intent intent){
    // this method is to send back data from java to javascript so one can easily 
    // know which button from notification or from the notification btn is clicked

    String main = intent.getStringExtra("mainOnPress");
    String btn = intent.getStringExtra("buttonOnPress");
    WritableMap map = Arguments.createMap();

    if (main != null) {
      //  Log.d("SuperLog A", main);
      map.putString("main", main);
    }

    if (btn != null) {
      //  Log.d("SuperLog B", btn);
      map.putString("button", btn);
    }

    try {
      getReactInstanceManager().getCurrentReactContext()
              .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
              .emit("notificationClickHandle", map);

    } catch (Exception e) {
      // Log.e("SuperLog", "Caught Exception: " + e.getMessage());
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "keplr";
  }
}
