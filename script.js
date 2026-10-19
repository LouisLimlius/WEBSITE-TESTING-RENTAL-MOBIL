/* =========================================================
   Sahabat Rental Mobil — script.js (satu-satunya file JS)
   Dipakai bersama oleh index.html, katalog.html,
   login.html, dan kontak.html.
   Data disimpan di localStorage browser.
   ========================================================= */
'use strict';

/* ============ 1. PENYIMPANAN & DATA AWAL ============ */
function ambil(k, d) {
  try { const v = localStorage.getItem('srm_' + k); return v ? JSON.parse(v) : d; }
  catch (e) { return d; }
}
function simpan(k, v) { localStorage.setItem('srm_' + k, JSON.stringify(v)); }

(function seed() {
  if (!ambil('cars', null)) {
    simpan('cars', [
      { id: 1, nama: 'Toyota Avanza', tipe: 'MPV', kursi: 7, transmisi: 'Manual', tarif: 350000 },
      { id: 2, nama: 'Honda Brio', tipe: 'City Car', kursi: 5, transmisi: 'Matic', tarif: 300000 },
      { id: 3, nama: 'Toyota Innova Reborn', tipe: 'MPV', kursi: 7, transmisi: 'Matic', tarif: 550000 },
      { id: 4, nama: 'Mitsubishi Xpander', tipe: 'MPV', kursi: 7, transmisi: 'Matic', tarif: 450000 },
      { id: 5, nama: 'Daihatsu Sigra', tipe: 'MPV', kursi: 7, transmisi: 'Manual', tarif: 280000 },
      { id: 6, nama: 'Toyota Fortuner', tipe: 'SUV', kursi: 7, transmisi: 'Matic', tarif: 900000 }
    ]);
  }
  if (!ambil('users', null)) {
    simpan('users', [
      { nama: 'Admin Sahabat', email: 'admin@sahabat.com', hp: '081200000001', password: 'admin123', role: 'admin' },
      { nama: 'Owner Sahabat', email: 'owner@sahabat.com', hp: '081200000002', password: 'owner123', role: 'owner' },
      { nama: 'Pelanggan Uji', email: 'pelanggan@sahabat.com', hp: '081200000003', password: 'pelanggan123', role: 'pelanggan' }
    ]);
  }
  if (!ambil('pesan', null)) simpan('pesan', []); // pesan masuk dari form kontak
})();

function cariMobil(id) { return ambil('cars', []).find(c => c.id == id); }

/* ============ 2. UTILITAS ============ */
const $ = id => document.getElementById(id);
function rupiah(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function hariIni() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}
function tgl(s) {
  return s ? new Date(s + 'T00:00:00').toLocaleDateString('id-ID',
    { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
}
function jumlahHari(m, s) {
  return Math.round((new Date(s + 'T00:00:00') - new Date(m + 'T00:00:00')) / 86400000) + 1;
}
function emailValid(e) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e); }
function hpValid(h) { return /^[0-9]{10,13}$/.test(h); }

/* Validasi rentang tanggal sewa -> pesan error atau '' jika valid */
function validasiTanggal(m, s) {
  if (!m || !s) return 'Tanggal mulai dan tanggal selesai wajib diisi.';
  if (m < hariIni()) return 'Tanggal mulai tidak boleh sebelum hari ini.';
  if (s < m) return 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.';
  return '';
}
function tampilError(id, pesan) {
  const e = $(id); if (!e) return;
  e.textContent = pesan || '';
  e.classList.toggle('show', !!pesan);
}
function toast(pesan, tipe) {
  const t = $('toast'); if (!t) return;
  t.textContent = pesan;
  t.className = 'toast show ' + (tipe || '');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.className = 'toast'; }, 3000);
}
function toggleMenu() { $('nav').classList.toggle('open'); }

/* ============ 3. AUTENTIKASI ============ */
function userAktif() { return ambil('session', null); }

function prosesLogin(email, pass) {
  email = String(email || '').trim().toLowerCase();
  if (!email || !pass) return { err: 'Email dan password wajib diisi.' };
  const u = ambil('users', []).find(x => x.email === email && x.password === pass);
  if (!u) return { err: 'Email atau password salah.' };
  simpan('session', { nama: u.nama, email: u.email, hp: u.hp, role: u.role });
  return { ok: true, user: u };
}

function prosesDaftar(data) {
  const nama = String(data.nama || '').trim();
  const email = String(data.email || '').trim().toLowerCase();
  const hp = String(data.hp || '').trim();
  const pass = data.pass || '', pass2 = data.pass2 || '';
  const users = ambil('users', []);
  let pesan = '';
  if (!nama || !email || !hp || !pass || !pass2) pesan = 'Semua kolom wajib diisi.';
  else if (!emailValid(email)) pesan = 'Format email tidak valid.';
  else if (!hpValid(hp)) pesan = 'Nomor HP harus berupa angka 10-13 digit.';
  else if (pass.length < 6) pesan = 'Password minimal 6 karakter.';
  else if (pass !== pass2) pesan = 'Ulangi password tidak sama.';
  else if (users.some(u => u.email === email)) pesan = 'Email sudah terdaftar.';
  if (pesan) return { err: pesan };
  users.push({ nama, email, hp, password: pass, role: 'pelanggan' });
  simpan('users', users);
  return { ok: true, email };
}

function logout() {
  localStorage.removeItem('srm_session');
  toast('Anda berhasil logout.');
  setTimeout(() => { location.href = 'login.html'; }, 400);
}

/* ============ 4. IKON & KOMPONEN BERSAMA ============ */
function ikon(nama, size) {
  const s = size || 16;
  const P = {
    menu: '<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>',
    cek: '<polyline points="4 12 9 17 20 6"/>',
    keluar: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    telepon: '<path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
    email: '<rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/>',
    lokasi: '<path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    jam: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 13.5"/>',
    kirim: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4Z"/>',
    kunci: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    biaya: '<circle cx="12" cy="12" r="9"/><path d="M9 9.5c.5-1 1.6-1.5 3-1.5 1.9 0 3 1 3 2.3 0 2.9-6 2.4-6 5.2 0 1.4 1.2 2.3 3 2.3 1.4 0 2.5-.5 3-1.5"/><line x1="12" y1="6" x2="12" y2="8"/><line x1="12" y1="18" x2="12" y2="20"/>',
    pantau: '<circle cx="12" cy="12" r="2"/><path d="M12 5a7 7 0 0 1 7 7"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 19a7 7 0 0 1-7-7"/><path d="M12 22A10 10 0 0 1 2 12"/>'
  };
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[nama] || ''}</svg>`;
}

function ikonMobil() {
  return `<svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M8 42 Q8 34 16 33 L26 20 Q30 15 38 15 L76 15 Q84 15 89 20 L100 31 Q112 32 112 40 L112 46 L8 46 Z" fill="currentColor"/>
    <path d="M31 31 L38 21 Q40 19 44 19 L56 19 L56 31 Z" fill="#F1EEE7"/>
    <path d="M60 19 L75 19 Q80 19 84 23 L91 31 L60 31 Z" fill="#F1EEE7"/>
    <rect x="102" y="35" width="8" height="4" rx="2" fill="#CFDC66"/>
    <circle cx="32" cy="46" r="9" fill="#272B2E"/><circle cx="32" cy="46" r="4" fill="#CFDC66"/>
    <circle cx="88" cy="46" r="9" fill="#272B2E"/><circle cx="88" cy="46" r="4" fill="#CFDC66"/>
  </svg>`;
}

function kartuMobil(c, badgeHtml, aksiHtml) {
  return `<div class="car-card">
    <div class="car-img"><span class="type-tag">${esc(c.tipe || 'Mobil')}</span>${badgeHtml ? `<span class="status-tag">${badgeHtml}</span>` : ''}${ikonMobil()}</div>
    <div class="car-body">
      <h3>${esc(c.nama)}</h3>
      <div class="chips"><span class="chip">${c.kursi} kursi</span><span class="chip">${esc(c.transmisi)}</span></div>
      <div class="car-foot"><div class="price">${rupiah(c.tarif)} <small>/ hari</small></div>${aksiHtml || ''}</div>
    </div>
  </div>`;
}

/* ============ 5. NAVBAR & FOOTER BERSAMA ============ */
function renderLayout() {
  const u = userAktif();
  const berkas = location.pathname.split('/').pop() || 'index.html';
  const aktif = f => f === berkas ? 'active' : '';

  const menu = [
    ['index.html', 'Beranda'],
    ['katalog.html', 'Katalog']
  ];
  if (!u) menu.push(['login.html', 'Login / Daftar']);
  menu.push(['kontak.html', 'Kontak']);

  const chip = u
    ? `<div class="user-chip"><span>${esc(u.nama.split(' ')[0])} <small>(${esc(u.role)})</small></span>
       <button class="btn-logout" onclick="logout()">${ikon('keluar', 13)} Logout</button></div>`
    : '';

  $('navbar-root').outerHTML = `
  <header class="navbar no-print">
    <div class="container navbar-inner">
      <a href="index.html" class="logo"><span class="logo-mark">SR</span><span>Sahabat <b>Rental Mobil</b></span></a>
      <button class="menu-toggle" onclick="toggleMenu()" aria-label="Buka menu">${ikon('menu')} Menu</button>
      <nav class="nav" id="nav">
        ${menu.map(m => `<a href="${m[0]}" class="${aktif(m[0])}">${m[1]}</a>`).join('')}
        ${chip}
      </nav>
    </div>
  </header>`;

  $('footer-root').outerHTML = `
  <footer class="footer no-print">
    <div class="container footer-grid">
      <div>
        <a href="index.html" class="logo"><span class="logo-mark">SR</span><span>Sahabat <b>Rental Mobil</b></span></a>
        <p class="mt-sm">Website rental mobil dengan pengecekan ketersediaan kendaraan sesuai tanggal sewa.</p>
      </div>
      <div>
        <h4>Menu</h4>
        <a href="index.html">Beranda</a>
        <a href="katalog.html">Katalog</a>
        <a href="login.html">Login / Daftar</a>
        <a href="kontak.html">Kontak</a>
      </div>
      <div>
        <h4>Proyek</h4>
        <p>Prototipe Website</p>
        <p>Kelompok SIOMAY</p>
      </div>
    </div>
    <div class="footer-bottom">&copy; 2026 Sahabat Rental Mobil - Kelompok SIOMAY</div>
  </footer>`;

  /* wadah toast */
  const t = document.createElement('div');
  t.id = 'toast';
  t.className = 'toast';
  document.body.appendChild(t);
}
renderLayout();

/* ============ 6. HALAMAN BERANDA ============ */
function cariBeranda() {
  const m = $('bk-mulai').value, s = $('bk-selesai').value;
  const pesan = validasiTanggal(m, s);
  if (pesan) return tampilError('bk-err', pesan);
  tampilError('bk-err', '');
  location.href = `katalog.html?mulai=${m}&selesai=${s}`;
}

/* Tombol Pesan (beranda & katalog): lanjut ke kontak dengan pesan terisi */
function pesanMobil(id) {
  const c = cariMobil(id);
  if (!c) return;
  const q = new URLSearchParams({ mobil: c.nama });
  if (typeof ktTanggal !== 'undefined' && ktTanggal.mulai && ktTanggal.selesai) {
    q.set('mulai', ktTanggal.mulai);
    q.set('selesai', ktTanggal.selesai);
  }
  location.href = 'kontak.html?' + q.toString();
}

function initBeranda() {
  $('fi-1').innerHTML = ikon('kunci', 22);
  $('fi-2').innerHTML = ikon('biaya', 22);
  $('fi-3').innerHTML = ikon('pantau', 22);

  const cars = ambil('cars', []);
  $('bk-unit').textContent = cars.length;
  $('bk-mulai').min = $('bk-selesai').min = hariIni();
  $('bk-list').innerHTML = cars.slice(0, 3).map(c =>
    kartuMobil(c, '', `<button class="btn btn-primary btn-small" onclick="pesanMobil(${c.id})">Pesan</button>`)
  ).join('');
}

/* ============ 7. HALAMAN KATALOG ============ */
let ktTanggal = { mulai: '', selesai: '' };

function tampilKatalog() {
  const m = $('kt-mulai').value, s = $('kt-selesai').value;
  const pesan = validasiTanggal(m, s);
  tampilError('kt-err', pesan);
  ktTanggal = pesan ? { mulai: '', selesai: '' } : { mulai: m, selesai: s };
  const cekTanggal = !pesan && !!m && !!s;

  const tr = $('kt-transmisi').value;
  const cari = $('kt-cari').value.trim().toLowerCase();
  const daftar = ambil('cars', []).filter(c =>
    (!tr || c.transmisi === tr) && (!cari || c.nama.toLowerCase().includes(cari)));

  $('kt-list').innerHTML = daftar.map(c => {
    if (!cekTanggal)
      return kartuMobil(c, '', `<button class="btn btn-primary btn-small" onclick="pesanMobil(${c.id})">Pesan</button>`);
    return kartuMobil(c,
      '<span class="badge badge-ok">Tersedia</span>',
      `<button class="btn btn-primary btn-small" onclick="pesanMobil(${c.id})">Pesan</button>`);
  }).join('') || '<div class="box empty">Mobil tidak ditemukan. Coba ubah filter pencarian.</div>';

  $('kt-info').textContent = cekTanggal
    ? `${daftar.length} mobil tersedia untuk ${tgl(m)} s/d ${tgl(s)} (${jumlahHari(m, s)} hari).`
    : `Menampilkan ${daftar.length} mobil. Pilih tanggal sewa untuk melihat ketersediaan.`;
}

function initKatalog() {
  const q = new URLSearchParams(location.search);
  $('kt-mulai').min = $('kt-selesai').min = hariIni();
  $('kt-mulai').value = q.get('mulai') || '';
  $('kt-selesai').value = q.get('selesai') || '';
  tampilKatalog();
}

/* ============ 8. HALAMAN LOGIN & DAFTAR ============ */
function pindahTab(tab) {
  const masuk = tab === 'masuk';
  $('tab-masuk').classList.toggle('active', masuk);
  $('tab-daftar').classList.toggle('active', !masuk);
  $('form-masuk').classList.toggle('hidden', !masuk);
  $('form-daftar').classList.toggle('hidden', masuk);
  $('demo-akun').classList.toggle('hidden', !masuk);
  $('info-daftar').classList.toggle('hidden', masuk);
  $('auth-judul').textContent = masuk ? 'Login' : 'Registrasi';
  $('auth-sub').textContent = masuk
    ? 'Masukkan email dan password yang sudah terdaftar.'
    : 'Lengkapi data diri di bawah ini.';
  tampilError('lg-err', '');
  tampilError('rg-err', '');
  history.replaceState(null, '', masuk ? '#masuk' : '#daftar');
}

function isiDemo(email, pass) {
  $('lg-email').value = email;
  $('lg-pass').value = pass;
  tampilError('lg-err', '');
}

function login(e) {
  e.preventDefault();
  const hasil = prosesLogin($('lg-email').value, $('lg-pass').value);
  if (hasil.err) { tampilError('lg-err', hasil.err); return false; }
  toast('Login berhasil. Selamat datang, ' + hasil.user.nama.split(' ')[0] + '!');
  setTimeout(() => { location.href = 'index.html'; }, 500);
  return false;
}

function daftar(e) {
  e.preventDefault();
  const hasil = prosesDaftar({
    nama: $('rg-nama').value,
    email: $('rg-email').value,
    hp: $('rg-hp').value,
    pass: $('rg-pass').value,
    pass2: $('rg-pass2').value
  });
  if (hasil.err) { tampilError('rg-err', hasil.err); return false; }
  toast('Registrasi berhasil. Silakan login.');
  pindahTab('masuk');
  $('lg-email').value = hasil.email;
  $('lg-pass').value = '';
  $('lg-pass').focus();
  return false;
}

function initAuth() {
  if (userAktif()) { location.replace('index.html'); return; }
  ['cl-1', 'cl-2', 'cl-3'].forEach(function (id) {
    const li = $(id);
    if (li) li.innerHTML = ikon('cek', 14) + li.innerHTML;
  });
  if (location.hash === '#daftar') pindahTab('daftar');
}

/* ============ 9. HALAMAN KONTAK ============ */
function kirimPesan(e) {
  e.preventDefault();
  const nama = $('kn-nama').value.trim();
  const email = $('kn-email').value.trim();
  const hp = $('kn-hp').value.trim();
  const subjek = $('kn-subjek').value;
  const pesan = $('kn-pesan').value.trim();

  let err = '';
  if (!nama || !email || !pesan) err = 'Nama, email, dan pesan wajib diisi.';
  else if (!emailValid(email)) err = 'Format email tidak valid.';
  else if (hp && !hpValid(hp)) err = 'Nomor HP harus berupa angka 10-13 digit.';
  else if (pesan.length < 10) err = 'Pesan terlalu pendek, tulis minimal 10 karakter.';
  if (err) { tampilError('kn-err', err); return false; }
  tampilError('kn-err', '');

  const daftar = ambil('pesan', []);
  daftar.push({ nama, email, hp, subjek, pesan, tanggal: hariIni() });
  simpan('pesan', daftar);

  toast('Pesan berhasil dikirim. Kami akan segera menghubungi Anda.');
  $('kn-subjek').value = 'Pemesanan Mobil';
  $('kn-pesan').value = '';
  $('kn-info').classList.remove('show');
  return false;
}

function initKontak() {
  /* ikon info kontak */
  $('ic-lokasi').innerHTML = ikon('lokasi', 18);
  $('ic-telepon').innerHTML = ikon('telepon', 18);
  $('ic-email').innerHTML = ikon('email', 18);
  $('ic-jam').innerHTML = ikon('jam', 18);
  $('ic-peta').innerHTML = ikon('lokasi', 34);
  $('kn-kirim').insertAdjacentHTML('afterbegin', ikon('kirim', 16));

  /* terisi otomatis dari sesi login */
  const u = userAktif();
  if (u) {
    $('kn-nama').value = u.nama;
    $('kn-email').value = u.email;
    if (u.hp) $('kn-hp').value = u.hp;
  }

  /* terisi otomatis dari tombol Pesan: kontak.html?mobil=..&mulai=..&selesai=.. */
  const q = new URLSearchParams(location.search);
  const mobil = q.get('mobil');
  if (mobil) {
    const m = q.get('mulai'), s = q.get('selesai');
    $('kn-subjek').value = 'Pemesanan Mobil';
    let teks = `Halo, saya ingin menyewa ${mobil}`;
    if (m && s) teks += ` untuk tanggal ${tgl(m)} sampai ${tgl(s)} (${jumlahHari(m, s)} hari)`;
    teks += '. Mohon info ketersediaannya. Terima kasih.';
    $('kn-pesan').value = teks;

    const info = $('kn-info');
    info.textContent = `Anda akan memesan: ${mobil}` + (m && s ? ` (${tgl(m)} - ${tgl(s)})` : '');
    info.classList.add('show');
  }
}

/* ============ 10. JALANKAN SESUAI HALAMAN ============ */
if ($('bk-list')) initBeranda();
if ($('kt-list')) initKatalog();
if ($('form-masuk')) initAuth();
if ($('kn-nama')) initKontak();
