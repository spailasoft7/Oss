import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig={apiKey:"AIzaSyAa5E1EbFA7ljnoX5WmKpLcUXeNhFzYD54",authDomain:"schoolannouncements-5f68b.firebaseapp.com",databaseURL:"https://schoolannouncements-5f68b-default-rtdb.firebaseio.com",projectId:"schoolannouncements-5f68b"};
const app=initializeApp(firebaseConfig);
const db=getDatabase(app);
const newsDiv=document.getElementById("news");
const filter=document.getElementById("filter");

function loadFromLocal(){const stored=localStorage.getItem("announcements_backup");if(!stored)return[];try{return JSON.parse(stored);}catch{return[];}}
function saveToLocal(data){localStorage.setItem("announcements_backup",JSON.stringify(data));}

function renderAnnouncements(list){
  const selected=filter.value;
  newsDiv.innerHTML="";
  list.forEach((a,index)=>{
    if(selected==="All"||a.grade==="All"||a.grade===selected){
      const card=document.createElement("div");
      card.className="announcement-card";
      const title=document.createElement("div");title.className="announcement-title";title.textContent=a.title;
      const grade=document.createElement("div");grade.className="announcement-grade";grade.textContent=a.grade;
      title.style.cursor = "pointer";

title.onclick = () => {
    document.getElementById("readMoreTitle").textContent = a.title;
    document.getElementById("readMoreMessage").textContent = a.message;
    document.getElementById("readMoreModal").style.display = "block";
};

const readMoreModal = document.getElementById("readMoreModal");
const closeReadMore = document.getElementById("closeReadMore");

closeReadMore.onclick = () => readMoreModal.style.display = "none";
window.onclick = (e) => { 
  if(e.target == readMoreModal) readMoreModal.style.display = "none"; 
};
      const date=document.createElement("div");date.className="announcement-date";date.textContent=new Date(a.date).toLocaleString();
      card.append(title,grade,date);
      newsDiv.appendChild(card);
    }
  });
}

function loadAnnouncements(){
  const localData=loadFromLocal();
  if(localData.length>0) renderAnnouncements(localData);
  onValue(ref(db,"announcements"),snapshot=>{
    const data=snapshot.val();
    if(!data){newsDiv.innerHTML="No announcements yet.";return;}
    const list=Object.values(data).sort((a,b)=>b.date-a.date);
    saveToLocal(list);
    renderAnnouncements(list);
  });
}

filter.addEventListener("change",()=>{renderAnnouncements(loadFromLocal());});
loadAnnouncements();