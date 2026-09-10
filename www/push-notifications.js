import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getDatabase,
  ref,
  set
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAa5E1EbFA7ljnoX5WmKpLcUXeNhFzYD54",
  authDomain: "schoolannouncements-5f68b.firebaseapp.com",
  databaseURL: "https://schoolannouncements-5f68b-default-rtdb.firebaseio.com",
  projectId: "schoolannouncements-5f68b"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function saveFcmToken(token) {
  const tokenId = token.replace(/[.#$\[\]]/g, "_");

  await set(ref(database, "deviceTokens/" + tokenId), {
    token: token,
    updatedAt: new Date().toISOString(),
    platform: "android"
  });
}

async function setupPushNotifications() {
  try {
    if (!window.Capacitor) {
      console.warn("Not running in the Android Capacitor app.");
      return;
    }

    const PushNotifications = window.Capacitor.Plugins.PushNotifications;

    if (!PushNotifications) {
      console.error("Push Notifications plugin is unavailable.");
      return;
    }

    const permission = await PushNotifications.requestPermissions();

    if (permission.receive !== "granted") {
      console.warn("Notification permission was not granted.");
      return;
    }

    await PushNotifications.addListener("registration", async function (token) {
      console.log("FCM token:", token.value);

      try {
        await saveFcmToken(token.value);
        console.log("FCM token saved.");
      } catch (error) {
        console.error("Could not save FCM token:", error);
      }
    });

    await PushNotifications.addListener("registrationError", function (error) {
      console.error("FCM registration failed:", error);
    });

    await PushNotifications.addListener("pushNotificationReceived", function (notification) {
      console.log("Push received while app is open:", notification);
    });

    await PushNotifications.addListener("pushNotificationActionPerformed", function (action) {
      console.log("Notification tapped:", action);
    });

    await PushNotifications.register();
  } catch (error) {
    console.error("Push setup failed:", error);
  }
}

window.addEventListener("load", setupPushNotifications);
