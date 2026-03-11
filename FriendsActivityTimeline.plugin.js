/**
 * @name FriendActivityTimeline
 * @author pagoni meow
 * @description A live floating feed of everything your friends do — games, status changes, voice channels, and streams.
 * @version 1.1.0
 */

module.exports = class FriendActivityTimeline {
  constructor() {
    this.events = [];
    this.maxEvents = 100;
    this.snapshots = new Map();
    this.pollTimer = null;
    this.POLL_MS = 5000;
    this.dragging = false;
    this.dragOffX = 0;
    this.dragOffY = 0;
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp   = this._onMouseUp.bind(this);
    this.settings = {
      x: null, y: null,
      opacity: 90,
      showGames: true, showStatus: true,
      showVoice: true, showStreams: true,
    };
  }

  getName()        { return "FriendActivityTimeline"; }
  getAuthor()      { return "pagoni meow"; }
  getVersion()     { return "1.1.0"; }
  getDescription() { return "Live floating feed of your friends activity."; }

  load() {
    try {
      const s = BdApi.Data.load("FriendActivityTimeline", "settings");
      if (s && typeof s === "object") Object.assign(this.settings, s);
    } catch (_) {
      try {
        const s = BdApi.getData("FriendActivityTimeline", "settings");
        if (s && typeof s === "object") Object.assign(this.settings, s);
      } catch (_) {}
    }
  }

  save() {
    try {
      BdApi.Data.save("FriendActivityTimeline", "settings", this.settings);
    } catch (_) {
      try { BdApi.saveData("FriendActivityTimeline", "settings", this.settings); } catch (_) {}
    }
  }

  start() {
    this.load();
    this.injectCSS();
    this.buildOverlay();
    this.addToggleBtn();
    this.startPolling();
  }

  stop() {
    this.stopPolling();
    document.removeEventListener("mousemove", this._onMouseMove);
    document.removeEventListener("mouseup",   this._onMouseUp);
    const overlay = document.getElementById("fat-overlay");
    if (overlay) overlay.remove();
    const btn = document.getElementById("fat-toggle");
    if (btn) btn.remove();
    try { BdApi.DOM.removeStyle("FriendActivityTimeline"); }
    catch (_) { try { BdApi.clearCSS("FriendActivityTimeline"); } catch (_) {} }
  }

  
  findModule(props) {
    try { return BdApi.Webpack.getModule(BdApi.Webpack.Filters.byProps(...props)); } catch (_) {}
    try { return BdApi.findModuleByProps(...props); } catch (_) {}
    return null;
  }

  getRelStore()   { return this.findModule(["getFriendIDs", "getRelationships"]); }
  getUserStore()  { return this.findModule(["getUser", "getCurrentUser"]); }
  getPresStore()  { return this.findModule(["getStatus", "getActivities"]); }
  getVoiceStore() { return this.findModule(["getVoiceStateForUser", "getVoiceStates"]); }

  
  startPolling() {
    this.poll();
    this.pollTimer = setInterval(() => this.poll(), this.POLL_MS);
  }

  stopPolling() {
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
  }

  poll() {
    try {
      const relStore   = this.getRelStore();
      const userStore  = this.getUserStore();
      const presStore  = this.getPresStore();
      const voiceStore = this.getVoiceStore();
      if (!relStore || !userStore || !presStore) return;

      const ids = (relStore.getFriendIDs && relStore.getFriendIDs()) ||
                  Object.keys(relStore.getRelationships ? relStore.getRelationships() : {})
                    .filter(id => relStore.getRelationships()[id] === 1);

      ids.forEach(id => {
        try {
          const user = userStore.getUser(id);
          if (!user) return;

          const name   = user.globalName || user.username || "Unknown";
          const avatar = user.avatar
            ? "https://cdn.discordapp.com/avatars/" + id + "/" + user.avatar + ".png?size=32"
            : "https://cdn.discordapp.com/embed/avatars/" + (Number(BigInt(id) % 5n)) + ".png";

          const prev       = this.snapshots.get(id) || {};
          const status     = presStore.getStatus ? presStore.getStatus(id) : null;
          const activities = presStore.getActivities ? presStore.getActivities(id) : [];
          const game       = activities.find(a => a.type === 0);
          const stream     = activities.find(a => a.type === 1);
          const vsRaw      = voiceStore && voiceStore.getVoiceStateForUser
                               ? voiceStore.getVoiceStateForUser(id) : null;
          const voiceCh    = vsRaw ? (vsRaw.channelId || vsRaw.channel_id || null) : null;
          const gameName   = game   ? (game.name   || null) : null;
          const streaming  = !!stream;

          if (this.settings.showStatus && status !== undefined && status !== prev.status && prev.status !== undefined) {
            this.push({ type: "status", name, avatar, status });
          }
          if (this.settings.showGames) {
            if (gameName && gameName !== prev.game) this.push({ type: "game_start", name, avatar, game: gameName });
            else if (!gameName && prev.game)        this.push({ type: "game_stop",  name, avatar, game: prev.game });
          }
          if (this.settings.showStreams) {
            if (streaming  && !prev.streaming) this.push({ type: "stream_start", name, avatar });
            if (!streaming &&  prev.streaming) this.push({ type: "stream_stop",  name, avatar });
          }
          if (this.settings.showVoice) {
            if (voiceCh  && voiceCh !== prev.voiceCh) this.push({ type: "voice_join",  name, avatar });
            if (!voiceCh && prev.voiceCh)              this.push({ type: "voice_leave", name, avatar });
          }

          this.snapshots.set(id, { status, game: gameName, streaming, voiceCh });
        } catch (_) {}
      });
    } catch (_) {}
  }

  push(ev) {
    ev.ts = Date.now();
    this.events.unshift(ev);
    if (this.events.length > this.maxEvents) this.events.pop();
    this.renderFeed();
    this.updateFooter();
  }

  
  label(e) {
    if (e.type === "status") {
      const m = { online: ["🟢","came online"], idle: ["🌙","went idle"], dnd: ["🔴","set DND"], offline: ["⚫","went offline"] };
      const s = m[e.status] || ["⚪", "changed status"];
      return s[0] + " " + s[1];
    }
    const m = {
      game_start:   "🎮 started playing " + e.game,
      game_stop:    "🎮 stopped playing " + e.game,
      stream_start: "📡 started streaming",
      stream_stop:  "📡 stopped streaming",
      voice_join:   "🔊 joined voice",
      voice_leave:  "🔇 left voice",
    };
    return m[e.type] || e.type;
  }

  timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60)   return s + "s";
    if (s < 3600) return Math.floor(s / 60) + "m";
    return Math.floor(s / 3600) + "h";
  }

  esc(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  renderFeed() {
    const feed = document.getElementById("fat-feed");
    if (!feed) return;
    if (!this.events.length) {
      feed.innerHTML = "<div class='fat-empty'>No activity yet<br><small>Waiting for friends\u2026</small></div>";
      return;
    }
    feed.innerHTML = this.events.slice(0, 40).map((e, i) =>
      "<div class='fat-row' style='animation-delay:" + (i * 0.025) + "s'>" +
        "<img class='fat-av' src='" + this.esc(e.avatar) + "' onerror=\"this.src='https://cdn.discordapp.com/embed/avatars/0.png'\">" +
        "<div class='fat-info'>" +
          "<span class='fat-name'>" + this.esc(e.name) + "</span>" +
          "<span class='fat-act'>"  + this.esc(this.label(e)) + "</span>" +
        "</div>" +
        "<span class='fat-time'>" + this.timeAgo(e.ts) + " ago</span>" +
      "</div>"
    ).join("");
  }

  updateFooter() {
    const el = document.getElementById("fat-count");
    if (el) el.textContent = this.events.length + " event" + (this.events.length !== 1 ? "s" : "");
    document.querySelectorAll(".fat-time").forEach((el, i) => {
      if (this.events[i]) el.textContent = this.timeAgo(this.events[i].ts) + " ago";
    });
  }

  
  buildOverlay() {
    const old = document.getElementById("fat-overlay");
    if (old) old.remove();

    const W = 300;
    const x = this.settings.x !== null ? this.settings.x : window.innerWidth  - W - 20;
    const y = this.settings.y !== null ? this.settings.y : Math.max(60, window.innerHeight - 440);

    const el = document.createElement("div");
    el.id = "fat-overlay";
    el.style.left    = x + "px";
    el.style.top     = y + "px";
    el.style.opacity = this.settings.opacity / 100;
    el.innerHTML =
      "<div id='fat-header'>" +
        "<div id='fat-title'><i id='fat-dot'></i>Friend Activity</div>" +
        "<div id='fat-btns'>" +
          "<button class='fat-btn' id='fat-min'>\u2212</button>" +
          "<button class='fat-btn' id='fat-clr'>\u2715</button>" +
        "</div>" +
      "</div>" +
      "<div id='fat-feed'><div class='fat-empty'>No activity yet<br><small>Waiting for friends\u2026</small></div></div>" +
      "<div id='fat-foot'><span id='fat-count'>0 events</span><span class='fat-live'>&#9679; live</span></div>";

    document.body.appendChild(el);

    el.querySelector("#fat-header").addEventListener("mousedown", ev => {
      if (ev.target.classList.contains("fat-btn")) return;
      this.dragging = true;
      const r = el.getBoundingClientRect();
      this.dragOffX = ev.clientX - r.left;
      this.dragOffY = ev.clientY - r.top;
      ev.preventDefault();
    });
    document.addEventListener("mousemove", this._onMouseMove);
    document.addEventListener("mouseup",   this._onMouseUp);

    el.querySelector("#fat-clr").addEventListener("click", () => {
      this.events = []; this.renderFeed(); this.updateFooter();
    });

    let collapsed = false;
    el.querySelector("#fat-min").addEventListener("click", () => {
      collapsed = !collapsed;
      document.getElementById("fat-feed").style.display = collapsed ? "none" : "";
      document.getElementById("fat-foot").style.display = collapsed ? "none" : "";
      el.querySelector("#fat-min").textContent = collapsed ? "\u25a1" : "\u2212";
    });

    setInterval(() => this.updateFooter(), 15000);
  }

  _onMouseMove(ev) {
    if (!this.dragging) return;
    const el = document.getElementById("fat-overlay");
    if (!el) return;
    const nx = Math.max(0, Math.min(window.innerWidth  - el.offsetWidth,  ev.clientX - this.dragOffX));
    const ny = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, ev.clientY - this.dragOffY));
    el.style.left = nx + "px";
    el.style.top  = ny + "px";
  }

  _onMouseUp() {
    if (!this.dragging) return;
    this.dragging = false;
    const el = document.getElementById("fat-overlay");
    if (!el) return;
    const r = el.getBoundingClientRect();
    this.settings.x = Math.round(r.left);
    this.settings.y = Math.round(r.top);
    this.save();
  }

  addToggleBtn() {
    const old = document.getElementById("fat-toggle");
    if (old) old.remove();
    const btn = document.createElement("div");
    btn.id = "fat-toggle";
    btn.title = "Friend Activity Timeline";
    btn.innerHTML = "<svg width='18' height='18' viewBox='0 0 24 24' fill='currentColor'><path d='M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z'/></svg>";
    btn.addEventListener("click", () => {
      const ov = document.getElementById("fat-overlay");
      if (!ov) { this.buildOverlay(); return; }
      ov.style.display = ov.style.display === "none" ? "" : "none";
    });
    const anchor =
      document.querySelector("[class*='panels-']")   ||
      document.querySelector("[class*='toolbar-']")  ||
      document.querySelector("[class*='guilds-']")   ||
      document.body;
    anchor.appendChild(btn);
  }

  
  injectCSS() {
    const css = [
      "#fat-overlay{position:fixed;width:300px;background:rgba(10,10,14,.94);border:1px solid rgba(255,255,255,.07);",
      "border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.75);z-index:9000;overflow:hidden;",
      "font-family:'gg sans','Noto Sans',sans-serif;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);}",

      "#fat-header{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;",
      "cursor:grab;background:rgba(255,255,255,.03);border-bottom:1px solid rgba(255,255,255,.06);}",
      "#fat-header:active{cursor:grabbing;}",

      "#fat-title{display:flex;align-items:center;gap:7px;font-size:11px;font-weight:700;",
      "text-transform:uppercase;letter-spacing:1.2px;color:rgba(255,255,255,.45);}",

      "#fat-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#3ba55d;",
      "box-shadow:0 0 7px #3ba55d;animation:fat-pulse 2s ease-in-out infinite;flex-shrink:0;}",
      "@keyframes fat-pulse{0%,100%{opacity:1}50%{opacity:.4}}",

      "#fat-btns{display:flex;gap:4px;}",
      ".fat-btn{background:rgba(255,255,255,.06);border:none;border-radius:4px;color:rgba(255,255,255,.4);",
      "cursor:pointer;width:22px;height:22px;font-size:12px;display:flex;align-items:center;",
      "justify-content:center;padding:0;transition:background .15s,color .15s;}",
      ".fat-btn:hover{background:rgba(255,255,255,.13);color:#fff;}",

      "#fat-feed{max-height:340px;overflow-y:auto;overflow-x:hidden;padding:5px 0;",
      "scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.08) transparent;}",
      "#fat-feed::-webkit-scrollbar{width:3px;}",
      "#fat-feed::-webkit-scrollbar-thumb{background:rgba(255,255,255,.09);border-radius:2px;}",

      ".fat-empty{padding:30px 16px;text-align:center;color:rgba(255,255,255,.18);font-size:12px;line-height:2;}",
      ".fat-empty small{font-size:11px;opacity:.7;}",

      ".fat-row{display:flex;align-items:center;gap:9px;padding:6px 12px;",
      "animation:fat-in .22s ease both;transition:background .1s;}",
      ".fat-row:hover{background:rgba(255,255,255,.04);}",
      "@keyframes fat-in{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:none}}",

      ".fat-av{width:28px;height:28px;border-radius:50%;object-fit:cover;flex-shrink:0;",
      "border:1px solid rgba(255,255,255,.08);}",

      ".fat-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;}",
      ".fat-name{font-size:12px;font-weight:700;color:rgba(255,255,255,.82);",
      "white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
      ".fat-act{font-size:11px;color:rgba(255,255,255,.36);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
      ".fat-time{font-size:10px;color:rgba(255,255,255,.18);white-space:nowrap;flex-shrink:0;}",

      "#fat-foot{display:flex;align-items:center;justify-content:space-between;padding:5px 12px;",
      "border-top:1px solid rgba(255,255,255,.05);background:rgba(255,255,255,.02);}",
      "#fat-count{font-size:10px;color:rgba(255,255,255,.18);}",
      ".fat-live{font-size:10px;color:rgba(59,165,93,.45);}",

      "#fat-toggle{position:fixed;bottom:68px;left:8px;width:34px;height:34px;",
      "background:rgba(10,10,14,.88);border:1px solid rgba(255,255,255,.09);border-radius:8px;",
      "display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:8999;",
      "color:rgba(255,255,255,.35);transition:all .15s;backdrop-filter:blur(8px);}",
      "#fat-toggle:hover{background:rgba(59,165,93,.18);color:#3ba55d;border-color:rgba(59,165,93,.35);}",
    ].join("");

    try { BdApi.DOM.addStyle("FriendActivityTimeline", css); }
    catch (_) { try { BdApi.injectCSS("FriendActivityTimeline", css); } catch (_) {} }
  }

  
  getSettingsPanel() {
    const wrap = document.createElement("div");
    wrap.style.cssText = "padding:16px;color:var(--text-normal);font-family:var(--font-primary);max-width:460px;";

    const sec = t => {
      const el = document.createElement("div");
      el.textContent = t;
      el.style.cssText = "font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;" +
        "color:#3ba55d;margin:16px 0 8px;border-bottom:1px solid rgba(59,165,93,.2);padding-bottom:4px;";
      wrap.appendChild(el);
    };

    const tog = (label, key) => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;";
      const lbl = document.createElement("span");
      lbl.textContent = label; lbl.style.fontSize = "14px";
      const btn = document.createElement("button");
      const refresh = () => { btn.textContent = this.settings[key] ? "ON" : "OFF"; btn.style.background = this.settings[key] ? "#3ba55d" : "#555"; };
      btn.style.cssText = "padding:4px 14px;border:none;border-radius:3px;cursor:pointer;font-weight:700;font-size:12px;color:#fff;";
      refresh();
      btn.addEventListener("click", () => { this.settings[key] = !this.settings[key]; this.save(); refresh(); });
      row.appendChild(lbl); row.appendChild(btn); wrap.appendChild(row);
    };

    sec("Activity Types");
    tog("Games played / stopped", "showGames");
    tog("Status changes", "showStatus");
    tog("Voice channel joins / leaves", "showVoice");
    tog("Streams started / stopped", "showStreams");

    sec("Display");
    const opRow = document.createElement("div");
    opRow.style.cssText = "display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;";
    const opLbl = document.createElement("span"); opLbl.textContent = "Opacity"; opLbl.style.fontSize = "14px";
    const opVal = document.createElement("span"); opVal.textContent = this.settings.opacity + "%";
    opVal.style.cssText = "font-size:12px;color:#3ba55d;min-width:36px;text-align:right;";
    const slider = document.createElement("input");
    slider.type = "range"; slider.min = 20; slider.max = 100; slider.value = this.settings.opacity;
    slider.style.cssText = "width:120px;accent-color:#3ba55d;";
    slider.addEventListener("input", () => {
      this.settings.opacity = parseInt(slider.value);
      opVal.textContent = this.settings.opacity + "%";
      const ov = document.getElementById("fat-overlay");
      if (ov) ov.style.opacity = this.settings.opacity / 100;
      this.save();
    });
    const opRight = document.createElement("div");
    opRight.style.cssText = "display:flex;align-items:center;gap:8px;";
    opRight.appendChild(slider); opRight.appendChild(opVal);
    opRow.appendChild(opLbl); opRow.appendChild(opRight); wrap.appendChild(opRow);

    const resetBtn = document.createElement("button");
    resetBtn.textContent = "Reset Position";
    resetBtn.style.cssText = "padding:7px 14px;background:rgba(255,255,255,.07);color:var(--text-normal);" +
      "border:1px solid rgba(255,255,255,.1);border-radius:4px;cursor:pointer;font-size:13px;margin-top:4px;";
    resetBtn.addEventListener("click", () => {
      this.settings.x = null; this.settings.y = null; this.save();
      const ov = document.getElementById("fat-overlay"); if (ov) ov.remove();
      this.buildOverlay();
      try { BdApi.UI.showToast("Position reset.", { type: "info" }); }
      catch (_) { try { BdApi.showToast("Position reset.", { type: "info" }); } catch (_) {} }
    });
    wrap.appendChild(resetBtn);
    return wrap;
  }
};
