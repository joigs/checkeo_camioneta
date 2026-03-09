import { registerRootComponent } from "expo";
import App from "./App";
import messaging from "@react-native-firebase/messaging";
import './src/notifications/setup';
messaging().setBackgroundMessageHandler(async (remoteMessage) => {

});

registerRootComponent(App);
