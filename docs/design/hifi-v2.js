// Qarib Hi-Fi — all screen renderers in vanilla JS template literals

const svg = {
  search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  cog: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  back: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  more: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>',
  map: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3z"/><path d="M9 3v15"/><path d="M15 6v15"/></svg>',
  list: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>',
  pin: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 11.5 7.3 11.8a1 1 0 0 0 1.4 0C13 21.5 20 15.4 20 10a8 8 0 0 0-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>',
  gps: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="9"/><line x1="12" y1="2" y2="4" x2="12"/><line x1="12" y1="20" y2="22" x2="12"/><line x1="2" y1="12" y2="12" x2="4"/><line x1="20" y1="12" y2="12" x2="22"/></svg>',
  cal: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" y1="2" y2="6" x2="16"/><line x1="8" y1="2" y2="6" x2="8"/><line x1="3" y1="10" y2="10" x2="21"/></svg>',
  nav: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>',
  share: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" x2="15.4" y1="13.5" y2="17.5"/><line x1="15.4" x2="8.6" y1="6.5" y2="10.5"/></svg>',
  chev: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  phone: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  mosque: '🕌',
};

function Phone(content, opts={}){
  return `<div class="phone"><div class="screen">
    <div class="notch"></div>
    <div class="statusbar"><span>9:41</span><span class="icons">●●●● 5G ▮</span></div>
    ${content}
  </div></div>`;
}

function TopBarHome(){
  return `<div class="topbar">
    <div class="logo">Qarib</div>
    <div class="search-input">${svg.search}<span class="placeholder-text">Cari kajian, ustadz, masjid…</span></div>
    <button class="icon-btn">${svg.cog}</button>
  </div>`;
}
function BackBar(title, transparent){
  return `<div class="backbar ${transparent?'transparent':''}">
    <button class="icon-btn ghost">${svg.back}</button>
    <div class="title">${title||''}</div>
    <button class="icon-btn ghost">${svg.more}</button>
  </div>`;
}

function EventCard(e){
  return `<div class="event-card ${e.featured?'featured':''}">
    <div class="time-block"><div class="t">${e.time}</div><div class="a">${e.anchor}</div></div>
    <div class="body">
      ${e.tag?`<div class="tag">${e.tag}</div>`:''}
      <div class="title">${e.title}</div>
      <div class="meta">
        <span class="place">${svg.pin} ${e.place}</span>
        ${e.dist?`<span class="dot nowrap"></span><span class="nowrap">${e.dist}</span>`:''}
        ${e.extra?`<span class="dot nowrap"></span><span class="nowrap">${e.extra}</span>`:''}
      </div>
    </div>
  </div>`;
}

/* ===== Home — Map (only) ===== */
function HomeMap(){
  return Phone(`
    ${TopBarHome()}
    <div class="greeting">
      <div class="row">
        <div>
          <div class="hi">Assalāmu'alaikum</div>
          <div class="hint"><b>5 kajian</b> di peta · Cirebon, Jawa Barat</div>
        </div>
      </div>
    </div>
    <div class="scroll" style="overflow:visible">
      <div class="map-canvas">
        <div class="map-chip-row">
          <button class="map-chip active">Semua tema</button>
          <button class="map-chip">Aqidah</button>
          <button class="map-chip">Fiqh</button>
          <button class="map-chip">Hadits</button>
          <button class="map-chip">Tafsir</button>
          <button class="map-chip">Sirah</button>
        </div>
        <div class="pin" style="top:28%; left:32%"><span>1</span></div>
        <div class="pin active" style="top:48%; left:52%"><span>3</span></div>
        <div class="pin" style="top:35%; left:65%"><span>2</span></div>
        <div class="pin" style="top:62%; left:28%"><span>1</span></div>
        <div class="pin" style="top:60%; left:72%"><span>1</span></div>
        <div class="pin me" style="top:50%; left:50%"></div>
        <button class="map-fab" style="top:64px; right:12px">${svg.gps}</button>
        <div class="pin-callout">
          <div class="head">
            <div>
              <div class="title">Masjid Jami' As-Sunnah</div>
              <div class="sub">3 kajian akan datang · Kesambi</div>
            </div>
            <div class="dist">1,2 km</div>
          </div>
          ${EventCard({time:'18:00',anchor:"Ba'da Subuh",title:'Hadits Arbain — Seri 8',place:'Ust. Abdul Tuasikal',tag:'HARI INI'})}
          <button class="btn primary full">Buka detail masjid ${svg.chev}</button>
        </div>
      </div>
    </div>
  `);
}

/* ===== Event detail ===== */
function EventDetail(hasPoster){
  const next = `
    <div class="next-session">
      <div class="label">Sesi berikutnya · 14 hari lagi</div>
      <div class="date">Minggu, 3 Mei 2026</div>
      <div class="time">18:00 — 19:30 · Ba'da Maghrib</div>
      <div class="actions">
        <button class="btn orange flex-1">${svg.cal} Tambah ke kalender</button>
        <button class="btn ghost icon">${svg.nav}</button>
        <button class="btn ghost icon">${svg.share}</button>
      </div>
    </div>
  `;
  const body = `
    <div class="scroll-inner" style="padding-top:16px">
      ${next}
      <div>
        <div class="section-title" style="margin-bottom:8px">Di mana & siapa</div>
        <div class="linked-rows">
          <div class="linked-row">
            <div class="ava">🕌</div>
            <div class="body"><div class="n">Masjid Jami' As-Sunnah</div><div class="s">Karyamulya, Kesambi · 1,2 km</div></div>
            <div class="chev">${svg.chev}</div>
          </div>
          <div class="linked-row">
            <div class="ava circle">SB</div>
            <div class="body"><div class="n">Ustadz Subhan Bawazier</div><div class="s">Pengajar tetap · 12 kajian aktif</div></div>
            <div class="chev">${svg.chev}</div>
          </div>
        </div>
      </div>
      <div>
        <div class="section-title" style="margin-bottom:10px">Jadwal 15 hari ke depan <span class="right">setiap Minggu</span></div>
        <div class="cal-strip">
          ${Array.from({length:15}).map((_,i)=>{
            const d=i+18; const has=[19,26].includes(d)||i===1||i===8; const today=i===0;
            return `<div class="c ${has?'has':''} ${today?'today':''}">${((d-1)%31)+1}</div>`;
          }).join('')}
        </div>
        <button class="btn ghost full" style="margin-top:10px">${svg.cal} Lihat kalender lengkap</button>
      </div>
      <div class="about-block">
        <div class="l">Tentang kajian ini</div>
        <div class="body">Kajian rutin bulanan membahas adab, akhlak, dan nasihat dari kitab-kitab klasik. Terbuka untuk umum, jamaah ikhwan & akhwat disediakan tempat terpisah.</div>
      </div>
      <button class="btn wa full">${svg.share} Bagikan via WhatsApp</button>
    </div>
  `;
  if (hasPoster){
    return Phone(`
      ${BackBar('', true)}
      <div class="scroll" style="overflow-y:auto">
        <div class="poster">
          <div class="top-chips">
            <span class="pill-light">Mutiara Nasihat</span>
            <span class="pill-light">🔁 Bulanan</span>
          </div>
          <div class="bottom">
            <div class="series">Seri 3 · Asatidz Nasional</div>
            <div class="ptitle">Tabligh Akbar Bulanan</div>
            <div class="psub">Kajian tematik bulanan bersama para asatidz terpilih</div>
          </div>
        </div>
        ${body}
      </div>
    `);
  }
  return Phone(`
    ${BackBar('')}
    <div class="scroll" style="overflow-y:auto">
      <div class="title-block">
        <div class="top-chips">
          <span class="spec-pill">Mutiara Nasihat</span>
          <span class="spec-pill">🔁 Bulanan</span>
        </div>
        <div class="ttitle">Tabligh Akbar Bulanan — Seri 3</div>
        <div class="tsub">Kajian tematik bulanan bersama Asatidz Nasional</div>
      </div>
      ${body}
    </div>
  `);
}

/* ===== Place ===== */
function PlaceDetail(){
  return Phone(`
    ${BackBar('', true)}
    <div class="scroll" style="overflow-y:auto">
      <div class="place-hero">
        <div class="region-chip">Jawa Barat › Kota Cirebon</div>
      </div>
      <div class="place-hero-body">
        <h1>Masjid Jami' As-Sunnah</h1>
        <div class="addr">Jl. Kalitanjung No. 52B, Karyamulya, Kec. Kesambi · 1,2 km dari kamu</div>
        <div class="flex gap-2 mt-3">
          <button class="btn orange flex-1">${svg.nav} Petunjuk arah</button>
          <button class="btn ghost icon">${svg.phone}</button>
          <button class="btn ghost icon">${svg.share}</button>
        </div>
      </div>
      <div class="scroll-inner" style="padding-top:4px">
        <div class="mini-map">
          <div class="map-canvas"></div>
          <div class="pin" style="top:50%; left:50%"><span>${svg.mosque}</span></div>
        </div>
        <div>
          <div class="section-title"><span>Kajian rutin di sini</span><span class="right">3 aktif</span></div>
          <div class="cluster" style="margin-top:10px">
            ${EventCard({time:'05:00',anchor:"Ba'da Subuh",title:'Hadits Arbain — Seri 8',place:'Ust. Abdul Tuasikal',extra:'Harian',tag:'HARI INI'})}
            ${EventCard({time:'18:00',anchor:"Ba'da Maghrib",title:'Tabligh Akbar Bulanan',place:'Ust. Subhan Bawazier',extra:'Bulanan'})}
            ${EventCard({time:'19:30',anchor:"Ba'da Isya",title:'Pembahasan Kitab Tauhid',place:'Ust. Muhammad Toharo',extra:'Mingguan'})}
          </div>
          <button class="btn ghost full mt-3">${svg.cal} Lihat semua jadwal masjid ini</button>
        </div>
      </div>
    </div>
  `);
}

/* ===== Ustadz ===== */
function UstadzDetail(){
  return Phone(`
    ${BackBar('')}
    <div class="scroll" style="overflow-y:auto">
      <div class="scroll-inner" style="padding-top:8px">
        <div style="text-align:center">
          <div class="avatar-big">SB</div>
          <div style="font-size:10.5px;font-weight:700;letter-spacing:0.12em;color:var(--ink-3);text-transform:uppercase;margin-top:14px">Ustadz</div>
          <div style="font-size:24px;font-weight:800;letter-spacing:-0.025em;margin-top:2px;line-height:1.1;color:var(--ink)">Subhan Bawazier</div>
          <div style="font-size:13px;color:var(--ink-3);margin-top:4px">Pengajar tetap · Cirebon · 12 kajian aktif</div>
        </div>
        <div class="about-block" style="background:var(--paper-2);padding:14px;border-radius:var(--radius);border:1px solid var(--line)">
          <div class="l">Tentang</div>
          <div class="body">Lulusan LIPIA Jakarta. Mengajar di beberapa masjid di Cirebon dengan fokus pada Aqidah dan Fiqh kontemporer. Aktif sejak 2015.</div>
        </div>
        <div>
          <div class="section-title">Spesialisasi</div>
          <div class="flex gap-2 mt-2" style="flex-wrap:wrap">
            <span class="spec-pill">Aqidah</span>
            <span class="spec-pill">Mutiara Nasihat</span>
            <span class="spec-pill">Tematik</span>
          </div>
        </div>
        <div>
          <div class="section-title"><span>Kajian aktif</span><span class="right">3 unik</span></div>
          <div class="cluster" style="margin-top:10px">
            ${EventCard({time:'18:00',anchor:"Ba'da Maghrib",title:'Tabligh Akbar Bulanan',place:"Masjid Jami' As-Sunnah",extra:'Bulanan'})}
            ${EventCard({time:'19:30',anchor:"Ba'da Isya",title:'Pembahasan Kitab Tauhid',place:"Masjid Al-Irsyad",extra:'Mingguan'})}
            ${EventCard({time:'05:00',anchor:"Ba'da Subuh",title:'Hadits Arbain — Seri 12',place:"Sang Cipta Rasa",extra:'Harian'})}
          </div>
        </div>
      </div>
    </div>
  `);
}

/* ===== Subject ===== */
function SubjectDetail(){
  return Phone(`
    ${BackBar('')}
    <div class="scroll" style="overflow-y:auto">
      <div class="subject-header">
        <div class="kicker">Tema Kajian</div>
        <h1>Mutiara Nasihat</h1>
        <p>Kajian-kajian yang menyajikan nasihat, adab, dan kisah teladan dari ulama klasik — cocok untuk memperbaiki akhlak sehari-hari.</p>
      </div>
      <div class="scroll-inner" style="padding-top:8px">
        <div class="stat-row">
          <div class="stat"><div class="n">5</div><div class="l">Kajian</div></div>
          <div class="stat"><div class="n">3</div><div class="l">Ustadz</div></div>
          <div class="stat"><div class="n">4</div><div class="l">Masjid</div></div>
        </div>
        <div>
          <div class="section-title">Ustadz yang mengajar tema ini</div>
          <div class="ustadz-mini-group mt-2">
            <div class="ustadz-mini"><div class="a">SB</div><div class="n">Ust. Subhan B.</div></div>
            <div class="ustadz-mini"><div class="a">MT</div><div class="n">Ust. Muh. Toharo</div></div>
            <div class="ustadz-mini"><div class="a">AT</div><div class="n">Ust. Abdul T.</div></div>
          </div>
        </div>
        <div>
          <div class="section-title">Jadwal mendatang</div>
          <div class="cluster" style="margin-top:10px">
            ${EventCard({time:'18:00',anchor:"Ba'da Maghrib",title:'Tabligh Akbar Bulanan — Seri 3',place:"As-Sunnah · Ust. Subhan B.",dist:'1,2 km',tag:'14 HARI'})}
            ${EventCard({time:'05:00',anchor:"Ba'da Subuh",title:'Hadits Arbain — Seri 4',place:"Al-Irsyad · Ust. Toharo",dist:'4,6 km',tag:'HARI INI',featured:true})}
            ${EventCard({time:'19:00',anchor:"Ba'da Isya",title:'Adab Penuntut Ilmu',place:"Nurul Amal · Ust. Tuasikal",dist:'2,4 km'})}
          </div>
        </div>
      </div>
    </div>
  `);
}

/* ===== Search ===== */
function SearchScreen(){
  return Phone(`
    <div class="search-row">
      <button class="back">${svg.back}</button>
      <div class="field">${svg.search}<span>sa</span><span class="cursor"></span></div>
    </div>
    <div class="scroll"><div class="scroll-inner">
      <div>
        <div class="search-group-label"><span>Kajian</span><span>5 hasil</span></div>
        <div class="cluster mt-2">
          <div class="search-item"><div class="t">Pembahasan Kitab Tauhid — Seri 2</div><div class="s">Ust. Bashori · Islamic Center Cirebon</div></div>
          <div class="search-item"><div class="t">Pembahasan Kitab Tauhid — Seri 6</div><div class="s">Ust. Bashori · Islamic Center Cirebon</div></div>
          <div class="search-item"><div class="t">Saksi Para Sahabat</div><div class="s">Ust. Subhan B. · Masjid As-Sunnah</div></div>
        </div>
      </div>
      <div>
        <div class="search-group-label"><span>Tempat</span><span>1 hasil</span></div>
        <div class="search-item mt-2"><div class="t">Masjid Agung Sang Cipta Rasa</div><div class="s">Kasepuhan · 4,5 km dari kamu</div></div>
      </div>
      <div>
        <div class="search-group-label"><span>Ustadz</span><span>1 hasil</span></div>
        <div class="search-item mt-2"><div class="t">Ustadz Subhan Bawazier</div><div class="s">12 kajian aktif · Cirebon</div></div>
      </div>
    </div></div>
  `);
}

/* ===== Settings: first-run picker ===== */
function SettingsFirst(){
  return Phone(`
    <div class="topbar clean">
      <div class="logo">Qarib</div>
    </div>
    <div class="scroll"><div class="scroll-inner" style="gap:14px">
      <div class="settings-hero">
        <div class="icon-circ">${svg.gps}</div>
        <h1>Di mana kamu?</h1>
        <p>Kami butuh lokasimu untuk menampilkan kajian terdekat. Pilih cara yang paling nyaman.</p>
      </div>
      <button class="btn orange full" style="height:52px;font-size:15px">${svg.gps} Gunakan lokasi GPS</button>
      <div class="divider-or">atau pilih manual</div>
      <div>
        <div class="input-label">Provinsi</div>
        <div class="input-field">
          <span>Jawa Barat</span>
          <span style="color:var(--ink-4)">${svg.chev}</span>
        </div>
      </div>
      <div>
        <div class="input-label">Kota / Kabupaten</div>
        <div class="input-field placeholder">
          <span>Pilih kota…</span>
          <span style="color:var(--ink-4)">${svg.chev}</span>
        </div>
      </div>
      <button class="btn primary full" style="opacity:0.5">Simpan & lanjut</button>
      <div class="privacy-note"><b>Privasi:</b> lokasimu tidak disimpan ke server. Hanya dipakai sekali untuk mencari kajian terdekat.</div>
    </div></div>
  `);
}

/* ===== Settings: returning-user sheet ===== */
function SettingsSheet(){
  return Phone(`
    ${TopBarHome()}
    <div class="scroll" style="opacity:0.35"><div class="scroll-inner">
      <div class="date-rail">
        <div class="date-cell today"><div class="d">Sab</div><div class="n">18</div></div>
        <div class="date-cell"><div class="d">Min</div><div class="n">19</div></div>
        <div class="date-cell"><div class="d">Sen</div><div class="n">20</div></div>
      </div>
      <div class="chips"><button class="chip active">Semua</button><button class="chip">Aqidah</button></div>
    </div></div>
    <div class="overlay-scrim"></div>
    <div class="settings-sheet">
      <div style="width:44px;height:5px;background:var(--line-2);border-radius:3px;margin:0 auto 4px"></div>
      <h2>Pengaturan</h2>
      <div>
        <div class="input-label" style="display:flex;align-items:center;gap:6px">${svg.gps} Lokasi</div>
        <div class="input-field" style="background:var(--paper-2)">
          <div>
            <div style="font-size:11px;color:var(--ink-3);font-weight:500">Mode saat ini</div>
            <div style="font-size:14px;font-weight:700;margin-top:2px">📍 Cirebon, Jawa Barat</div>
          </div>
        </div>
        <div class="flex gap-2 mt-2">
          <button class="btn ghost flex-1">Ganti lokasi</button>
          <button class="btn ghost flex-1" style="color:#B33">Hapus</button>
        </div>
      </div>
      <div>
        <div class="input-label">Bahasa / Language</div>
        <div class="lang-toggle">
          <button class="on">🇮🇩 Indonesia</button>
          <button>🇬🇧 English</button>
        </div>
      </div>
      <button class="btn primary full">Simpan</button>
    </div>
  `);
}

/* ===== Calendar full ===== */
function CalendarFull(){
  // April 2026: 1 = Wed. Days 1-30. Today = 18 (Sat). Selected = 19 (Sun).
  // Sessions recurring Sunday + Wed
  const has = new Set([1,5,8,12,15,19,22,26,29]);
  const today = 18, selected = 19;
  const firstDow = 3; // Wed is index 3 (Sun=0)
  const prevTail = Array.from({length: firstDow}, (_,i)=>28+i); // 28,29,30 for March tail (decorative)
  const days = Array.from({length:30}, (_,i)=>i+1);
  const nextLead = Array.from({length: 42 - firstDow - 30}, (_,i)=>i+1);
  const all = [
    ...prevTail.map(n=>({n, out:true})),
    ...days.map(n=>({n, today:n===today, selected:n===selected, has:has.has(n)})),
    ...nextLead.map(n=>({n, out:true})),
  ];
  const dows = ['M','S','S','R','K','J','S'];
  return Phone(`
    ${BackBar('Kalender lengkap')}
    <div class="scroll" style="overflow-y:auto"><div class="scroll-inner" style="gap:14px">
      <div>
        <div class="title-block" style="padding:0 2px 8px;border:none">
          <div class="ttitle" style="font-size:18px">Tabligh Akbar Bulanan</div>
          <div class="tsub">Masjid Jami' As-Sunnah · Ust. Subhan Bawazier</div>
        </div>
      </div>
      <div>
        <div class="cal-month-head">
          <div class="m">April<span class="y">2026</span></div>
          <div class="nav">
            <button>${svg.back}</button>
            <button style="transform:rotate(180deg)">${svg.back}</button>
          </div>
        </div>
        <div class="cal-grid">
          ${dows.map(d=>`<div class="dow">${d}</div>`).join('')}
          ${all.map(d=>`<button class="day ${d.out?'out':''} ${d.today?'today':''} ${d.selected?'selected':''} ${d.has?'has':''}"><span class="n">${d.n}</span></button>`).join('')}
        </div>
        <div class="cal-legend">
          <span class="swatch"><span class="sq" style="background:var(--orange-50);border:1px solid var(--orange-100)"></span>Ada sesi</span>
          <span class="swatch"><span class="sq" style="background:var(--ink)"></span>Hari ini</span>
          <span class="swatch"><span class="sq" style="background:var(--orange)"></span>Terpilih</span>
        </div>
      </div>
      <div>
        <div class="section-title"><span>Min, 19 Apr 2026</span><span class="right">1 sesi</span></div>
        <div class="cluster" style="margin-top:10px">
          ${EventCard({time:'18:00',anchor:"Ba'da Maghrib",title:'Tabligh Akbar Bulanan — Seri 3',place:"Masjid Jami' As-Sunnah",extra:'90 menit'})}
        </div>
      </div>
      <div>
        <div class="section-title">Semua sesi (terjadwal)<span class="right">9 dalam April</span></div>
        <div style="margin-top:8px;display:flex;flex-direction:column;gap:4px">
          ${[
            ['Min, 5 Apr','18:00','Seri 1'],
            ['Rab, 8 Apr','19:30','Seri 2'],
            ['Sen, 12 Apr','18:00','Seri 2 (ulang)'],
            ['Min, 19 Apr','18:00','Seri 3'],
            ['Rab, 22 Apr','19:30','Seri 4'],
            ['Jum, 26 Apr','18:00','Seri 5'],
          ].map(([d,t,s])=>`<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--paper);border:1px solid var(--line);border-radius:10px"><div style="font-size:12px;font-weight:700;color:var(--ink);width:84px">${d}</div><div style="font-size:12px;color:var(--ink-3);width:48px">${t}</div><div style="font-size:12px;color:var(--ink-2);flex:1">${s}</div></div>`).join('')}
        </div>
      </div>
      <button class="btn orange full">${svg.cal} Subscribe ke kalenderku</button>
    </div></div>
  `);
}

/* ===== mount ===== */
const VARIANTS = {
    'home-map': {r: HomeMap, label:'Map home', note:"Pin callout aktif dengan 1 kartu kajian + CTA 'Buka detail masjid'. Filter tema di baris atas, FAB GPS di kanan atas."},
  'event-with': {r: ()=>EventDetail(true), label:'Dengan poster', note:"Poster full-bleed, chips overlay, judul + sub di bawah poster."},
  'event-without': {r: ()=>EventDetail(false), label:'Tanpa poster', note:"Struktur sama persis — hero hilang, chips naik ke title block."},
  'place': {r: PlaceDetail, label:'Masjid', note:"Hero foto, aksi arah/telepon/bagikan, mini map, jadwal rutin, tombol lihat semua."},
  'ustadz': {r: UstadzDetail, label:'Ustadz', note:"Avatar besar di tengah, bio, spesialisasi, 3 kajian aktif unik."},
  'subject': {r: SubjectDetail, label:'Tema', note:"Stats row, carousel ustadz, jadwal dengan jarak per kartu."},
  'search': {r: SearchScreen, label:'Hasil langsung', note:"Dikelompokkan per tipe. Kursor berkedip untuk konteks 'sedang mengetik'."},
  'settings-first': {r: SettingsFirst, label:'First-run', note:"Icon GPS, CTA orange besar, divider 'atau pilih manual', note privasi."},
  'settings-sheet': {r: SettingsSheet, label:'Returning user', note:"Sheet di atas scrim, ringkas: lokasi + bahasa + simpan."},
  'calendar-full': {r: CalendarFull, label:'Kalender lengkap', note:"Grid bulanan dengan penanda sesi, hari ini, hari terpilih. Di bawah: detail hari terpilih + daftar semua sesi bulan ini + subscribe."},
};

const data = JSON.parse(document.getElementById('screens-data').textContent);
const root = document.getElementById('screens');
root.innerHTML = data.map(s => `
  <section class="section" data-screen-label="${s.id}">
    <div class="section-head">
      <div class="eyebrow">${s.eyebrow}</div>
      <h2>${s.title}</h2>
      <p>${s.desc}</p>
    </div>
    <div class="boards">
      ${s.variants.map(v => {
        const V = VARIANTS[v];
        return `<div class="board">
          ${V.r()}
          <div class="board-label">${V.label}<small>${V.note}</small></div>
        </div>`;
      }).join('')}
    </div>
  </section>
`).join('');
