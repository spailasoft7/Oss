const firebaseConfig = {
  apiKey: "AIzaSyAa5E1EbFA7ljnoX5WmKpLcUXeNhFzYD54",
  authDomain: "schoolannouncements-5f68b.firebaseapp.com",
  databaseURL: "https://schoolannouncements-5f68b-default-rtdb.firebaseio.com",
  projectId: "schoolannouncements-5f68b"
};

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getDatabase,
  ref,
  onValue
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const newsDiv = document.getElementById("news");
let currentGrade = "All";

const upgradeStrip = document.getElementById("upgradeStrip");

if (localStorage.getItem("upgrade_strip_dismissed") === "1") {
  upgradeStrip.classList.add("hidden");
}

document.getElementById("closeStrip").onclick = () => {
  upgradeStrip.classList.add("hidden");
  localStorage.setItem("upgrade_strip_dismissed", "1");
};

const AVATAR_KEY = "oss_avatar_svg";
const SEED_KEY = "oss_avatar_seed";
const avatarImg = document.getElementById("avatarImg");

function randomSeed() {
  return "student-" + Math.random().toString(36).slice(2, 10);
}

async function loadAvatar(forceNew) {
  let seed = localStorage.getItem(SEED_KEY);

  if (!seed || forceNew) {
    seed = randomSeed();
    localStorage.setItem(SEED_KEY, seed);
    localStorage.removeItem(AVATAR_KEY);
  }

  const cached = localStorage.getItem(AVATAR_KEY);

  if (cached && !forceNew) {
    avatarImg.src = cached;
    return;
  }

  try {
    const res = await fetch(`https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}`);
    const svgText = await res.text();
    const dataUrl = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgText)));

    localStorage.setItem(AVATAR_KEY, dataUrl);
    avatarImg.src = dataUrl;
  } catch (e) {
    if (cached) {
      avatarImg.src = cached;
    }
  }
}

document.getElementById("avatarShuffle").onclick = () => loadAvatar(true);
loadAvatar(false);

const filterTrigger = document.getElementById("filterTrigger");
const filterSheet = document.getElementById("filterSheet");
const filterLabel = document.getElementById("filterLabel");
const chipRow = document.getElementById("chipRow");

filterTrigger.onclick = () => filterSheet.classList.add("open");

filterSheet.onclick = (e) => {
  if (e.target === filterSheet) {
    filterSheet.classList.remove("open");
  }
};

chipRow.querySelectorAll(".chip").forEach((chip) => {
  chip.onclick = () => {
    chipRow.querySelectorAll(".chip").forEach((c) => c.classList.remove("selected"));

    chip.classList.add("selected");
    currentGrade = chip.dataset.grade;

    filterLabel.textContent = currentGrade === "All" ? "All Grades" : "Grade " + currentGrade;
    filterTrigger.classList.toggle("active-filter", currentGrade !== "All");
    filterSheet.classList.remove("open");

    renderAnnouncements(loadFromLocal());
  };
});

function loadFromLocal() {
  const stored = localStorage.getItem("announcements_backup");
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveToLocal(data) {
  localStorage.setItem("announcements_backup", JSON.stringify(data));
}

function gradeClass(grade) {
  const g = String(grade).trim();

  if (g === "All") return "g-all";
  if (["9", "10", "11", "12"].includes(g)) {
    return "g-" + g;
  }

  return "";
}

function buildCard(a, isPinned) {
  const card = document.createElement("div");
  card.className = "announcement-card" + (isPinned ? " pinned" : "");

  if (isPinned) {
    const tag = document.createElement("div");
    tag.className = "pinned-tag";
    tag.textContent = "📌 PINNED";
    card.appendChild(tag);
  }

  const title = document.createElement("div");
  title.className = "announcement-title";
  title.textContent = a.title;

  const grade = document.createElement("div");
  grade.className = "announcement-grade " + gradeClass(a.grade);
  grade.textContent = a.grade;

  const message = document.createElement("div");
  message.className = "msg";

  const shortMsg = a.message.length > 120 ? a.message.substring(0, 120) + "..." : a.message;
  message.textContent = shortMsg;

  if (a.message.length > 120) {
    const readMore = document.createElement("span");
    readMore.className = "read-more";
    readMore.textContent = " Read more";

    readMore.onclick = () => {
      document.getElementById("readMoreTitle").textContent = a.title;
      document.getElementById("readMoreMessage").textContent = a.message;
      document.getElementById("readMoreModal").style.display = "block";
    };

    message.appendChild(readMore);
  }

  const date = document.createElement("div");
  date.className = "announcement-date";
  date.textContent = new Date(a.date).toLocaleString();

  card.append(title, grade, message, date);
  return card;
}

const readMoreModal = document.getElementById("readMoreModal");

document.getElementById("closeReadMore").onclick = () => {
  readMoreModal.style.display = "none";
};

window.addEventListener("click", (e) => {
  if (e.target === readMoreModal) {
    readMoreModal.style.display = "none";
  }
});

function renderAnnouncements(list) {
  newsDiv.innerHTML = "";

  const matches = (a) => currentGrade === "All" || a.grade === "All" || a.grade === currentGrade;
  const pinned = list.filter((a) => a.urgent && matches(a));
  const regular = list.filter((a) => !a.urgent && matches(a));

  if (pinned.length === 0 && regular.length === 0) {
    newsDiv.innerHTML = '<div class="empty-state">📌 Nothing pinned here yet — check back soon.</div>';
    return;
  }

  if (pinned.length) {
    const label = document.createElement("div");
    label.className = "section-label";
    label.textContent = "Pinned";
    newsDiv.appendChild(label);

    pinned.forEach((a) => newsDiv.appendChild(buildCard(a, true)));
  }

  if (regular.length) {
    if (pinned.length) {
      const label = document.createElement("div");
      label.className = "section-label";
      label.textContent = "All announcements";
      newsDiv.appendChild(label);
    }

    regular.forEach((a) => newsDiv.appendChild(buildCard(a, false)));
  }
}

function loadAnnouncements() {
  const localData = loadFromLocal();

  if (localData.length > 0) {
    renderAnnouncements(localData);
  }

  onValue(ref(db, "announcements"), (snapshot) => {
    const data = snapshot.val();

    if (!data) {
      newsDiv.innerHTML = '<div class="empty-state">📌 Nothing pinned here yet — check back soon.</div>';
      return;
    }

    const list = Object.values(data).sort((a, b) => b.date - a.date);
    saveToLocal(list);
    renderAnnouncements(list);
  });
}

loadAnnouncements();
