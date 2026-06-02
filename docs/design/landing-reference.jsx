/* Qarib Landing — three directions rendered side-by-side */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "headline": "Kajian terdekat, dalam satu ketukan.",
  "warmth": 8,
  "pattern": true,
  "dark": false,
  "phoneMock": "map",
  "arabic": "hero-dua"
}/*EDITMODE-END*/;

let tweaks = { ...TWEAK_DEFAULTS };

/* ===== inline SVGs ===== */
const svg = {
  arrowRight: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
  map: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>',
  calendar: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  user: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z"/></svg>',
  play: '<svg viewBox="0 0 48 48"><path fill="#fff" d="M9.5 5.5v37l30-18.5z"/></svg>',
  apple: '<svg viewBox="0 0 384 512" fill="white"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>',
  google: '<svg viewBox="0 0 512 512" fill="white"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/></svg>',
};

/* ===== mini phone: map screen ===== */
function PhoneMap(){
  return `
    <div class="pmini">
      <div class="pmini-notch"></div>
      <div class="pmini-screen">
        <div class="pmini-statusbar"><span>9:24</span><span>••• 5G</span></div>
        <div class="pm-map">
          <div class="pm-topchip">
            <div class="chip active">Mana saja</div>
            <div class="chip">Tafsir</div>
            <div class="chip">Fiqih</div>
          </div>
          <div class="pm-pin" style="left:58%;top:32%"><span>3</span></div>
          <div class="pm-pin small" style="left:28%;top:42%"><span>·</span></div>
          <div class="pm-pin small" style="left:72%;top:58%"><span>·</span></div>
          <div class="pm-pin small" style="left:38%;top:62%"><span>·</span></div>
          <div class="pm-sheet">
            <div class="grab"></div>
            <div class="title">Kajian Tafsir Surat Al-Kahfi</div>
            <div class="sub">Masjid Al-Falah · Ust. Ahmad Zainuddin</div>
            <div class="meta"><span>📍 <b>0.8 km</b></span><span>🕐 <b>Ba'da Maghrib</b></span></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ===== mini phone: event detail ===== */
function PhoneEvent(){
  return `
    <div class="pmini">
      <div class="pmini-notch"></div>
      <div class="pmini-screen">
        <div class="pmini-statusbar"><span>9:24</span><span>••• 5G</span></div>
        <div style="flex:1;background:var(--paper);padding:26px 14px 14px;display:flex;flex-direction:column;gap:10px;overflow:hidden">
          <div style="background:linear-gradient(135deg,#E88B2E,#A35711);height:120px;border-radius:14px;display:grid;place-items:center;color:white;font-family:'Fraunces',serif;font-size:14px;font-style:italic;font-weight:500;position:relative;overflow:hidden">
            <div style="position:absolute;inset:0;background-image:radial-gradient(circle at 30% 40%,rgba(255,255,255,0.15) 0,transparent 40%),radial-gradient(circle at 70% 70%,rgba(255,255,255,0.1) 0,transparent 40%);"></div>
            <div style="position:relative">Tafsir Surat<br/>Al-Kahfi</div>
          </div>
          <div style="font-size:12px;font-weight:700;color:var(--ink);line-height:1.3">Kajian Tafsir Surat Al-Kahfi</div>
          <div style="font-size:10px;color:var(--ink-3)">Senin · 20 April · Ba'da Maghrib</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <div style="background:var(--orange-50);color:var(--orange-700);padding:3px 8px;border-radius:10px;font-size:9px;font-weight:600">Tafsir</div>
            <div style="background:var(--paper-2);color:var(--ink-3);padding:3px 8px;border-radius:10px;font-size:9px;font-weight:600">Rutin</div>
          </div>
          <div style="background:var(--paper-2);border:1px solid var(--line);border-radius:10px;padding:9px;display:flex;align-items:center;gap:8px;margin-top:4px">
            <div style="width:26px;height:26px;border-radius:50%;background:var(--orange);color:white;display:grid;place-items:center;font-size:10px;font-weight:700">AZ</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:10px;font-weight:700;color:var(--ink)">Ust. Ahmad Zainuddin</div>
              <div style="font-size:9px;color:var(--ink-3)">Spesialis: Tafsir & Ulumul Quran</div>
            </div>
          </div>
          <div style="background:var(--paper-2);border:1px solid var(--line);border-radius:10px;padding:9px;display:flex;align-items:center;gap:8px">
            <div style="font-size:14px">🕌</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:10px;font-weight:700;color:var(--ink)">Masjid Al-Falah</div>
              <div style="font-size:9px;color:var(--ink-3)">Jl. Melati No. 12 · 0.8 km</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ===== mini phone: stack (map + event overlap) ===== */
function PhoneStack(){
  return `
    <div style="position:relative;width:280px;height:556px;">
      <div style="position:absolute;left:-30px;top:14px;transform:rotate(-6deg);transform-origin:bottom right">
        ${PhoneEvent()}
      </div>
      <div style="position:absolute;right:-40px;top:-14px;transform:rotate(4deg)">
        ${PhoneMap()}
      </div>
    </div>
  `;
}

function phoneByMock(mock){
  if (mock === 'event') return PhoneEvent();
  if (mock === 'stack') return PhoneStack();
  return PhoneMap();
}

/* ===== shared building blocks ===== */
function NavBar(){
  return `
    <div class="ln">
      <div class="logo">Qarib<span class="ar">قريب</span></div>
      <div class="links">
        <a href="#cara-kerja">Cara kerja</a>
        <a href="#fitur">Fitur</a>
        <a href="#" class="btn-ln sm">Buka Qarib ${svg.arrowRight}</a>
      </div>
    </div>
  `;
}

function TrustRow(){
  return `
    <div class="trust-row">
      <div class="badge"><span style="color:var(--green)">${svg.check}</span> Gratis · tanpa akun</div>
      <div class="badge">${svg.lock} Lokasi tak disimpan</div>
    </div>
  `;
}

function CTARow(){
  return `
    <div class="cta-row">
      <a href="#" class="btn-ln">Temukan kajian terdekat ${svg.arrowRight}</a>
      <a href="#cara-kerja" class="btn-ln ghost">Lihat cara kerjanya</a>
    </div>
  `;
}

function ArabicHeroLine(){
  // Shown based on tweaks.arabic:
  // "none" | "hero-accent" | "hero-dua" | "full-ayah"
  const mode = tweaks.arabic;
  if (mode === 'none') return '';
  if (mode === 'hero-accent') return `<span class="ar">قريب</span>`;
  if (mode === 'hero-dua') return `<span class="ar">قريب</span>`;
  return `<span class="ar">قريب</span>`;
}

/* ===== Hero: Editorial ===== */
function HeroEditorial(){
  return `
    <section class="hero editorial" id="hero-editorial">
      <div class="left">
        <div class="divider-ornament"></div>
        <div class="eyebrow"><span class="dot"></span> Qarib · dekat denganmu</div>
        <h1>
          ${tweaks.arabic !== 'none' ? `<span class="ar">قريب</span>` : ''}
          <span class="serif">Kajian</span> terdekat,<br/>dalam satu ketukan.
        </h1>
        <p class="lede">Temukan jadwal kajian di masjid sekitarmu — tanpa perlu bertanya, tanpa perlu akun. Klik, lihat, datangi.</p>
        ${CTARow()}
        ${TrustRow()}
      </div>
      <div class="right-phone">
        ${phoneByMock(tweaks.phoneMock)}
      </div>
    </section>
  `;
}

/* ===== Hero: Illustrative ===== */
function HeroIllustrative(){
  const patternClass = tweaks.pattern ? '' : 'no-pattern';
  return `
    <section class="hero illustrative ${patternClass}" id="hero-illustrative">
      <div class="pattern-bg"></div>
      <div class="left">
        <div class="eyebrow"><span class="dot"></span> Qarib · dekat denganmu</div>
        <h1>
          ${tweaks.arabic !== 'none' ? `<span class="ar">قريب منك</span>` : ''}
          <span class="serif">Ilmu</span> itu dekat.<br/>Lebih dekat dari yang kamu kira.
        </h1>
        <p class="lede">Peta kajian harian di sekitarmu. Cukup buka, geser, pilih — sampai di masjid sebelum iqamah.</p>
        ${CTARow()}
        ${TrustRow()}
      </div>
      <div class="right-phone">
        ${phoneByMock(tweaks.phoneMock)}
      </div>
    </section>
  `;
}

/* ===== Hero: Map-as-hero ===== */
function HeroMapHero(){
  return `
    <section class="hero map-hero" id="hero-map">
      <div class="map-wrap">
        <div class="map-bg"></div>
        <div class="map-roads"></div>
        <div class="map-pin-dot" style="left:62%;top:22%"></div>
        <div class="map-pin-dot" style="left:78%;top:48%"></div>
        <div class="map-pin-dot" style="left:68%;top:72%"></div>
        <div class="map-pin-dot" style="left:52%;top:64%"></div>
        <div class="map-pin-hero">
          <div class="pin"><div class="pin-inner">🕌</div></div>
        </div>
        <div class="map-content">
          <div class="map-copy">
            <div class="eyebrow"><span class="dot"></span> Qarib · dekat denganmu</div>
            <h1>
              ${tweaks.arabic !== 'none' ? `<span class="ar">قريب</span>` : ''}
              Ada kajian <span class="serif">di dekatmu</span>. Sekarang.
            </h1>
            <p class="lede">Buka peta, lihat pin. Tiap pin adalah kajian yang sedang atau akan dimulai di masjid dekatmu.</p>
            ${CTARow()}
            ${TrustRow()}
          </div>
        </div>
      </div>
    </section>
  `;
}

/* ===== Problem section ===== */
function ProblemSection(){
  return `
    <section class="problem" id="kenapa">
      <div class="problem-inner">
        <div class="eyebrow-line">
          ${tweaks.arabic !== 'none' ? `<span class="ar">الرحلة</span>` : `<span style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;font-weight:700;color:var(--orange-700)">Kenapa Qarib</span>`}
        </div>
        <h2>Mencari kajian <span class="em">seharusnya tidak serumit</span> mencari alamat.</h2>
        <p>Info kajian tersebar di banyak grup WhatsApp, story Instagram, dan pengumuman masjid. Banyak yang terlewat. Qarib mengumpulkan semuanya di satu peta — kamu tinggal lihat, pilih, datang.</p>
      </div>
    </section>
  `;
}

/* ===== Features ===== */
function FeaturesSection(){
  return `
    <section class="features" id="fitur">
      <div class="features-inner">
        <div class="features-head">
          <div class="eyebrow">Fitur</div>
          <h2>Semua yang kamu <span class="em">butuhkan</span>, tidak lebih.</h2>
        </div>
        <div class="features-grid">
          <div class="feature">
            <div class="feature-icon">${svg.map}</div>
            <h3>Peta kajian</h3>
            <p>Lihat kajian yang sedang dan akan dimulai di sekitarmu. Pin berwarna menandai urgensi — yang paling dekat waktu, yang paling dekat lokasi.</p>
          </div>
          <div class="feature">
            <div class="feature-icon">${svg.calendar}</div>
            <h3>Kalender per masjid</h3>
            <p>Rencanakan pekan. Buka detail masjid untuk melihat seluruh jadwal kajian rutinnya — bukan cuma hari ini.</p>
          </div>
          <div class="feature">
            <div class="feature-icon">${svg.user}</div>
            <h3>Kenali ustadznya</h3>
            <p>Profil singkat ustadz, spesialisasi, dan kajian aktif yang beliau isi. Supaya kamu tahu siapa yang akan menyampaikan.</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

/* ===== Footer CTA ===== */
function FooterCTA(){
  return `
    <section class="cta-section">
      <div class="cta-inner">
        <h2>Kajian <span class="em">terdekat</span> menunggu. Buka sekarang.</h2>
        <p>Tanpa akun. Tanpa unduh. Langsung buka dan jalan.</p>
        <div class="cta-row">
          <a href="#" class="btn-ln">Buka Qarib di browser ${svg.arrowRight}</a>
        </div>
        <div class="store-row">
          <div class="store-badge">${svg.apple}<div><div class="tiny">Segera di</div><div class="big">App Store</div></div></div>
          <div class="store-badge">${svg.google}<div><div class="tiny">Segera di</div><div class="big">Google Play</div></div></div>
        </div>
      </div>
    </section>
  `;
}

function LandingFooter(){
  const showDua = tweaks.arabic === 'hero-dua' || tweaks.arabic === 'full-ayah';
  return `
    <footer class="lf">
      <div class="copyright">
        <span class="logo-small">Qarib</span>
        <span>© 2026 · Dibuat untuk ukhuwah.</span>
      </div>
      ${showDua ? `<div class="dua"><span class="ar">بارك الله فيكم</span> semoga bermanfaat.</div>` : `<div></div>`}
      <div>
        <a href="#" style="color:inherit;text-decoration:none;margin-right:14px">Kebijakan privasi</a>
        <a href="#" style="color:inherit;text-decoration:none">Kontak</a>
      </div>
    </footer>
  `;
}

/* ===== full landing for one direction ===== */
function renderLanding(direction){
  let hero = '';
  if (direction === 'editorial') hero = HeroEditorial();
  else if (direction === 'illustrative') hero = HeroIllustrative();
  else if (direction === 'map') hero = HeroMapHero();

  return `
    <div class="landing">
      ${NavBar()}
      ${hero}
      ${ProblemSection()}
      ${FeaturesSection()}
      ${FooterCTA()}
      ${LandingFooter()}
    </div>
  `;
}

/* ===== render all boards ===== */
function renderBoards(){
  const dark = tweaks.dark;

  const directions = [
    {id: 'editorial', label: 'A — Editorial', sub: 'Hangat, tipografis. Paper background, phone mock ke kanan, divider ornamen kecil sebagai aksen. Cocok kalau brand ingin terasa seperti "surat dari teman".'},
    {id: 'illustrative', label: 'B — Illustrative', sub: 'Pola geometri Islami sangat lembut sebagai backdrop hero. Tetap kalem — pola bisa dimatikan via Tweaks. Memperkuat identitas Islami tanpa berlebihan.'},
    {id: 'map', label: 'C — Map-as-hero', sub: 'Hero adalah petanya sendiri. Pin berpulsa di sisi kanan, copy di kiri dengan gradient fade. Paling berani secara metafor produk.'}
  ];

  const html = directions.map((d, i) => `
    <div class="board">
      <div class="board-label">
        <span class="num">${i+1}</span>
        ${d.label}
        <span class="badge">${dark ? 'Dark' : 'Light'}</span>
        <span class="badge">Desktop · 1280px</span>
      </div>
      <div class="board-sub">${d.sub}</div>
      <div class="artboard-wrap">
        <div class="artboard">
          <div class="art-chrome">
            <div class="dot r"></div><div class="dot y"></div><div class="dot g"></div>
            <div class="url">qarib.id</div>
          </div>
          <div class="art-viewport ${dark ? 'dark' : ''}">
            <div class="${dark ? 'dark' : ''}" style="height:100%;overflow:hidden">
              ${renderLanding(d.id)}
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  document.getElementById('boards').innerHTML = html;
}

/* ===== Tweaks panel ===== */
function TweaksApp(){
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // keep global tweaks in sync + re-render boards
  React.useEffect(() => {
    tweaks = { ...t };
    renderBoards();
  }, [t]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Content" />
      <TweakText
        label="Headline"
        value={t.headline}
        onChange={v => setTweak('headline', v)}
      />

      <TweakSection label="Arabic" />
      <TweakRadio
        label="Arabic"
        value={t.arabic}
        onChange={v => setTweak('arabic', v)}
        options={[
          {value:'none', label:'None'},
          {value:'hero-accent', label:'Hero'},
          {value:'hero-dua', label:'Hero + dua'},
          {value:'full-ayah', label:'All'},
        ]}
      />

      <TweakSection label="Visual" />
      <TweakSlider
        label="Warmth"
        min={0} max={10} step={1}
        value={t.warmth}
        onChange={v => setTweak('warmth', v)}
      />
      <TweakToggle
        label="Pattern (hero B)"
        value={t.pattern}
        onChange={v => setTweak('pattern', v)}
      />
      <TweakToggle
        label="Dark mode"
        value={t.dark}
        onChange={v => setTweak('dark', v)}
      />

      <TweakSection label="Hero phone" />
      <TweakRadio
        label="Mock"
        value={t.phoneMock}
        onChange={v => setTweak('phoneMock', v)}
        options={[
          {value:'map', label:'Map'},
          {value:'event', label:'Event'},
          {value:'stack', label:'Stack'},
        ]}
      />
    </TweaksPanel>
  );
}

/* ===== warmth dial — adjusts CSS vars ===== */
function applyWarmth(w){
  // w: 0-10 — interpolate paper color saturation + accent vibrance
  const paper3 = [
    [248,245,238], // w=0 — cooler
    [240,233,216]  // w=10 — warmer/creamier
  ];
  const orange = [
    [184,107,39],  // w=0 — muted
    [232,139,46]   // w=10 — vibrant
  ];
  const mix = (a,b,t) => a.map((v,i) => Math.round(v + (b[i]-v)*t));
  const t = w/10;
  const p = mix(paper3[0], paper3[1], t);
  const o = mix(orange[0], orange[1], t);
  // Don't override global — only update the landing artboards
  document.querySelectorAll('.artboard').forEach(el => {
    el.style.setProperty('--paper-3', `rgb(${p.join(',')})`);
    el.style.setProperty('--orange', `rgb(${o.join(',')})`);
  });
}

/* ===== boot ===== */
function boot(){
  renderBoards();

  // Mount Tweaks panel
  const mount = document.createElement('div');
  mount.id = 'tweaks-root';
  document.body.appendChild(mount);
  const root = ReactDOM.createRoot(mount);
  root.render(<TweaksApp />);

  // Apply warmth any time boards render
  const observer = new MutationObserver(() => applyWarmth(tweaks.warmth));
  observer.observe(document.getElementById('boards'), { childList: true, subtree: true });
  applyWarmth(tweaks.warmth);
}

// wait for React + Tweaks helpers to be ready (tweaks-panel.jsx loads async via Babel)
function ready(){
  if (typeof React === 'undefined' || typeof TweaksPanel === 'undefined' || typeof useTweaks === 'undefined'){
    setTimeout(ready, 50);
    return;
  }
  boot();
}
ready();
