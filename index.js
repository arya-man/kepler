/**
 * @format
 */

import {AppRegistry} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import ReactNativeForegroundService from '@supersami/rn-foreground-service';
import App from './App';
import {name as appName} from './app.json';

ReactNativeForegroundService.register();

messaging().setBackgroundMessageHandler(async remoteMessage => {});

AppRegistry.registerComponent(appName, () => App);
