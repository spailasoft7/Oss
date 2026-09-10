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

window.addEventListener("load", async () => {
  const box = document.createElement("div");
  box.style.cssText =
    "position:fixed;bottom:0;left:0;right:0;background:#000;color:#0f0;padding:8px;font-size:13px;z-index:999999";
  document.body.appendChild(box);

  const show = (message) => {
    box.textContent = message;
    console.log(message);
  };

  try {
    show("START");

    if (!window.Capacitor) {
      show("NO_CAPACITOR");
      return;
    }

    show("CAPACITOR_OK");

    const PushNotifications =
      window.Capacitor.Plugins?.PushNotifications;

    if (!PushNotifications) {
      show("NO_PUSH_PLUGIN");
      return;
    }

    show("PUSH_PLUGIN_OK");

    const permission = await PushNotifications.requestPermissions();
    show(`PERM:${permission.receive || "unknown"}`);

    if (permission.receive !== "granted") return;

    await PushNotifications.addListener("registration", (token) => {
      show(`TOKEN:${token.value}`);
    });

    await PushNotifications.addListener("registrationError", (error) => {
      show(`REG_ERR:${error.message || JSON.stringify(error)}`);
    });

    await PushNotifications.register();
    show("REGISTER_CALLED");
  } catch (error) {
    show(`INIT_ERR:${error.message || JSON.stringify(error)}`);
  }
});
