/* ========================================================================
   Qarib Hi-Fi v2 — additions
   Color palette · Loading system · Error/empty · Nav graph · Core flow
   Redesigned Map Home · Redesigned Pin Sheet
   ======================================================================== */

(function(){

/* ---------------- SVG helpers ---------------- */
const i = {
  pin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C7.6 2 4 5.6 4 10c0 5.4 7 11.5 7.3 11.8.4.3 1 .3 1.4 0C13 21.5 20 15.4 20 10c0-4.4-3.6-8-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>',
  mosque: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2c-1.5 2-3 3-3 5v1M12 2c1.5 2 3 3 3 5v1M4 20V11a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9M9 20v-4a3 3 0 0 1 6 0v4M2 20h20"/></svg>',
  distance: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M5 12l4-4M5 12l4 4M19 12l-4-4M19 12l-4 4"/></svg>',
  clock: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  chevronUp: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 15 12 9 18 15"/></svg>',
  chevronR: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 6 15 12 9 18"/></svg>',
  gps: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
  list: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>',
  wifi: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 13a10 10 0 0 1 14 0M8.5 16.5a5 5 0 0 1 7 0M2 8.8a15 15 0 0 1 20 0M12 20h.01"/></svg>',
  mapOff: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m2 2 20 20M10.7 5.3 15 3v15M9 5v15l-6 2V7l3.8-1.3M21 15l-6 3M3 17l6-2"/></svg>',
  empty: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3M8 11h6"/></svg>',
  refresh: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>',
};

/* ---------------- 1. COLOR PALETTE ---------------- */
function PaletteSection(){
  const cores = [
    {
      label: 'Orange — Primary',
      ramp: [
        ['Orange 50',  '#FFF4E5', 'Subtle warm background, highlight tints'],
        ['Orange 100', '#FCE4C7', 'Chip backgrounds, hover fills'],
        ['Orange',     '#E88B2E', 'CTAs, active states, primary accents'],
        ['Orange 600', '#C9711C', 'Pressed state for Orange'],
        ['Orange 700', '#A35711', 'Text on warm tints, brand ink'],
      ],
    },
    {
      label: 'Ink — Text & structure',
      ramp: [
        ['Ink',   '#1A1510', 'Primary text, high-contrast surfaces'],
        ['Ink 2', '#4A3F30', 'Secondary text'],
        ['Ink 3', '#7A6F60', 'Tertiary text, labels'],
        ['Ink 4', '#A89E8E', 'Placeholder text, disabled glyphs'],
      ],
    },
    {
      label: 'Paper — Surfaces',
      ramp: [
        ['Paper',   '#FDFAF4', 'App background, cards'],
        ['Paper 2', '#F7F1E5', 'Recessed surfaces, skeleton base'],
        ['Paper 3', '#F0E9D8', 'Canvas background behind cards'],
        ['Line',    '#E8E1D3', '1px borders, dividers'],
        ['Line 2',  '#D4CBB8', 'Stronger dividers, outlined chips'],
      ],
    },
    {
      label: 'Support',
      ramp: [
        ['Green', '#4F8B5A', '"Sedang berlangsung" cues'],
        ['Blue',  '#3A6FA8', 'Links, user-location dot'],
      ],
    },
  ];

  const semantics = [
    ['Now',     '#E88B2E', 'Kajian sedang berlangsung'],
    ['Soon',    '#FCE4C7', 'Mulai dalam < 2 jam'],
    ['Today',   '#FDFAF4', 'Dijadwalkan hari ini'],
    ['Later',   '#A89E8E', 'Lain hari'],
    ['Default', '#FFFFFF', 'Masjid tanpa kajian aktif'],
  ];

  return `
    <div class="section">
      <div class="section-head">
        <div class="eyebrow">01 — Design tokens</div>
        <h2>Color palette</h2>
        <p>Satu warna pembawa merek (oranye hangat, seperti senja Indonesia), ink tua berbasis coklat untuk keterbacaan, kertas krem untuk kanvas. Semua warna dukungan berakar dari keluarga yang sama — menghindari aksen sintetis yang terasa asing.</p>
      </div>

      <div class="palette-grid">
        ${cores.map(c => `
          <div class="palette-card">
            <div class="label">${c.label}</div>
            <div class="palette-ramp">
              ${c.ramp.map(([n,h,u]) => `
                <div class="palette-swatch">
                  <div class="chip-sw" style="background:${h}"></div>
                  <div class="meta">
                    <div class="n">${n}</div>
                    <div class="hex">${h}</div>
                    <div class="use">${u}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>

      <div style="margin-top: 26px">
        <div class="label" style="font-size:11px;font-weight:700;letter-spacing:0.1em;color:var(--ink-3);text-transform:uppercase;margin-bottom:10px;padding-left:2px">
          Semantic pin states (peta)
        </div>
        <div class="semantic-grid">
          ${semantics.map(([n,c,p]) => `
            <div class="semantic-card">
              <div class="dot" style="background:${c};border:1px solid rgba(0,0,0,0.08)"></div>
              <div><div class="n">${n}</div><div class="purpose">${p}</div></div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

/* ---------------- 2. LOADING & FEEDBACK ---------------- */
function LoadingSection(){
  const primitives = [
    {
      n: 'Skeleton',
      d: 'Blok abu-abu berdenyut lembut yang meniru bentuk konten sebenarnya. Dipakai untuk pemuatan awal saat struktur sudah diketahui.',
      use: 'Pin sheet, event list, place detail header',
      preview: `
        <div style="width:100%;display:flex;flex-direction:column;gap:8px">
          <div class="skel" style="height:12px;width:60%"></div>
          <div class="skel" style="height:10px;width:85%"></div>
          <div class="skel" style="height:10px;width:70%"></div>
        </div>
      `,
    },
    {
      n: 'Spinner',
      d: 'Cincin 16px yang berputar. Netral, inline-friendly, untuk aksi singkat yang struktur targetnya belum jelas.',
      use: 'Tombol submit, refresh GPS, re-fetch',
      preview: `<span class="spinner lg"></span>`,
    },
    {
      n: 'Progress strip',
      d: 'Garis tipis oranye di bagian atas konten. Dipakai untuk refresh latar saat data sudah ditampilkan.',
      use: 'Re-fetch di map, list refresh',
      preview: `
        <div style="width:100%;background:var(--paper);border:1px solid var(--line);border-radius:8px;overflow:hidden">
          <div class="progress-strip"></div>
          <div style="padding:14px;font-size:12px;color:var(--ink-3)">Konten yang sudah dimuat tetap terlihat…</div>
        </div>
      `,
    },
    {
      n: 'Ghost pin',
      d: 'Pin peta tanpa label, beropasitas rendah, berdenyut. Menandai bahwa pin akan muncul di sini — memberi jangkar spasial sebelum data tiba.',
      use: 'Map initial load, region switch',
      preview: `
        <div style="display:flex;gap:24px;align-items:center">
          <div class="ghost-pin"></div>
          <div class="ghost-pin" style="animation-delay:0.3s"></div>
          <div class="ghost-pin" style="animation-delay:0.6s"></div>
        </div>
      `,
    },
    {
      n: 'Toast',
      d: 'Pita gelap di bagian atas peta, dengan spinner kecil. Pengumuman non-intrusif saat sistem sedang bekerja.',
      use: 'GPS sedang mencari, refresh region',
      preview: `
        <div class="map-toast" style="position:static"><span class="spinner"></span><span>Mencari lokasimu…</span></div>
      `,
    },
    {
      n: 'Content dim',
      d: 'Overlay krem tipis di atas konten saat sedang revalidasi. Menandakan "ini data lama, sebentar".',
      use: 'Setelah ganti filter / tanggal',
      preview: `
        <div style="width:100%;position:relative" class="dim">
          <div style="padding:14px;background:var(--paper);border:1px solid var(--line);border-radius:8px">
            <div style="font-size:12px;font-weight:700;color:var(--ink)">Tabligh Akbar</div>
            <div style="font-size:11px;color:var(--ink-3);margin-top:3px">Masjid Al-Muhajirin · 19:30</div>
          </div>
        </div>
      `,
    },
  ];

  return `
    <div class="section">
      <div class="section-head">
        <div class="eyebrow">02 — System</div>
        <h2>Loading &amp; feedback primitives</h2>
        <p>Enam primitif, masing-masing dengan tugas spesifik. Pilih berdasarkan <b>seberapa banyak struktur yang sudah diketahui</b> dan <b>apakah konten lama masih berguna</b>. Kita tidak memakai spinner layar penuh — memutus konteks yang sudah ada terasa kasar.</p>
      </div>

      <div class="primitives-grid">
        ${primitives.map(p => `
          <div class="primitive-card">
            <div class="preview">${p.preview}</div>
            <div class="info">
              <div class="n">${p.n}</div>
              <div class="d">${p.d}</div>
              <div class="use">↳ ${p.use}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="artboard" style="margin-top:24px">
        <h3>Cascade — bagaimana primitif saling menggantikan</h3>
        <div style="font-size:12.5px;color:var(--ink-2);line-height:1.6;max-width:860px">
          <div style="display:grid;grid-template-columns:140px 1fr;gap:8px 16px;margin-top:6px">
            <div style="font-weight:700;color:var(--ink)">Cold start</div>
            <div>Ghost pins di peta + skeleton di pin sheet yang tertutup. <b>Tidak ada</b> overlay layar penuh.</div>
            <div style="font-weight:700;color:var(--ink)">0–400ms</div>
            <div>Kalau data tiba, skeleton langsung digantikan konten — tanpa flash.</div>
            <div style="font-weight:700;color:var(--ink)">400–1500ms</div>
            <div>Kalau masih belum, toast "Mencari kajian di area ini…" muncul di atas.</div>
            <div style="font-weight:700;color:var(--ink)">&gt; 1.5s</div>
            <div>Kalau region besar, progress strip mengambil alih toast sampai selesai.</div>
            <div style="font-weight:700;color:var(--ink)">Gagal</div>
            <div>Error state (lihat bagian berikut). Peta tidak pernah kosong tanpa penjelasan.</div>
            <div style="font-weight:700;color:var(--ink)">Revalidasi</div>
            <div>Content dim + progress strip. Konten lama tetap terlihat dan tappable.</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ---------------- 3. ERROR & EMPTY STATES ---------------- */
function ErrorSection(){
  // Render 4 phones: offline, no-results, location-denied, server-error
  const phones = [
    {
      label: 'Offline',
      sub: 'Tidak ada sambungan',
      body: `
        ${topbarLight()}
        <div class="scroll" style="overflow:hidden"><div class="scroll-inner" style="padding-top:40px">
          <div class="error-state">
            <div class="ic" style="background:#FCE4C7;color:var(--orange-700)">${i.wifi}</div>
            <div class="ttl">Tidak ada sambungan</div>
            <div class="msg">Data terakhir yang kami simpan masih bisa dilihat, tapi kajian baru mungkin belum muncul.</div>
            <button class="btn orange" style="background:var(--orange);color:white;border-radius:20px;padding:10px 20px;font-size:13px;font-weight:600;border:none;display:inline-flex;align-items:center;gap:6px">${i.refresh} Coba lagi</button>
          </div>
          <div style="margin-top:8px;padding:10px 14px;background:var(--paper-2);border-radius:10px;font-size:11.5px;color:var(--ink-3);text-align:center">
            Tersimpan lokal · disinkronkan 3 menit lalu
          </div>
        </div></div>
      `,
    },
    {
      label: 'Kosong — tidak ada kajian',
      sub: 'Area sepi hari ini',
      body: `
        ${topbarLight()}
        <div class="scroll" style="overflow:hidden"><div class="scroll-inner" style="padding-top:30px">
          <div class="error-state">
            <div class="ic">${i.empty}</div>
            <div class="ttl">Belum ada kajian di sini</div>
            <div class="msg">Di area Menteng hari ini belum ada jadwal. Coba perluas radius atau lihat kajian besok.</div>
            <div style="display:flex;gap:8px;justify-content:center;margin-top:6px">
              <button style="background:white;border:1px solid var(--line-2);color:var(--ink);border-radius:18px;padding:8px 14px;font-size:12px;font-weight:600">Perluas radius</button>
              <button style="background:var(--ink);color:white;border-radius:18px;padding:8px 14px;font-size:12px;font-weight:600;border:none">Lihat besok</button>
            </div>
          </div>
        </div></div>
      `,
    },
    {
      label: 'Izin lokasi ditolak',
      sub: 'GPS off / denied',
      body: `
        ${topbarLight()}
        <div class="scroll" style="overflow:hidden"><div class="scroll-inner" style="padding-top:30px">
          <div class="error-state">
            <div class="ic" style="background:var(--orange-50);color:var(--orange-700)">${i.gps}</div>
            <div class="ttl">Lokasimu belum aktif</div>
            <div class="msg">Agar bisa menunjukkan kajian terdekat, Qarib butuh izin akses lokasi — atau pilih area secara manual.</div>
            <div style="display:flex;flex-direction:column;gap:8px;max-width:220px;margin:0 auto">
              <button style="background:var(--ink);color:white;border-radius:20px;padding:10px 16px;font-size:13px;font-weight:600;border:none">Aktifkan lokasi</button>
              <button style="background:transparent;color:var(--ink-2);border:1px solid var(--line-2);border-radius:20px;padding:10px 16px;font-size:13px;font-weight:600">Pilih area manual</button>
            </div>
          </div>
        </div></div>
      `,
    },
    {
      label: 'Gagal memuat',
      sub: 'Server/API error',
      body: `
        ${topbarLight()}
        <div class="scroll" style="overflow:hidden"><div class="scroll-inner" style="padding-top:40px">
          <div class="error-state">
            <div class="ic" style="background:#F4E5E5;color:#8B3A3A">${i.mapOff}</div>
            <div class="ttl">Gagal memuat kajian</div>
            <div class="msg">Ada masalah sebentar di sisi kami. Ini bukan salahmu — silakan coba lagi dalam beberapa detik.</div>
            <button style="background:var(--orange);color:white;border-radius:20px;padding:10px 20px;font-size:13px;font-weight:600;border:none;display:inline-flex;align-items:center;gap:6px">${i.refresh} Muat ulang</button>
          </div>
        </div></div>
      `,
    },
  ];

  return `
    <div class="section">
      <div class="section-head">
        <div class="eyebrow">03 — Edge cases</div>
        <h2>Error &amp; empty states</h2>
        <p>Setiap "jalur putus" memiliki pesan yang manusiawi, ikon yang jelas, dan <b>selalu satu aksi utama</b>. Bahasa tetap hangat — kesalahan bukan hukuman bagi pengguna.</p>
      </div>
      <div class="boards">
        ${phones.map(p => `
          <div class="board">
            <div class="board-label">${p.label}<small>${p.sub}</small></div>
            <div class="phone"><div class="screen">
              <div class="notch"></div>
              <div class="statusbar"><span>9:41</span><span class="icons">●●●● 5G ▮</span></div>
              ${p.body}
            </div></div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function topbarLight(){
  return `<div class="topbar">
    <div class="logo">Qarib</div>
    <div class="search-input"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg><span class="placeholder-text">Cari kajian, ustadz, masjid…</span></div>
    <button class="icon-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/></svg></button>
  </div>`;
}


/* ---------------- 4. NAV GRAPH ---------------- */
function NavGraphSection(){
  // Arranged as columns of depth: entry → mid → leaf
  // Canvas 1520 × 820
  const nodes = [
    // Column 0 — entry / modals
    {id:'firstrun', x:30,  y:40,  t:'First-run picker', s:'One-time onboarding', modal:true},
    {id:'home',     x:30,  y:340, t:'Map Home', s:'Entry point', primary:true},
    {id:'settings', x:30,  y:700, t:'Settings sheet', s:'Bottom sheet', modal:true},
    {id:'search',   x:30,  y:560, t:'Search', s:'Modal overlay', modal:true},

    // Column 1 — pin sheet states (lives inside map)
    {id:'pin-peek', x:260, y:220, t:'Pin sheet · peek', s:'Same screen'},
    {id:'pin-full', x:260, y:420, t:'Pin sheet · full', s:'Expanded'},

    // Column 2 — event detail hub
    {id:'event',    x:500, y:320, t:'Event detail', s:'Push'},

    // Column 3 — leaf details
    {id:'place',    x:740, y:80,  t:'Place detail', s:'Push · hero'},
    {id:'ustadz',   x:740, y:240, t:'Ustadz detail', s:'Push'},
    {id:'subject',  x:740, y:400, t:'Subject detail', s:'Push · feed'},
    {id:'calendar', x:740, y:560, t:'Calendar', s:'Push · scoped'},
  ];
  const byId = Object.fromEntries(nodes.map(n=>[n.id,n]));

  // Edges: from, to, label, [routing: 'straight'|'curve', offset]
  const edges = [
    ['firstrun','home','selesai'],
    ['home','pin-peek','tap pin'],
    ['home','search','tap search bar'],
    ['home','settings','tap gear'],
    ['pin-peek','pin-full','swipe up'],
    ['pin-peek','event','tap event'],
    ['pin-full','event','tap event'],
    ['pin-full','place','Buka detail masjid'],
    ['search','event','tap result'],
    ['event','place','tap place'],
    ['event','ustadz','tap ustadz'],
    ['event','subject','tap tag'],
    ['event','calendar','Lihat kalender'],
    ['place','calendar','Lihat semua jadwal'],
    ['place','ustadz','tap ustadz'],
    ['subject','ustadz','tap carousel'],
    ['subject','event','tap event'],
    ['ustadz','event','tap kajian aktif'],
    ['calendar','event','tap day-event'],
  ];

  const nodeHTML = nodes.map(n => `
    <div class="nav-node ${n.primary?'primary':''} ${n.modal?'modal':''}"
         style="left:${n.x}px;top:${n.y}px">
      <div class="t">${n.t}</div>
      <div class="s">${n.s}</div>
    </div>
  `).join('');

  // Build SVG bezier paths + collect midpoints for labels with dedup
  const nodeW = 140, nodeH = 56;
  const pathData = [];
  const labelData = [];
  edges.forEach(([from, to, lbl], idx) => {
    const a = byId[from], b = byId[to];
    const sameCol = Math.abs(a.x - b.x) < 20;
    const reverse = b.x < a.x;
    let sx, sy, ex, ey, cx1, cy1, cx2, cy2;

    if (sameCol){
      // vertical connection
      if (a.y < b.y){ sx=a.x+nodeW/2; sy=a.y+nodeH; ex=b.x+nodeW/2; ey=b.y; }
      else           { sx=a.x+nodeW/2; sy=a.y; ex=b.x+nodeW/2; ey=b.y+nodeH; }
      cx1=sx; cy1=(sy+ey)/2; cx2=ex; cy2=(sy+ey)/2;
    } else if (reverse){
      // right-side to right-side loop
      sx = a.x + nodeW; sy = a.y + nodeH/2;
      ex = b.x + nodeW; ey = b.y + nodeH/2;
      const bulge = 60;
      cx1 = sx + bulge; cy1 = sy;
      cx2 = ex + bulge; cy2 = ey;
    } else {
      sx = a.x + nodeW; sy = a.y + nodeH/2;
      ex = b.x;         ey = b.y + nodeH/2;
      const midX = (sx + ex) / 2;
      cx1 = midX; cy1 = sy;
      cx2 = midX; cy2 = ey;
    }

    const isModal = a.modal || b.modal;
    const color = isModal ? '#7A6F60' : '#A35711';
    const dash = isModal ? '4 3' : '';
    pathData.push({d: `M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${ex} ${ey}`, color, dash, modal: isModal});

    // Label midpoint on the bezier (approximately at t=0.5)
    const t = 0.5;
    const mt = 1 - t;
    const lx = mt*mt*mt*sx + 3*mt*mt*t*cx1 + 3*mt*t*t*cx2 + t*t*t*ex;
    const ly = mt*mt*mt*sy + 3*mt*mt*t*cy1 + 3*mt*t*t*cy2 + t*t*t*ey;
    labelData.push({x: lx, y: ly, lbl, idx});
  });

  // De-collide labels: simple grid-based placement — if too close, shift vertically
  labelData.forEach(l => { l.y = Math.round(l.y); l.x = Math.round(l.x); });
  for (let iter=0; iter<6; iter++){
    let moved = false;
    for (let i=0;i<labelData.length;i++){
      for (let j=i+1;j<labelData.length;j++){
        const dx = Math.abs(labelData[i].x - labelData[j].x);
        const dy = Math.abs(labelData[i].y - labelData[j].y);
        if (dx < 100 && dy < 18){
          // push j down, i up
          labelData[i].y -= 10;
          labelData[j].y += 10;
          moved = true;
        }
      }
    }
    if (!moved) break;
  }

  const edgeSVG = `
    <svg width="920" height="820" style="position:absolute;top:0;left:0;pointer-events:none;overflow:visible">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#A35711"/>
        </marker>
        <marker id="arrow-modal" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#7A6F60"/>
        </marker>
      </defs>
      ${pathData.map(p => `<path d="${p.d}" stroke="${p.color}" stroke-width="1.5" stroke-dasharray="${p.dash}" fill="none" marker-end="url(#${p.modal?'arrow-modal':'arrow'})"/>`).join('')}
    </svg>
  `;

  const labelHTML = labelData.map(l => `
    <div class="nav-edge-label" style="left:${l.x}px;top:${l.y}px;transform:translate(-50%,-50%)">${l.lbl}</div>
  `).join('');

  return `
    <div class="section">
      <div class="section-head">
        <div class="eyebrow">04 — Information architecture</div>
        <h2>Navigation graph</h2>
        <p>Semua transisi antar-layar. Garis putus menandai modal/overlay; panah solid oranye menandai push navigation. Tidak ada bottom nav — aplikasi kecil dan setiap layar kembali ke peta via tombol back atau gesture browser. Calendar terbuka sebagai modal dari layar yang memanggilnya (Event/Place/Subject) dan scope-nya mengikuti konteks itu.</p>
      </div>
      <div class="nav-graph">
        <div class="nav-graph-canvas">
          ${edgeSVG}
          ${nodeHTML}
          ${labelHTML}
        </div>
      </div>
      <div style="display:flex;gap:20px;margin-top:14px;font-size:11.5px;color:var(--ink-3);padding-left:4px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:6px"><div style="width:14px;height:14px;background:var(--orange-50);border:1.5px solid var(--orange);border-radius:3px"></div> Entry point</div>
        <div style="display:flex;align-items:center;gap:6px"><div style="width:14px;height:14px;background:var(--paper);border:1.5px dashed var(--line-2);border-radius:3px"></div> Modal / overlay</div>
        <div style="display:flex;align-items:center;gap:6px"><div style="width:18px;height:2px;background:var(--orange-700)"></div> Push navigation</div>
        <div style="display:flex;align-items:center;gap:6px"><div style="width:18px;height:2px;background:var(--ink-3);border-top:1px dashed"></div> Modal transition</div>
      </div>
    </div>
  `;
}

/* ---------------- 5. CORE FLOW ---------------- */
function FlowSection(){
  // Reuse existing screen renderers (HomeMap, EventDetail, PlaceDetail) but wrap in flow
  // We can't easily call those — they render full phones. We'll call them and extract the .phone HTML.
  // Simpler: render via their function references which are global (since hifi-v2.js defined them).
  const steps = [
    {
      phone: (typeof MapHomeV2 === 'function') ? MapHomeV2({state:'resolved'}) : '',
      label: 'Tap pin oranye',
      caption: '<span class="step-num">1</span>Masuk ke Map Home. Pin "NOW" oranye menandakan kajian sedang berlangsung — fokus visual langsung jatuh ke sana.'
    },
    {
      phone: (typeof MapHomeV2 === 'function') ? MapHomeV2({state:'pin-peek'}) : '',
      label: 'Swipe up sheet',
      caption: '<span class="step-num">2</span>Pin sheet muncul setengah, menampilkan kajian aktif. Konteks peta tetap terlihat di atas — pengguna tidak tersesat.'
    },
    {
      phone: (typeof EventDetail === 'function') ? EventDetail(true) : '',
      label: 'Tap ustadz',
      caption: '<span class="step-num">3</span>Event detail: informasi penting di atas (jam, lokasi, ustadz), deskripsi dan aksi di bawah. Poster opsional — struktur tidak berubah jika tidak ada.'
    },
    {
      phone: (typeof UstadzDetail === 'function') ? UstadzDetail() : '',
      label: 'Tap kajian aktif',
      caption: '<span class="step-num">4</span>Profil ustadz: identitas dulu, jadwal aktif kemudian. Pengguna bisa mengikuti seri yang sama di minggu depan.'
    },
  ];

  // Build flow row with arrows between
  const parts = [];
  steps.forEach((s, idx) => {
    parts.push(`
      <div class="flow-step">
        ${s.phone}
        <div class="flow-caption">${s.caption}</div>
      </div>
    `);
    if (idx < steps.length - 1){
      parts.push(`
        <div class="flow-arrow">
          <svg width="52" height="16" viewBox="0 0 52 16" fill="none"><path d="M2 8h46M42 3l6 5-6 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <div class="label">${s.label}</div>
        </div>
      `);
    }
  });

  return `
    <div class="section">
      <div class="section-head">
        <div class="eyebrow">05 — Walkthrough</div>
        <h2>Happy path — menemukan kajian terdekat</h2>
        <p>Empat langkah dari pembukaan aplikasi ke menemukan seri ustadz yang relevan. Perhatikan bagaimana setiap layar menjaga konteks dari layar sebelumnya — tombol kembali selalu membawa pulang.</p>
      </div>
      <div style="overflow-x:auto;padding-bottom:16px">
        <div class="flow-row" style="width:max-content">
          ${parts.join('')}
        </div>
      </div>
    </div>
  `;
}

/* ---------------- 6. MAP HOME REDESIGN ---------------- */
// States: resolved · loading · empty · error · pin-peek · pin-full

window.MapHomeV2 = function(opts){
  const state = (opts && opts.state) || 'resolved';
  const selected = state === 'pin-peek' || state === 'pin-full' ? 'sel' : null;

  // Pins laid on a 380×(screen) area, but we use percentages since phone content area varies
  const pins = [
    {id:'p1', x:22, y:30, label:'19:30', kind:'today'},
    {id:'p2', x:45, y:22, label:'NOW', kind:'now', icon: true},
    {id:'sel', x:58, y:42, label:'18:00', kind:'soon'},
    {id:'p4', x:30, y:52, label:'20:00', kind:'today'},
    {id:'p5', x:76, y:58, label:'Besok', kind:'later'},
    {id:'p6', x:18, y:68, label:'Besok', kind:'later'},
  ];

  // Which renders we show
  const showGhost = state === 'loading';
  const showToast = state === 'loading';
  const showProgress = state === 'resolved' && opts && opts.showProgress;
  const isEmpty = state === 'empty';
  const isError = state === 'error';

  // Map decoration
  const roads = `
    <div class="map-road h" style="top:18%;left:-5%;right:-5%;transform:rotate(-4deg)"></div>
    <div class="map-road h" style="top:48%;left:-5%;right:-5%;transform:rotate(2deg)"></div>
    <div class="map-road h" style="top:72%;left:-5%;right:-5%;transform:rotate(-1deg)"></div>
    <div class="map-road v" style="top:-5%;bottom:-5%;left:32%;transform:rotate(3deg)"></div>
    <div class="map-road v" style="top:-5%;bottom:-5%;left:68%;transform:rotate(-2deg)"></div>
  `;

  // Pin sheet
  let sheetHTML = '';
  let sheetHeight = 0;
  if (state === 'pin-peek'){ sheetHeight = 180; sheetHTML = pinSheet('peek'); }
  else if (state === 'pin-full'){ sheetHeight = 460; sheetHTML = pinSheet('full'); }

  // Top chips
  const topChips = `
    <div class="map-top-chips">
      <button class="chip active">Hari ini</button>
      <button class="chip">Sekarang</button>
      <button class="chip">Besok</button>
      <button class="chip">Tafsir</button>
      <button class="chip">Fiqih</button>
    </div>
  `;

  // Map layer body
  let mapBody;
  if (isEmpty){
    mapBody = `
      <div class="map-surface">${roads}</div>
      ${topChips}
      <div style="position:absolute;left:0;right:0;top:45%;transform:translateY(-50%);text-align:center;padding:0 36px;z-index:10">
        <div style="width:52px;height:52px;border-radius:50%;background:white;border:1px solid var(--line);display:grid;place-items:center;margin:0 auto 10px;color:var(--ink-3);box-shadow:var(--shadow)">${i.empty}</div>
        <div style="font-size:14px;font-weight:700;color:var(--ink);margin-bottom:4px">Belum ada di area ini</div>
        <div style="font-size:12px;color:var(--ink-3);line-height:1.45;margin-bottom:12px">Perluas zoom atau pindah area untuk melihat kajian lain.</div>
        <button style="background:var(--ink);color:white;border:none;border-radius:18px;padding:8px 16px;font-size:12px;font-weight:600">Perluas area</button>
      </div>
    `;
  } else if (isError){
    mapBody = `
      <div class="map-surface" style="opacity:0.6">${roads}</div>
      ${topChips}
      <div style="position:absolute;left:16px;right:16px;top:50%;transform:translateY(-50%);text-align:center;padding:24px 20px;background:white;border-radius:14px;box-shadow:var(--shadow-lg);z-index:10">
        <div style="width:48px;height:48px;border-radius:50%;background:#F4E5E5;display:grid;place-items:center;margin:0 auto 10px;color:#8B3A3A">${i.mapOff}</div>
        <div style="font-size:14px;font-weight:700;color:var(--ink);margin-bottom:4px">Peta tidak bisa dimuat</div>
        <div style="font-size:11.5px;color:var(--ink-3);line-height:1.45;margin-bottom:12px">Periksa sambunganmu. Data kajian yang sudah tersimpan masih bisa dilihat di tab Kalender.</div>
        <button style="background:var(--orange);color:white;border:none;border-radius:18px;padding:8px 16px;font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:6px">${i.refresh} Coba lagi</button>
      </div>
    `;
  } else {
    const pinsHTML = pins.map(p => {
      if (showGhost){
        return `<div class="map-pin" style="left:${p.x}%;top:${p.y}%"><div class="ghost-pin"></div></div>`;
      }
      const isSel = selected === p.id ? 'selected' : '';
      return `
        <div class="map-pin ${p.kind} ${isSel}" style="left:${p.x}%;top:${p.y}%">
          <div class="body">${p.kind==='now' ? '●&nbsp;'+p.label : p.label}</div>
        </div>
      `;
    }).join('');

    const cluster = showGhost ? '' : `<div class="map-cluster" style="left:88%;top:30%">12</div>`;

    mapBody = `
      <div class="map-surface">${roads}</div>
      ${topChips}
      ${showToast ? `<div class="map-toast" style="top:58px"><span class="spinner"></span><span>Memuat kajian di Jakarta Selatan…</span></div>` : ''}
      ${showProgress ? `<div style="position:absolute;top:58px;left:10px;right:10px;z-index:22"><div class="progress-strip" style="border-radius:2px"></div></div>` : ''}
      ${pinsHTML}
      ${cluster}
      <div class="my-loc-dot" style="left:50%;top:62%"></div>
      <button class="map-fab gps ${showGhost?'loading':''}" style="bottom:${sheetHeight + 20}px">
        ${showGhost ? '<span class="spinner"></span>' : i.gps}
      </button>
    `;
  }

  // Wrap
  const topBar = `<div class="topbar" style="position:absolute;top:42px;left:0;right:0;z-index:30;background:rgba(253,250,244,0.94);backdrop-filter:blur(10px);border-bottom:1px solid rgba(232,225,211,0.6)">
    <div class="logo">Qarib</div>
    <div class="search-input" style="background:white">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
      <span class="placeholder-text">Cari kajian, ustadz, masjid…</span>
    </div>
    <button class="icon-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/></svg></button>
  </div>`;

  return `<div class="phone"><div class="screen">
    <div class="notch"></div>
    <div class="statusbar" style="position:relative;z-index:35;background:rgba(253,250,244,0.94);backdrop-filter:blur(10px)"><span>9:41</span><span class="icons">●●●● 5G ▮</span></div>
    <div style="flex:1;position:relative;overflow:hidden" data-v2-map>
      ${topBar}
      <div style="position:absolute;top:96px;left:0;right:0;bottom:0;overflow:hidden">
        ${mapBody}
      </div>
      ${sheetHTML}
    </div>
  </div></div>`;
};

function pinSheet(mode){
  // peek: place strip + 1 urgency event row
  // full: place strip + all events + "Buka detail masjid" button
  const placeStrip = `
    <div class="place-strip">
      <div class="thumb">${i.mosque}</div>
      <div class="meta">
        <div class="n">Masjid Raya Al-Hidayah</div>
        <div class="s">${i.distance} 320m · Jl. Wijaya II, Kebayoran</div>
      </div>
      <button class="icon-btn" style="width:32px;height:32px;background:var(--paper-2);border:1px solid var(--line)">${i.chevronUp}</button>
    </div>
  `;

  if (mode === 'peek'){
    return `
      <div class="pin-sheet">
        <div class="handle"></div>
        <div class="sheet-body">
          ${placeStrip}
          <div class="peek-event">
            <span class="urgency soon">SOON</span>
            <span class="t">Tafsir Al-Fatihah · 18:00 (dalam 45m)</span>
          </div>
          <div style="font-size:11px;color:var(--ink-3);padding:4px 0 2px">Ust. Abdul Somad · 1 kajian hari ini</div>
        </div>
      </div>
    `;
  }

  // full mode
  return `
    <div class="pin-sheet" style="max-height:72%">
      <div class="handle"></div>
      <div class="sheet-body">
        ${placeStrip}
        <div style="display:flex;gap:6px;margin:12px 0 8px">
          <div class="chip active" style="height:28px;padding:0 10px;font-size:11.5px">Hari ini (1)</div>
          <div class="chip" style="height:28px;padding:0 10px;font-size:11.5px">Besok (2)</div>
          <div class="chip" style="height:28px;padding:0 10px;font-size:11.5px">Minggu ini (5)</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;gap:10px;padding:10px;background:var(--orange-50);border:1px solid var(--orange-100);border-radius:10px">
            <div style="flex-shrink:0;width:48px;text-align:center"><div style="font-size:15px;font-weight:800;color:var(--orange-700)">18:00</div><div style="font-size:9.5px;color:var(--orange-700);font-weight:600">45m lagi</div></div>
            <div style="flex:1;min-width:0">
              <div style="font-size:12.5px;font-weight:700;color:var(--ink)">Tafsir Al-Fatihah — Seri 3</div>
              <div style="font-size:11px;color:var(--ink-2);margin-top:2px">Ust. Abdul Somad · Tafsir</div>
            </div>
            <button class="icon-btn ghost" style="width:28px;height:28px">${i.chevronR}</button>
          </div>
          <div style="display:flex;gap:10px;padding:10px;background:var(--paper-2);border-radius:10px">
            <div style="flex-shrink:0;width:48px;text-align:center"><div style="font-size:15px;font-weight:700;color:var(--ink)">20:00</div><div style="font-size:9.5px;color:var(--ink-3)">Ba'da Isya</div></div>
            <div style="flex:1;min-width:0">
              <div style="font-size:12.5px;font-weight:700;color:var(--ink)">Fiqih Thaharah</div>
              <div style="font-size:11px;color:var(--ink-2);margin-top:2px">Ust. Khalid Basalamah</div>
            </div>
            <button class="icon-btn ghost" style="width:28px;height:28px">${i.chevronR}</button>
          </div>
        </div>
        <button style="width:100%;margin-top:12px;padding:12px;background:var(--ink);color:white;border:none;border-radius:12px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px">
          ${i.mosque} Buka detail masjid
        </button>
      </div>
    </div>
  `;
}

function MapRedesignSection(){
  const boards = [
    {label: 'Resolved', sub: 'Pin sudah termuat, GPS aktif', html: window.MapHomeV2({state:'resolved'})},
    {label: 'Loading — cold start', sub: 'Ghost pins + toast + FAB spinner', html: window.MapHomeV2({state:'loading'})},
    {label: 'Pin sheet · peek', sub: 'Tap pin, sheet muncul 1/4', html: window.MapHomeV2({state:'pin-peek'})},
    {label: 'Pin sheet · full', sub: 'Swipe up, sheet penuh 3/4', html: window.MapHomeV2({state:'pin-full'})},
    {label: 'Empty', sub: 'Tidak ada kajian di area ini', html: window.MapHomeV2({state:'empty'})},
    {label: 'Error', sub: 'Gagal memuat peta / jaringan', html: window.MapHomeV2({state:'error'})},
  ];

  return `
    <div class="section">
      <div class="section-head">
        <div class="eyebrow">06 — Map home</div>
        <h2>Peta sebagai beranda — enam keadaan</h2>
        <p>Beranda kini adalah peta penuh, bukan list. Pin mengodekan urgensi (NOW oranye, SOON krem, TODAY putih, LATER abu). Search bar dan chip filter mengambang di atas peta. Sheet tempat (pin sheet) muncul bertingkat: peek untuk intip cepat, full untuk detail. Setiap keadaan memiliki aksi utama yang jelas — peta tidak pernah kosong tanpa jalan keluar.</p>
      </div>
      <div class="boards">
        ${boards.map(b => `
          <div class="board">
            <div class="board-label">${b.label}<small>${b.sub}</small></div>
            ${b.html}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/* ---------------- 7. PIN SHEET DEEP DIVE ---------------- */
function PinSheetSection(){
  // Show 3 phones side-by-side: peek, full, + a standalone card of the primitives
  return `
    <div class="section">
      <div class="section-head">
        <div class="eyebrow">07 — Component</div>
        <h2>Pin sheet — anatomi</h2>
        <p>Pin sheet bekerja dalam dua posisi: <b>peek</b> (menampilkan kajian paling mendesak saja, peta masih dominan) dan <b>full</b> (seluruh jadwal tempat tersebut, dengan CTA ke detail masjid). Transisi adalah gesture alami — swipe naik/turun, atau tap pada chevron.</p>
      </div>

      <div class="boards">
        <div class="board">
          <div class="board-label">Peek<small>Kajian paling mendesak. Peta masih dominan.</small></div>
          ${window.MapHomeV2({state:'pin-peek'})}
        </div>
        <div class="board">
          <div class="board-label">Full<small>Semua jadwal tempat + CTA detail masjid.</small></div>
          ${window.MapHomeV2({state:'pin-full'})}
        </div>
        <div class="board" style="flex:1;min-width:320px;max-width:420px">
          <div class="board-label">Anatomi</div>
          <div class="artboard" style="padding:18px">
            <div style="display:flex;flex-direction:column;gap:14px;font-size:12px;color:var(--ink-2);line-height:1.5">
              <div>
                <div style="font-size:11px;font-weight:700;color:var(--orange-700);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px">Handle</div>
                <div>Garis tipis 40×4px di atas. Sinyal visual bahwa ini sheet — bisa di-drag.</div>
              </div>
              <div>
                <div style="font-size:11px;font-weight:700;color:var(--orange-700);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px">Place strip</div>
                <div>Nama masjid + jarak. Selalu ada, baik di peek maupun full. Memberi jangkar: "ini tempat apa".</div>
              </div>
              <div>
                <div style="font-size:11px;font-weight:700;color:var(--orange-700);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px">Urgency badge</div>
                <div>NOW / SOON muncul sebagai kotak kecil di depan judul kajian. Warna mengikuti sistem pin.</div>
              </div>
              <div>
                <div style="font-size:11px;font-weight:700;color:var(--orange-700);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px">Time pill</div>
                <div>Jam di kolom kiri, 48px, highlight ketika SOON/NOW. Relatif time ("45m lagi") dibanding jam membantu keputusan cepat.</div>
              </div>
              <div>
                <div style="font-size:11px;font-weight:700;color:var(--orange-700);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px">CTA</div>
                <div>"Buka detail masjid" hanya muncul di full mode — pengguna sudah mengindikasikan minat dengan meng-expand.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ---------------- MOUNT ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('v2-content');
  if (!root) return;
  root.innerHTML = [
    PaletteSection(),
    LoadingSection(),
    ErrorSection(),
    NavGraphSection(),
    MapRedesignSection(),
    PinSheetSection(),
    FlowSection(),
  ].join('');
});

})();
