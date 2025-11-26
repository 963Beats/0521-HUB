// js/app.js — FINAL & FIXED — LOGIN + AUDIO HOVER + CLEAN PLAY ICON (November 2025)

const videoGrid      = document.getElementById("video-grid");
const sectionTitle   = document.getElementById("section-title");
const detailsModal   = document.getElementById("detailsModal");
const playerOverlay  = document.getElementById("playerOverlay");
const playerWrapper  = document.getElementById("player-wrapper");
const navbar         = document.getElementById("navbar");
const heroHeader     = document.querySelector(".hero-header");

let currentVideoId = "";
let currentUser = null;
let activePreview = null;

// ====================
// LOGIN & TIERS — FIXED
// ====================
const users = {
  "legend": { pass: "0521", tier: "legend", name: "LEGEND" },
  "member": { pass: "0521", tier: "member", name: "MEMBER" },
  "free":   { pass: "free",   tier: "free",   name: "FREE" }
};

const videoAccess = {
  "_HWkIietZyU": "legend",
  "oZEdTEb2Wz8": "legend",
  "ymjiqsGbD5k": "member",
  "ya7HkM-4Cj4": "free",
  "default": "member"
};

// THIS IS THE FIXED LOGIN FUNCTION
function handleLogin() {
  const username = document.getElementById("username").value.trim().toLowerCase();
  const password = document.getElementById("password").value;

  if (users[username] && users[username].pass === password) {
    currentUser = users[username];
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("mainApp").style.display = "block";
    document.getElementById("userTier").textContent = currentUser.name;
    renderCategory("docuchats");
    initHeroAudioHover();
    enableCardAudioPreviews();
  } else {
    alert("Wrong credentials\n\nTry: legend / 0521");
  }
}

function logout() {
  location.reload();
}

function canWatch(id) {
  if (!currentUser) return false;
  const req = videoAccess[id] || videoAccess.default;
  const lvl = { free:1, member:2, legend:3 };
  return lvl[currentUser.tier] >= lvl[req];
}

// ====================
// HERO HEADER — AUDIO ON HOVER
// ====================
function initHeroAudioHover() {
  const heroId = "_HWkIietZyU";
  let player = null;

  heroHeader.addEventListener("mouseenter", () => {
    if (player) return;
    player = document.createElement("div");
    player.innerHTML = `<iframe class="hero-trailer" src="https://www.youtube-nocookie.com/embed/${heroId}?autoplay=1&mute=0&controls=0&modestbranding=1&rel=0&loop=1&playlist=${heroId}" frameborder="0" allow="autoplay"></iframe>`;
    heroHeader.appendChild(player);
    heroHeader.querySelector(".hero-content").style.opacity = "0";
  });

  heroHeader.addEventListener("mouseleave", () => {
    if (player) { player.remove(); player = null; }
    heroHeader.querySelector(".hero-content").style.opacity = "1";
  });
}

// ====================
// CARD HOVER — AUDIO + CLEAN WHITE PLAY ICON
// ====================
function enableCardAudioPreviews() {
  videoGrid.addEventListener("mouseover", e => {
    const card = e.target.closest(".video-card");
    if (!card || activePreview === card || !canWatch(card.dataset.id)) return;

    if (activePreview) {
      const old = activePreview.querySelector(".card-preview");
      if (old) old.remove();
      activePreview.classList.remove("hovered");
    }

    const videoId = card.dataset.id;
    const preview = document.createElement("div");
    preview.className = "card-preview";
    preview.innerHTML = `
      <iframe src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=0&controls=0&modestbranding=1&rel=0&iv_load_policy=3" frameborder="0" allow="autoplay"></iframe>
      <div class="play-icon"></div>
    `;
    card.appendChild(preview);
    card.classList.add("hovered");
    activePreview = card;
  });

  videoGrid.addEventListener("mouseleave", () => {
    if (activePreview) {
      const prev = activePreview.querySelector(".card-preview");
      if (prev) prev.remove();
      activePreview.classList.remove("hovered");
      activePreview = null;
    }
  });
}

// ====================
// RENDER + MODAL + PLAYER
// ====================
function renderCategory(cat) {
  const category = VIDEO_DATABASE.find(c => c.category === cat);
  if (!category) return;
  sectionTitle.textContent = category.title;
  videoGrid.innerHTML = "";

  category.videos.forEach(v => {
    const card = document.createElement("div");
    card.className = "video-card";
    card.dataset.id = v.id;
    const unlocked = canWatch(v.id);

    card.innerHTML = `
      <div class="thumb ${unlocked ? '' : 'locked'}">
        <img src="${getThumb(v.id)}" loading="lazy">
        ${!unlocked ? '<div class="lock-overlay"><i class="fas fa-lock"></i><br>Premium Only</div>' : ''}
        <div class="video-duration">${v.duration}</div>
      </div>
      <div class="video-info">
        <div class="video-title">${v.title}</div>
        ${!unlocked ? '<small>Premium Only</small>' : ''}
      </div>
    `;

    if (unlocked) card.onclick = () => openVideoDetails(v.id, v.title, v.duration);
    else card.style.opacity = "0.6";

    videoGrid.appendChild(card);
  });
}

function openVideoDetails(id, title, duration) {
  currentVideoId = id;
  document.getElementById("modal-thumb").src = getThumb(id);
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-duration").textContent = duration;
  detailsModal.classList.add("active");
  document.getElementById("playBtn").onclick = playVideo;
  document.getElementById("playBigBtn").onclick = playVideo;
}

function playVideo() {
  closeDetails();
  playerWrapper.innerHTML = `
    <iframe src="https://www.youtube-nocookie.com/embed/${currentVideoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&fs=1"
            style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99999;border:none;background:black;"
            frameborder="0" allowfullscreen></iframe>
    <button onclick="closePlayer()" style="position:fixed;top:20px;right:20px;z-index:100000;background:rgba(0,0,0,0.8);color:white;border:none;padding:15px 25px;border-radius:50%;font-size:30px;cursor:pointer;">×</button>
  `;
  playerOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeDetails() { detailsModal.classList.remove("active"); }
function closePlayer() { playerOverlay.classList.remove("active"); playerWrapper.innerHTML = ""; document.body.style.overflow = ""; }
function getThumb(id) { return `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`; }

// ====================
// EVENTS
// ====================
window.addEventListener("scroll", () => navbar.classList.toggle("scrolled", window.scrollY > 120));
document.addEventListener("keydown", e => e.key === "Escape" && (detailsModal.classList.contains("active") ? closeDetails() : closePlayer()));
detailsModal.addEventListener("click", e => e.target === detailsModal && closeDetails());
playerOverlay.addEventListener("click", e => e.target === playerOverlay && closePlayer());

document.querySelectorAll(".sidebar-item, .nav-links a").forEach(el => {
  el.addEventListener("click", e => {
    e.preventDefault();
    document.querySelectorAll(".sidebar-item, .nav-links a").forEach(i => i.classList.remove("active"));
    el.classList.add("active");
    renderCategory(el.dataset.category);
  });
});