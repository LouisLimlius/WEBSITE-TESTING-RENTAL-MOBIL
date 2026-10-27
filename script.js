/* =========================================================
   Sahabat Rental Mobil — js/script.js (Versi Bebas Error)
   ========================================================= */
'use strict';

/* ============ 0. KONSTANTA ============ */
var PREFIX = 'srm_';
var BIAYA_SOPIR = 150000;
var STATUS_PESANAN = ['Menunggu Konfirmasi', 'Dikonfirmasi', 'Sedang Disewa', 'Selesai', 'Dibatalkan'];
var STATUS_TIDAK_AKTIF = ['Selesai', 'Dibatalkan'];
var KELAS_STATUS = {
  'Menunggu Konfirmasi': 'badge-warn',
  'Dikonfirmasi': 'badge-ok',
  'Sedang Disewa': 'badge-dark',
  'Selesai': 'badge-done',
  'Dibatalkan': 'badge-no'
};
var INFO_BAYAR = {
  'QRIS': {
    judul: 'Pembayaran QRIS Instan',
    isi: 'Kode QRIS Merchant: <b>SRM-QRIS-20268891</b>. Pembayaran otomatis terverifikasi saat Anda menekan tombol bayar di bawah.'
  },
  'BCA Virtual Account': {
    judul: 'Nomor BCA Virtual Account: 8801 0812 0000 2026',
    isi: 'A.n. Sahabat Rental Mobil. Tagihan otomatis lunas setelah konfirmasi pembayaran.'
  },
  'Mandiri Virtual Account': {
    judul: 'Nomor Mandiri Virtual Account: 8902 0812 0000 2026',
    isi: 'A.n. Sahabat Rental Mobil. Tagihan otomatis lunas setelah konfirmasi pembayaran.'
  }
};

/* Tanggal yang sedang dipilih di katalog (dipakai saat menekan tombol "Pesan") */
var ktTanggal = { mulai: '', selesai: '' };

/* ============ 1. PENYIMPANAN & DATA AWAL (localStorage) ============ */
function ambil(k, d) {
  try {
    var v = localStorage.getItem(PREFIX + k);
    return v ? JSON.parse(v) : d;
  } catch (e) {
    return d;
  }
}

function simpan(k, v) {
  try {
    localStorage.setItem(PREFIX + k, JSON.stringify(v));
    return true;
  } catch (e) {
    toast('Gagal menyimpan data. Penyimpanan browser penuh atau diblokir.', 'err');
    return false;
  }
}

function hapusData(k) {
  try {
    localStorage.removeItem(PREFIX + k);
  } catch (e) { /* abaikan */ }
}

(function seed() {
  if (!Array.isArray(ambil('cars', null))) {
    simpan('cars', [
      { id: 1, nama: 'Toyota Avanza', tipe: 'MPV', kursi: 7, transmisi: 'Manual', tarif: 350000 },
      { id: 2, nama: 'Honda Brio', tipe: 'City Car', kursi: 5, transmisi: 'Matic', tarif: 300000 },
      { id: 3, nama: 'Toyota Innova Reborn', tipe: 'MPV', kursi: 7, transmisi: 'Matic', tarif: 550000 },
      { id: 4, nama: 'Mitsubishi Xpander', tipe: 'MPV', kursi: 7, transmisi: 'Matic', tarif: 450000 },
      { id: 5, nama: 'Daihatsu Sigra', tipe: 'MPV', kursi: 7, transmisi: 'Manual', tarif: 280000 },
      { id: 6, nama: 'Toyota Fortuner', tipe: 'SUV', kursi: 7, transmisi: 'Matic', tarif: 900000 }
    ]);
  }
  if (!Array.isArray(ambil('users', null))) {
    simpan('users', [
      { nama: 'Admin Sahabat', email: 'admin@sahabat.com', hp: '081200000001', password: 'admin123', role: 'admin' },
      { nama: 'Owner Sahabat', email: 'owner@sahabat.com', hp: '081200000002', password: 'owner123', role: 'owner' },
      { nama: 'Pelanggan Uji', email: 'pelanggan@sahabat.com', hp: '081200000003', password: 'pelanggan123', role: 'pelanggan' }
    ]);
  }
  if (!Array.isArray(ambil('bookings', null))) simpan('bookings', []);
  if (!Array.isArray(ambil('pesan', null))) simpan('pesan', []);
})();

function cariMobil(id) {
  var daftar = ambil('cars', []);
  for (var i = 0; i < daftar.length; i++) {
    if (Number(daftar[i].id) === Number(id)) return daftar[i];
  }
  return null;
}

/* ============ 2. UTILITAS ============ */
function $(id) {
  return document.getElementById(id);
}

function setHtml(id, html) {
  var el = $(id);
  if (el) el.innerHTML = html;
}

function setText(id, teks) {
  var el = $(id);
  if (el) el.textContent = teks;
}

function rupiah(n) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function hariIni() {
  var d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function formatTanggalValid(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) && !isNaN(new Date(s + 'T00:00:00').getTime());
}

function tgl(s) {
  if (!formatTanggalValid(s)) return '-';
  return new Date(s + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function jumlahHari(m, s) {
  return Math.round((new Date(s + 'T00:00:00') - new Date(m + 'T00:00:00')) / 86400000) + 1;
}

function emailValid(e) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
}

/* Hapus spasi, titik, dan tanda hubung agar "0812-3456-7890" tetap diterima */
function normalisasiHp(h) {
  return String(h || '').replace(/[\s.\-]/g, '');
}

function hpValid(h) {
  return /^[0-9]{10,13}$/.test(normalisasiHp(h));
}

function validasiTanggal(m, s) {
  if (!m || !s) return 'Tanggal mulai dan tanggal selesai wajib diisi.';
  if (!formatTanggalValid(m) || !formatTanggalValid(s)) return 'Format tanggal tidak valid.';
  if (m < hariIni()) return 'Tanggal mulai tidak boleh sebelum hari ini.';
  if (s < m) return 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.';
  return '';
}

/* Menjaga agar tanggal selesai tidak pernah lebih awal dari tanggal mulai */
function sinkronTanggal(idMulai, idSelesai) {
  var a = $(idMulai);
  var b = $(idSelesai);
  if (!a || !b) return;
  var min = hariIni();
  a.min = min;
  b.min = a.value && a.value > min ? a.value : min;
  if (a.value && b.value && b.value < a.value) b.value = a.value;
}

function pesananAktif(b) {
  return STATUS_TIDAK_AKTIF.indexOf(b.status) === -1;
}

/* kecualiKode: abaikan pesanan tertentu (dipakai saat mengaktifkan ulang pesanan) */
function mobilTersedia(carId, m, s, kecualiKode) {
  if (!m || !s) return true;
  var bookings = ambil('bookings', []);
  for (var i = 0; i < bookings.length; i++) {
    var b = bookings[i];
    if (Number(b.carId) !== Number(carId)) continue;
    if (kecualiKode && b.kode === kecualiKode) continue;
    if (!pesananAktif(b)) continue;
    if (!(s < b.mulai || m > b.selesai)) return false;
  }
  return true;
}

function jumlahPesananAktifMobil(carId) {
  var bookings = ambil('bookings', []);
  var n = 0;
  for (var i = 0; i < bookings.length; i++) {
    if (Number(bookings[i].carId) === Number(carId) && pesananAktif(bookings[i])) n++;
  }
  return n;
}

function hitungTotal(tarif, hari, layanan) {
  var sopir = layanan === 'Dengan Sopir' ? BIAYA_SOPIR * hari : 0;
  return { sopir: sopir, total: (Number(tarif) * hari) + sopir };
}

function kodeBaru(daftar) {
  var maks = 100;
  for (var i = 0; i < daftar.length; i++) {
    var n = parseInt(String(daftar[i].kode || '').replace(/\D/g, ''), 10);
    if (n > maks) maks = n;
  }
  return 'SRM-' + (maks + 1);
}

function badgeStatus(status) {
  return '<span class="badge ' + (KELAS_STATUS[status] || 'badge-dark') + '">' + esc(status) + '</span>';
}

function tampilError(id, pesan) {
  var e = $(id);
  if (!e) return;
  e.textContent = pesan || '';
  e.classList.toggle('show', !!pesan);
  if (pesan && e.scrollIntoView) e.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function pastikanToast() {
  if ($('toast') || !document.body) return;
  var t = document.createElement('div');
  t.id = 'toast';
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.setAttribute('aria-live', 'polite');
  document.body.appendChild(t);
}

var toastTimer = null;
function toast(pesan, tipe) {
  pastikanToast();
  var t = $('toast');
  if (!t) return;
  t.textContent = pesan;
  t.className = 'toast show ' + (tipe || '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    t.className = 'toast';
  }, 3200);
}

function toggleMenu(paksa) {
  var nav = $('nav');
  if (!nav) return;
  var buka = typeof paksa === 'boolean' ? paksa : !nav.classList.contains('open');
  nav.classList.toggle('open', buka);
  var btn = $('menu-toggle');
  if (btn) btn.setAttribute('aria-expanded', buka ? 'true' : 'false');
}

function pindahHalaman(url, jeda) {
  setTimeout(function () {
    location.href = url;
  }, jeda || 0);
}

/* ============ 3. AUTENTIKASI & HAK AKSES ============ */
function userAktif() {
  var u = ambil('session', null);
  return u && typeof u === 'object' && u.email && u.role ? u : null;
}

function adalahPengelola() {
  var u = userAktif();
  return !!u && (u.role === 'admin' || u.role === 'owner');
}

function adalahAdmin() {
  var u = userAktif();
  return !!u && u.role === 'admin';
}

function prosesLogin(email, pass) {
  email = String(email || '').trim().toLowerCase();
  if (!email || !pass) return { err: 'Email dan password wajib diisi.' };
  if (!emailValid(email)) return { err: 'Format email tidak valid.' };
  var users = ambil('users', []);
  var u = null;
  for (var i = 0; i < users.length; i++) {
    if (users[i].email === email && users[i].password === pass) {
      u = users[i];
      break;
    }
  }
  if (!u) return { err: 'Email atau password salah.' };
  if (!simpan('session', { nama: u.nama, email: u.email, hp: u.hp, role: u.role })) {
    return { err: 'Sesi login tidak dapat disimpan di browser ini.' };
  }
  return { ok: true, user: u };
}

function prosesDaftar(data) {
  var nama = String(data.nama || '').trim().replace(/\s+/g, ' ');
  var email = String(data.email || '').trim().toLowerCase();
  var hp = normalisasiHp(data.hp);
  var pass = data.pass || '';
  var pass2 = data.pass2 || '';
  var users = ambil('users', []);
  var sudahAda = false;

  for (var i = 0; i < users.length; i++) {
    if (users[i].email === email) {
      sudahAda = true;
      break;
    }
  }

  var pesan = '';
  if (!nama || !email || !hp || !pass || !pass2) pesan = 'Semua kolom wajib diisi.';
  else if (nama.length < 3) pesan = 'Nama lengkap minimal 3 karakter.';
  else if (!emailValid(email)) pesan = 'Format email tidak valid.';
  else if (!hpValid(hp)) pesan = 'Nomor HP harus berupa angka 10-13 digit.';
  else if (pass.length < 6) pesan = 'Password minimal 6 karakter.';
  else if (pass !== pass2) pesan = 'Ulangi password tidak sama.';
  else if (sudahAda) pesan = 'Email sudah terdaftar.';

  if (pesan) return { err: pesan };
  users.push({ nama: nama, email: email, hp: hp, password: pass, role: 'pelanggan' });
  if (!simpan('users', users)) return { err: 'Data akun gagal disimpan.' };
  return { ok: true, email: email };
}

function logout() {
  hapusData('session');
  toast('Anda berhasil logout.');
  pindahHalaman('login.html', 400);
}

/* ============ 4. LOGO WEBSITE & KARTU MOBIL ============ */
function logoSvg() {
  return '<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M5 19.5L8.2 11.5C8.8 10 10.2 9 11.8 9H20.2C21.8 9 23.2 10 23.8 11.5L27 19.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' +
    '<rect x="3.5" y="17.5" width="25" height="7.5" rx="3.5" fill="currentColor"/>' +
    '<circle cx="9.5" cy="21.2" r="2" fill="#CFDC66"/>' +
    '<circle cx="22.5" cy="21.2" r="2" fill="#CFDC66"/>' +
    '<path d="M13 14H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
    '</svg>';
}

function ikon(nama, size) {
  var s = size || 16;
  var P = {
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
  return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[nama] || '') + '</svg>';
}

function kartuMobil(c, badgeHtml, aksiHtml) {
  return '<article class="car-card">' +
    '<div class="car-top">' +
      '<span class="type-tag">' + esc(c.tipe || 'Mobil') + '</span>' +
      (badgeHtml || '') +
    '</div>' +
    '<div class="car-body">' +
      '<h3>' + esc(c.nama) + '</h3>' +
      '<div class="chips">' +
        '<span class="chip">' + (Number(c.kursi) || 7) + ' Kursi</span>' +
        '<span class="chip">Transmisi ' + esc(c.transmisi) + '</span>' +
        '<span class="chip">Lepas Kunci / Sopir</span>' +
      '</div>' +
      '<div class="car-foot">' +
        '<div class="price">' + rupiah(c.tarif) + ' <small>/ hari</small></div>' +
        (aksiHtml || '') +
      '</div>' +
    '</div>' +
  '</article>';
}

function tombolPesanKartu(carId, tersedia) {
  if (adalahPengelola()) {
    return '<button type="button" class="btn btn-small" disabled title="Admin & Owner tidak dapat memesan">Khusus Pelanggan</button>';
  }
  if (tersedia === false) {
    return '<button type="button" class="btn btn-small" disabled>Tidak Tersedia</button>';
  }
  return '<button type="button" class="btn btn-primary btn-small" onclick="pesanMobil(' + Number(carId) + ')">Pesan</button>';
}

/* ============ 5. NAVBAR & FOOTER BERSAMA ============ */
function renderLayout() {
  var u = userAktif();
  var pathParts = location.pathname.split('/');
  var berkas = pathParts[pathParts.length - 1] || 'index.html';

  var menu = [
    ['index.html', 'Beranda'],
    ['katalog.html', 'Katalog']
  ];
  if (u && u.role === 'pelanggan') {
    menu.push(['pesan.html', 'Pemesanan']);
  }
  if (u && (u.role === 'admin' || u.role === 'owner')) {
    menu.push(['dashboard.html', 'Dashboard']);
  }
  if (!u) {
    menu.push(['login.html', 'Login / Daftar']);
  }
  menu.push(['kontak.html', 'Kontak']);

  var linkHtml = '';
  for (var i = 0; i < menu.length; i++) {
    var aktif = menu[i][0] === berkas;
    linkHtml += '<a href="' + menu[i][0] + '"' + (aktif ? ' class="active" aria-current="page"' : '') + '>' + menu[i][1] + '</a>';
  }

  var chip = '';
  if (u) {
    var namaDepan = u.nama ? u.nama.split(' ')[0] : 'User';
    chip = '<div class="user-chip"><span>' + esc(namaDepan) + ' <small>(' + esc(u.role) + ')</small></span>' +
      '<button type="button" class="btn-logout" onclick="logout()">' + ikon('keluar', 13) + ' Logout</button></div>';
  }

  var navRoot = $('navbar-root');
  if (navRoot) {
    navRoot.outerHTML = '<header class="navbar no-print">' +
      '<div class="container navbar-inner">' +
        '<a href="index.html" class="logo" aria-label="Sahabat Rental Mobil - Beranda">' +
          '<span class="logo-mark">' + logoSvg() + '</span>' +
          '<span>Sahabat <b>Rental Mobil</b></span>' +
        '</a>' +
        '<button type="button" class="menu-toggle" id="menu-toggle" onclick="toggleMenu()" aria-label="Buka menu" aria-controls="nav" aria-expanded="false">' + ikon('menu') + ' Menu</button>' +
        '<nav class="nav" id="nav" aria-label="Navigasi utama">' + linkHtml + chip + '</nav>' +
      '</div>' +
    '</header>';
  }

  var footRoot = $('footer-root');
  if (footRoot) {
    footRoot.outerHTML = '<footer class="footer no-print">' +
      '<div class="container footer-grid">' +
        '<div>' +
          '<a href="index.html" class="logo">' +
            '<span class="logo-mark">' + logoSvg() + '</span>' +
            '<span>Sahabat <b>Rental Mobil</b></span>' +
          '</a>' +
          '<p class="mt-sm">Layanan sewa mobil online dengan pengecekan jadwal otomatis dan pembayaran instan.</p>' +
        '</div>' +
        '<div>' +
          '<h4>Menu Navigasi</h4>' +
          '<a href="index.html">Beranda</a>' +
          '<a href="katalog.html">Katalog Kendaraan</a>' +
          '<a href="kontak.html">Hubungi Kami</a>' +
        '</div>' +
        '<div>' +
          '<h4>Lokasi</h4>' +
          '<p>Universitas Mikroskil, Building B</p>' +
          '<p>Medan, Sumatera Utara</p>' +
        '</div>' +
      '</div>' +
      '<div class="footer-bottom">&copy; ' + new Date().getFullYear() + ' Sahabat Rental Mobil - Kelompok SIOMAY</div>' +
    '</footer>';
  }

  /* Tautan "lewati ke konten" untuk pengguna keyboard / pembaca layar */
  var main = document.querySelector('main');
  if (main) {
    if (!main.id) main.id = 'konten';
    main.setAttribute('tabindex', '-1');
    if (!document.querySelector('.skip-link')) {
      document.body.insertAdjacentHTML('afterbegin', '<a href="#' + main.id + '" class="skip-link">Lewati ke konten utama</a>');
    }
  }

  pastikanToast();

  /* Tutup menu HP saat menekan Escape atau klik di luar navbar */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') toggleMenu(false);
  });
  document.addEventListener('click', function (e) {
    var nav = $('nav');
    if (nav && nav.classList.contains('open') && !e.target.closest('.navbar')) toggleMenu(false);
  });
}

/* ============ 6. HALAMAN BERANDA ============ */
function cariBeranda(e) {
  if (e) e.preventDefault();
  var m = $('bk-mulai').value;
  var s = $('bk-selesai').value;
  var pesan = validasiTanggal(m, s);
  if (pesan) {
    tampilError('bk-err', pesan);
    return false;
  }
  tampilError('bk-err', '');
  location.href = 'katalog.html?mulai=' + encodeURIComponent(m) + '&selesai=' + encodeURIComponent(s);
  return false;
}

function pesanMobil(id) {
  var u = userAktif();
  if (u && (u.role === 'admin' || u.role === 'owner')) {
    toast('Akun Admin dan Owner tidak dapat melakukan pemesanan mobil.', 'err');
    return;
  }
  if (!cariMobil(id)) {
    toast('Data mobil tidak ditemukan. Silakan muat ulang halaman.', 'err');
    return;
  }
  var q = new URLSearchParams({ mobil: id });
  if (ktTanggal.mulai && ktTanggal.selesai) {
    q.set('mulai', ktTanggal.mulai);
    q.set('selesai', ktTanggal.selesai);
  }
  if (!u) {
    simpan('pending_order', q.toString());
    toast('Silakan login sebagai pelanggan terlebih dahulu untuk memesan.');
    pindahHalaman('login.html', 500);
    return;
  }
  location.href = 'pesan.html?' + q.toString();
}

function initBeranda() {
  setHtml('fi-1', ikon('kunci', 22));
  setHtml('fi-2', ikon('biaya', 22));
  setHtml('fi-3', ikon('pantau', 22));

  if (userAktif() && $('hero-btn-daftar')) {
    $('hero-btn-daftar').classList.add('hidden');
  }

  var cars = ambil('cars', []);
  setText('bk-unit', cars.length);
  sinkronTanggal('bk-mulai', 'bk-selesai');
  if ($('bk-mulai')) {
    $('bk-mulai').addEventListener('change', function () {
      sinkronTanggal('bk-mulai', 'bk-selesai');
    });
  }

  var html = '';
  var batas = Math.min(cars.length, 3);
  for (var i = 0; i < batas; i++) {
    html += kartuMobil(cars[i], '<span class="badge badge-ok">Siap Jalan</span>', tombolPesanKartu(cars[i].id, true));
  }
  if (!html) {
    html = '<div class="box empty">Belum ada unit kendaraan yang tersedia.</div>';
  }
  setHtml('bk-list', html);
}

/* ============ 7. HALAMAN KATALOG ============ */
function tampilKatalog() {
  sinkronTanggal('kt-mulai', 'kt-selesai');
  var m = $('kt-mulai') ? $('kt-mulai').value : '';
  var s = $('kt-selesai') ? $('kt-selesai').value : '';

  /* Validasi hanya jika kedua tanggal sudah dipilih agar tidak mengganggu saat mengisi */
  var pesan = (m && s) ? validasiTanggal(m, s) : '';
  tampilError('kt-err', pesan);

  ktTanggal = (!pesan && m && s) ? { mulai: m, selesai: s } : { mulai: '', selesai: '' };
  var cekTanggal = !!ktTanggal.mulai && !!ktTanggal.selesai;

  var tr = $('kt-transmisi') ? $('kt-transmisi').value : '';
  var cari = $('kt-cari') ? $('kt-cari').value.trim().toLowerCase() : '';
  var semuaMobil = ambil('cars', []);
  var daftar = [];

  for (var i = 0; i < semuaMobil.length; i++) {
    var c = semuaMobil[i];
    var cocokTr = !tr || c.transmisi === tr;
    var cocokCari = !cari || String(c.nama).toLowerCase().indexOf(cari) !== -1 || String(c.tipe).toLowerCase().indexOf(cari) !== -1;
    if (cocokTr && cocokCari) daftar.push(c);
  }

  var jmlTersedia = 0;
  var html = '';
  for (var j = 0; j < daftar.length; j++) {
    var item = daftar[j];
    var tersedia = cekTanggal ? mobilTersedia(item.id, m, s) : true;
    if (tersedia) jmlTersedia++;
    var badge = tersedia
      ? '<span class="badge badge-ok">Tersedia</span>'
      : '<span class="badge badge-no">Sudah Dipesan</span>';
    html += kartuMobil(item, badge, tombolPesanKartu(item.id, tersedia));
  }

  if (!html) {
    html = '<div class="box empty">Mobil tidak ditemukan. Coba ubah filter pencarian.</div>';
  }
  setHtml('kt-list', html);

  var infoTeks;
  if (cekTanggal) {
    infoTeks = jmlTersedia + ' dari ' + daftar.length + ' mobil tersedia untuk ' + tgl(m) + ' s/d ' + tgl(s) + ' (' + jumlahHari(m, s) + ' hari).';
  } else if ((m && !s) || (!m && s)) {
    infoTeks = 'Menampilkan ' + daftar.length + ' unit mobil. Lengkapi tanggal ' + (m ? 'selesai' : 'mulai') + ' untuk mengecek jadwal kosong.';
  } else {
    infoTeks = 'Menampilkan ' + daftar.length + ' unit mobil. Pilih tanggal mulai & selesai untuk mengecek jadwal kosong.';
  }
  setText('kt-info', infoTeks);
}

function initKatalog() {
  var q = new URLSearchParams(location.search);
  var mulai = q.get('mulai');
  var selesai = q.get('selesai');
  if ($('kt-mulai')) $('kt-mulai').value = formatTanggalValid(mulai) ? mulai : '';
  if ($('kt-selesai')) $('kt-selesai').value = formatTanggalValid(selesai) ? selesai : '';
  tampilKatalog();
}

/* ============ 8. HALAMAN PEMESANAN & PEMBAYARAN (pesan.html) ============ */
function metodeTerpilih() {
  var el = document.querySelector('input[name="metode_bayar"]:checked');
  return el && INFO_BAYAR[el.value] ? el.value : 'QRIS';
}

function ubahMetodeBayar() {
  var box = $('instruksi-bayar');
  if (!box) return;
  var info = INFO_BAYAR[metodeTerpilih()];
  box.innerHTML = '<p><b>' + info.judul + '</b></p><p class="pay-note">' + info.isi + '</p>';
}

function hitungBiayaSewa() {
  if (!$('ps-mobil')) return;
  sinkronTanggal('ps-mulai', 'ps-selesai');

  var carId = $('ps-mobil').value;
  var m = $('ps-mulai').value;
  var s = $('ps-selesai').value;
  var layanan = $('ps-layanan').value;
  var mobil = cariMobil(carId);
  var tombol = $('btn-submit-pesan');

  setText('sum-mobil', mobil ? mobil.nama : '-');
  setText('sum-tarif', mobil ? rupiah(mobil.tarif) : 'Rp 0');
  setText('sum-layanan', layanan);

  if (!mobil || validasiTanggal(m, s)) {
    setText('sum-durasi', '0 Hari');
    setText('sum-total', 'Rp 0');
    setHtml('sum-status', '<span class="badge badge-dark">Pilih Tanggal Valid</span>');
    if (tombol) tombol.disabled = !mobil;
    return;
  }

  var hari = jumlahHari(m, s);
  var biaya = hitungTotal(mobil.tarif, hari, layanan);
  var tersedia = mobilTersedia(carId, m, s);

  setText('sum-durasi', hari + ' Hari');
  setText('sum-layanan', biaya.sopir ? layanan + ' (+' + rupiah(biaya.sopir) + ')' : layanan);
  setText('sum-total', rupiah(biaya.total));
  setHtml('sum-status', tersedia
    ? '<span class="badge badge-ok">Jadwal Tersedia</span>'
    : '<span class="badge badge-no">Jadwal Bentrok / Penuh</span>');
  if (tombol) tombol.disabled = !tersedia;
}

function buatPesanan(e) {
  e.preventDefault();
  var u = userAktif();
  if (!u) {
    location.href = 'login.html';
    return false;
  }
  if (u.role !== 'pelanggan') {
    tampilError('ps-err', 'Admin dan Owner tidak diizinkan membuat pemesanan.');
    return false;
  }

  var carId = Number($('ps-mobil').value);
  var m = $('ps-mulai').value;
  var s = $('ps-selesai').value;
  var layanan = $('ps-layanan').value === 'Dengan Sopir' ? 'Dengan Sopir' : 'Lepas Kunci';
  var catatan = $('ps-catatan').value.trim().slice(0, 300);
  var metode = metodeTerpilih();
  var mobil = cariMobil(carId);

  if (!mobil) {
    tampilError('ps-err', 'Silakan pilih kendaraan yang valid.');
    return false;
  }
  var errTgl = validasiTanggal(m, s);
  if (errTgl) {
    tampilError('ps-err', errTgl);
    return false;
  }
  if (!mobilTersedia(carId, m, s)) {
    tampilError('ps-err', 'Maaf, mobil ini sudah dipesan pada tanggal tersebut. Silakan pilih tanggal atau mobil lain.');
    hitungBiayaSewa();
    return false;
  }
  tampilError('ps-err', '');

  var hari = jumlahHari(m, s);
  var biaya = hitungTotal(mobil.tarif, hari, layanan);

  var daftar = ambil('bookings', []);
  var kode = kodeBaru(daftar);
  daftar.unshift({
    kode: kode,
    carId: mobil.id,
    namaMobil: mobil.nama,
    namaPelanggan: u.nama,
    emailPelanggan: u.email,
    hpPelanggan: u.hp || '-',
    mulai: m,
    selesai: s,
    hari: hari,
    layanan: layanan,
    metodeBayar: metode,
    statusBayar: 'Lunas',
    status: 'Menunggu Konfirmasi',
    total: biaya.total,
    catatan: catatan,
    dibuat: new Date().toISOString()
  });
  if (!simpan('bookings', daftar)) return false;

  toast('Pembayaran berhasil! Pesanan ' + kode + ' telah tercatat.');
  $('ps-catatan').value = '';
  hitungBiayaSewa();
  renderRiwayatPelanggan();
  if ($('riwayat')) $('riwayat').scrollIntoView({ behavior: 'smooth', block: 'start' });
  return false;
}

function batalkanPesananSaya(kode) {
  var u = userAktif();
  if (!u) return;
  var daftar = ambil('bookings', []);
  for (var i = 0; i < daftar.length; i++) {
    var b = daftar[i];
    if (b.kode !== kode || b.emailPelanggan !== u.email) continue;
    if (b.status !== 'Menunggu Konfirmasi') {
      toast('Pesanan ini sudah diproses sehingga tidak dapat dibatalkan.', 'err');
      renderRiwayatPelanggan();
      return;
    }
    if (!confirm('Batalkan pesanan ' + kode + '? Jadwal mobil akan dibuka kembali dan dana dikembalikan.')) return;
    b.status = 'Dibatalkan';
    b.statusBayar = 'Dikembalikan';
    if (simpan('bookings', daftar)) toast('Pesanan ' + kode + ' berhasil dibatalkan.');
    renderRiwayatPelanggan();
    hitungBiayaSewa();
    return;
  }
}

function renderRiwayatPelanggan() {
  var u = userAktif();
  var tbody = $('tb-riwayat-pelanggan');
  if (!tbody || !u) return;

  var semua = ambil('bookings', []);
  var html = '';
  for (var i = 0; i < semua.length; i++) {
    var b = semua[i];
    if (b.emailPelanggan !== u.email) continue;
    var aksi = b.status === 'Menunggu Konfirmasi'
      ? '<button type="button" class="btn btn-outline btn-small" data-kode="' + esc(b.kode) + '" onclick="batalkanPesananSaya(this.dataset.kode)">Batalkan</button>'
      : '<span class="muted">-</span>';
    html += '<tr>' +
      '<td><b>' + esc(b.kode) + '</b></td>' +
      '<td>' + esc(b.namaMobil) + '</td>' +
      '<td>' + tgl(b.mulai) + ' - ' + tgl(b.selesai) + ' (' + Number(b.hari || 0) + ' hari)</td>' +
      '<td>' + esc(b.layanan) + '</td>' +
      '<td><b>' + rupiah(b.total) + '</b></td>' +
      '<td><span class="badge ' + (b.statusBayar === 'Lunas' ? 'badge-ok' : 'badge-done') + '">' + esc(b.metodeBayar) + ' (' + esc(b.statusBayar) + ')</span></td>' +
      '<td>' + badgeStatus(b.status) + '</td>' +
      '<td>' + aksi + '</td>' +
    '</tr>';
  }
  if (!html) {
    html = '<tr><td colspan="8" class="center muted">Belum ada riwayat pemesanan.</td></tr>';
  }
  tbody.innerHTML = html;
}

function initPesan() {
  var u = userAktif();
  if (!u) {
    toast('Silakan login terlebih dahulu untuk memesan mobil.');
    pindahHalaman('login.html', 400);
    return;
  }
  if (u.role === 'admin' || u.role === 'owner') {
    toast('Akun Admin dan Owner tidak dapat melakukan pemesanan mobil.', 'err');
    pindahHalaman('dashboard.html', 500);
    return;
  }

  setText('sum-nama', u.nama);
  var cars = ambil('cars', []);
  if (!cars.length) {
    setHtml('ps-mobil', '<option value="">Belum ada kendaraan tersedia</option>');
    if ($('btn-submit-pesan')) $('btn-submit-pesan').disabled = true;
    tampilError('ps-err', 'Belum ada unit kendaraan yang dapat dipesan saat ini.');
    ubahMetodeBayar();
    renderRiwayatPelanggan();
    return;
  }

  var opsiHtml = '';
  for (var i = 0; i < cars.length; i++) {
    var c = cars[i];
    opsiHtml += '<option value="' + Number(c.id) + '">' + esc(c.nama) + ' — ' + rupiah(c.tarif) + '/hari (' + esc(c.transmisi) + ')</option>';
  }
  setHtml('ps-mobil', opsiHtml);

  var q = new URLSearchParams(location.search);
  var hari = hariIni();
  var mobilQ = q.get('mobil');
  var mulaiQ = q.get('mulai');
  var selesaiQ = q.get('selesai');

  if (mobilQ && cariMobil(mobilQ)) $('ps-mobil').value = String(Number(mobilQ));
  $('ps-mulai').value = formatTanggalValid(mulaiQ) && mulaiQ >= hari ? mulaiQ : hari;
  $('ps-selesai').value = formatTanggalValid(selesaiQ) && selesaiQ >= $('ps-mulai').value ? selesaiQ : $('ps-mulai').value;

  ubahMetodeBayar();
  hitungBiayaSewa();
  renderRiwayatPelanggan();
}

/* ============ 9. HALAMAN DASHBOARD ADMIN & OWNER ============ */
function resetFormMobil() {
  if (!$('adm-id')) return;
  $('adm-id').value = '';
  $('adm-nama').value = '';
  $('adm-tarif').value = '';
  if ($('adm-kursi')) $('adm-kursi').value = '7';
  $('adm-tipe').selectedIndex = 0;
  $('adm-transmisi').selectedIndex = 0;
  setText('adm-btn-simpan', 'Tambah Unit');
  if ($('adm-btn-batal')) $('adm-btn-batal').classList.add('hidden');
  tampilError('adm-err', '');
}

function simpanMobilAdmin(e) {
  e.preventDefault();
  if (!adalahAdmin()) {
    toast('Hanya Admin yang dapat mengelola data kendaraan.', 'err');
    return false;
  }

  var id = Number($('adm-id').value) || 0;
  var nama = $('adm-nama').value.trim().replace(/\s+/g, ' ');
  var tipe = $('adm-tipe').value;
  var transmisi = $('adm-transmisi').value;
  var kursi = $('adm-kursi') ? parseInt($('adm-kursi').value, 10) : 7;
  var tarif = Number($('adm-tarif').value);
  var cars = ambil('cars', []);

  var duplikat = false;
  for (var d = 0; d < cars.length; d++) {
    if (Number(cars[d].id) !== id && String(cars[d].nama).toLowerCase() === nama.toLowerCase()) {
      duplikat = true;
      break;
    }
  }

  var err = '';
  if (!nama) err = 'Nama mobil wajib diisi.';
  else if (nama.length > 60) err = 'Nama mobil maksimal 60 karakter.';
  else if (duplikat) err = 'Nama mobil sudah ada di daftar armada.';
  else if (!kursi || kursi < 2 || kursi > 20) err = 'Jumlah kursi harus antara 2 sampai 20.';
  else if (!tarif || tarif <= 0 || Math.floor(tarif) !== tarif) err = 'Tarif harian harus berupa angka bulat lebih dari 0.';

  if (err) {
    tampilError('adm-err', err);
    return false;
  }
  tampilError('adm-err', '');

  if (id) {
    var ketemu = false;
    for (var i = 0; i < cars.length; i++) {
      if (Number(cars[i].id) === id) {
        cars[i].nama = nama;
        cars[i].tipe = tipe;
        cars[i].transmisi = transmisi;
        cars[i].kursi = kursi;
        cars[i].tarif = tarif;
        ketemu = true;
        break;
      }
    }
    if (!ketemu) {
      tampilError('adm-err', 'Data kendaraan yang diedit sudah tidak ada.');
      return false;
    }
  } else {
    var maxId = 0;
    for (var j = 0; j < cars.length; j++) {
      if (Number(cars[j].id) > maxId) maxId = Number(cars[j].id);
    }
    cars.push({ id: maxId + 1, nama: nama, tipe: tipe, kursi: kursi, transmisi: transmisi, tarif: tarif });
  }

  if (!simpan('cars', cars)) return false;
  toast(id ? 'Data kendaraan berhasil diperbarui.' : 'Unit kendaraan berhasil ditambahkan.');
  resetFormMobil();
  renderDashboard();
  return false;
}

function editMobilAdmin(id) {
  var c = cariMobil(id);
  if (!c || !$('adm-id')) return;
  $('adm-id').value = c.id;
  $('adm-nama').value = c.nama;
  $('adm-tipe').value = c.tipe;
  $('adm-transmisi').value = c.transmisi;
  if ($('adm-kursi')) $('adm-kursi').value = Number(c.kursi) || 7;
  $('adm-tarif').value = c.tarif;
  setText('adm-btn-simpan', 'Simpan Perubahan');
  if ($('adm-btn-batal')) $('adm-btn-batal').classList.remove('hidden');
  tampilError('adm-err', '');
  $('panel-admin-mobil').scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('adm-nama').focus({ preventScroll: true });
}

function hapusMobilAdmin(id) {
  if (!adalahAdmin()) return;
  var c = cariMobil(id);
  if (!c) return;

  var aktif = jumlahPesananAktifMobil(id);
  if (aktif > 0) {
    toast('Tidak dapat menghapus ' + c.nama + ': masih ada ' + aktif + ' pesanan aktif.', 'err');
    return;
  }
  if (!confirm('Hapus unit "' + c.nama + '" dari daftar armada?')) return;

  var cars = ambil('cars', []);
  var baru = [];
  for (var i = 0; i < cars.length; i++) {
    if (Number(cars[i].id) !== Number(id)) baru.push(cars[i]);
  }
  if (!simpan('cars', baru)) return;
  if (Number($('adm-id').value) === Number(id)) resetFormMobil();
  toast('Unit kendaraan dihapus.');
  renderDashboard();
}

function ubahStatusPesanan(kode, statusBaru) {
  if (!adalahAdmin() || STATUS_PESANAN.indexOf(statusBaru) === -1) {
    renderDashboard();
    return;
  }
  var daftar = ambil('bookings', []);
  var b = null;
  for (var i = 0; i < daftar.length; i++) {
    if (daftar[i].kode === kode) {
      b = daftar[i];
      break;
    }
  }
  if (!b || b.status === statusBaru) return;

  /* Cegah bentrok jadwal saat pesanan Selesai/Dibatalkan diaktifkan kembali */
  var diaktifkanLagi = !pesananAktif(b) && STATUS_TIDAK_AKTIF.indexOf(statusBaru) === -1;
  if (diaktifkanLagi && !mobilTersedia(b.carId, b.mulai, b.selesai, b.kode)) {
    toast('Tidak dapat mengaktifkan kembali ' + kode + ': jadwal mobil sudah dipesan pelanggan lain.', 'err');
    renderDashboard();
    return;
  }
  if (statusBaru === 'Dibatalkan' && !confirm('Batalkan pesanan ' + kode + '? Jadwal mobil akan dibuka kembali.')) {
    renderDashboard();
    return;
  }

  b.status = statusBaru;
  b.statusBayar = statusBaru === 'Dibatalkan' ? 'Dikembalikan' : 'Lunas';
  if (simpan('bookings', daftar)) {
    toast('Status pesanan ' + kode + ' diperbarui menjadi ' + statusBaru + '.');
  }
  renderDashboard();
}

function renderDashboard() {
  var u = userAktif();
  if (!u || (u.role !== 'admin' && u.role !== 'owner')) {
    location.replace('login.html');
    return;
  }

  var isOwner = u.role === 'owner';
  setText('db-role-label', isOwner ? 'Dashboard Owner' : 'Dashboard Admin');
  setText('db-title', isOwner ? 'Laporan & Monitoring Usaha' : 'Pengelolaan Armada & Reservasi');
  setText('db-subtitle', isOwner
    ? 'Pantau ringkasan armada, pesanan, dan pendapatan usaha secara real-time.'
    : 'Kelola armada, validasi pesanan pelanggan, dan pantau laporan transaksi.');

  if (isOwner) {
    if ($('panel-admin-mobil')) $('panel-admin-mobil').classList.add('hidden');
    if ($('kolom-aksi-admin')) $('kolom-aksi-admin').classList.add('hidden');
  }

  var cars = ambil('cars', []);
  var bookings = ambil('bookings', []);
  var totalPendapatan = 0;
  for (var i = 0; i < bookings.length; i++) {
    if (bookings[i].status !== 'Dibatalkan') {
      totalPendapatan += Number(bookings[i].total || 0);
    }
  }

  setText('st-unit', cars.length + ' Unit');
  setText('st-pesanan', bookings.length + ' Pesanan');
  setText('st-pendapatan', rupiah(totalPendapatan));

  if (!isOwner && $('tb-admin-mobil')) {
    var htmlMobil = '';
    for (var j = 0; j < cars.length; j++) {
      var c = cars[j];
      htmlMobil += '<tr>' +
        '<td><b>' + esc(c.nama) + '</b></td>' +
        '<td>' + esc(c.tipe) + '</td>' +
        '<td>' + esc(c.transmisi) + '</td>' +
        '<td>' + (Number(c.kursi) || 7) + '</td>' +
        '<td>' + rupiah(c.tarif) + '</td>' +
        '<td><div class="aksi-group">' +
          '<button type="button" class="btn btn-outline btn-small" onclick="editMobilAdmin(' + Number(c.id) + ')">Edit</button>' +
          '<button type="button" class="btn btn-outline btn-small btn-danger" onclick="hapusMobilAdmin(' + Number(c.id) + ')">Hapus</button>' +
        '</div></td>' +
      '</tr>';
    }
    if (!htmlMobil) {
      htmlMobil = '<tr><td colspan="6" class="center muted">Belum ada unit kendaraan.</td></tr>';
    }
    $('tb-admin-mobil').innerHTML = htmlMobil;
  }

  var htmlPesanan = '';
  for (var k = 0; k < bookings.length; k++) {
    var b = bookings[k];
    var kolomAksi = '';

    if (!isOwner) {
      var selectHtml = '<select class="select-sm" data-kode="' + esc(b.kode) + '" onchange="ubahStatusPesanan(this.dataset.kode, this.value)" aria-label="Ubah status pesanan ' + esc(b.kode) + '">';
      for (var s = 0; s < STATUS_PESANAN.length; s++) {
        var st = STATUS_PESANAN[s];
        var sel = b.status === st ? ' selected' : '';
        selectHtml += '<option' + sel + '>' + st + '</option>';
      }
      selectHtml += '</select>';
      kolomAksi = '<td class="kolom-aksi">' + selectHtml + '</td>';
    }

    htmlPesanan += '<tr>' +
      '<td><b>' + esc(b.kode) + '</b></td>' +
      '<td>' + esc(b.namaPelanggan) + '<br><small>' + esc(b.hpPelanggan) + '</small></td>' +
      '<td>' + esc(b.namaMobil) + (b.catatan ? '<br><small title="Catatan pelanggan">' + esc(b.catatan) + '</small>' : '') + '</td>' +
      '<td>' + tgl(b.mulai) + ' - ' + tgl(b.selesai) + '<br><small>' + Number(b.hari || 0) + ' hari</small></td>' +
      '<td>' + esc(b.layanan) + '</td>' +
      '<td><span class="badge ' + (b.statusBayar === 'Lunas' ? 'badge-ok' : 'badge-done') + '">' + esc(b.metodeBayar) + '</span></td>' +
      '<td><b>' + rupiah(b.total) + '</b></td>' +
      '<td>' + badgeStatus(b.status) + '</td>' +
      kolomAksi +
    '</tr>';
  }

  if (!htmlPesanan) {
    var span = isOwner ? 8 : 9;
    htmlPesanan = '<tr><td colspan="' + span + '" class="center muted">Belum ada data transaksi pemesanan.</td></tr>';
  }
  setHtml('tb-admin-pesanan', htmlPesanan);
}

/* ============ 10. HALAMAN LOGIN & DAFTAR ============ */
function pindahTab(tab, fokus) {
  var masuk = tab === 'masuk';
  if ($('tab-masuk')) {
    $('tab-masuk').classList.toggle('active', masuk);
    $('tab-masuk').setAttribute('aria-selected', masuk ? 'true' : 'false');
  }
  if ($('tab-daftar')) {
    $('tab-daftar').classList.toggle('active', !masuk);
    $('tab-daftar').setAttribute('aria-selected', masuk ? 'false' : 'true');
  }
  if ($('form-masuk')) $('form-masuk').classList.toggle('hidden', !masuk);
  if ($('form-daftar')) $('form-daftar').classList.toggle('hidden', masuk);
  setText('auth-judul', masuk ? 'Login' : 'Registrasi');
  setText('auth-sub', masuk
    ? 'Masukkan email dan password yang sudah terdaftar.'
    : 'Lengkapi data diri di bawah ini untuk membuat akun pelanggan.');
  tampilError('lg-err', '');
  tampilError('rg-err', '');
  history.replaceState(null, '', masuk ? '#masuk' : '#daftar');
  if (fokus) {
    var input = $(masuk ? 'lg-email' : 'rg-nama');
    if (input) input.focus();
  }
}

function login(e) {
  e.preventDefault();
  var hasil = prosesLogin($('lg-email').value, $('lg-pass').value);
  if (hasil.err) {
    tampilError('lg-err', hasil.err);
    $('lg-pass').value = '';
    return false;
  }
  tampilError('lg-err', '');

  toast('Login berhasil. Selamat datang, ' + String(hasil.user.nama).split(' ')[0] + '!');
  var pending = ambil('pending_order', null);
  hapusData('pending_order');

  var tujuan = 'index.html';
  if (hasil.user.role === 'admin' || hasil.user.role === 'owner') tujuan = 'dashboard.html';
  else if (typeof pending === 'string' && pending) tujuan = 'pesan.html?' + pending;
  pindahHalaman(tujuan, 500);
  return false;
}

function daftar(e) {
  e.preventDefault();
  var hasil = prosesDaftar({
    nama: $('rg-nama').value,
    email: $('rg-email').value,
    hp: $('rg-hp').value,
    pass: $('rg-pass').value,
    pass2: $('rg-pass2').value
  });
  if (hasil.err) {
    tampilError('rg-err', hasil.err);
    return false;
  }
  toast('Registrasi berhasil. Silakan login.');
  ['rg-nama', 'rg-email', 'rg-hp', 'rg-pass', 'rg-pass2'].forEach(function (id) {
    if ($(id)) $(id).value = '';
  });
  pindahTab('masuk');
  $('lg-email').value = hasil.email;
  $('lg-pass').value = '';
  $('lg-pass').focus();
  return false;
}

function initAuth() {
  if (userAktif()) {
    location.replace(adalahPengelola() ? 'dashboard.html' : 'index.html');
    return;
  }
  var ids = ['cl-1', 'cl-2', 'cl-3'];
  for (var i = 0; i < ids.length; i++) {
    var li = $(ids[i]);
    if (li) li.insertAdjacentHTML('afterbegin', ikon('cek', 14));
  }
  if (location.hash === '#daftar') pindahTab('daftar');
}

/* ============ 11. HALAMAN KONTAK ============ */
function kirimPesan(e) {
  e.preventDefault();
  var nama = $('kn-nama').value.trim();
  var email = $('kn-email').value.trim().toLowerCase();
  var hp = normalisasiHp($('kn-hp').value);
  var subjek = $('kn-subjek').value;
  var pesan = $('kn-pesan').value.trim();

  var err = '';
  if (!nama || !email || !pesan) err = 'Nama, email, dan pesan wajib diisi.';
  else if (!emailValid(email)) err = 'Format email tidak valid.';
  else if (hp && !hpValid(hp)) err = 'Nomor HP harus berupa angka 10-13 digit.';
  else if (pesan.length < 10) err = 'Pesan terlalu pendek, tulis minimal 10 karakter.';
  else if (pesan.length > 1000) err = 'Pesan terlalu panjang, maksimal 1000 karakter.';

  if (err) {
    tampilError('kn-err', err);
    return false;
  }
  tampilError('kn-err', '');

  var daftarPesan = ambil('pesan', []);
  daftarPesan.push({ nama: nama, email: email, hp: hp, subjek: subjek, pesan: pesan, tanggal: hariIni() });
  if (!simpan('pesan', daftarPesan)) return false;

  toast('Pesan berhasil dikirim. Terima kasih telah menghubungi kami.');
  $('kn-pesan').value = '';
  $('kn-subjek').selectedIndex = 0;
  if (!userAktif()) {
    $('kn-nama').value = '';
    $('kn-email').value = '';
    $('kn-hp').value = '';
  }
  return false;
}

function initKontak() {
  setHtml('ic-lokasi', ikon('lokasi', 18));
  setHtml('ic-telepon', ikon('telepon', 18));
  setHtml('ic-email', ikon('email', 18));
  setHtml('ic-jam', ikon('jam', 18));
  if ($('kn-kirim')) {
    $('kn-kirim').insertAdjacentHTML('afterbegin', ikon('kirim', 16));
  }

  var u = userAktif();
  if (u) {
    if ($('kn-nama')) $('kn-nama').value = u.nama;
    if ($('kn-email')) $('kn-email').value = u.email;
    if (u.hp && $('kn-hp')) $('kn-hp').value = u.hp;
  }
}

/* ============ 12. JALANKAN SAAT HALAMAN SIAP ============ */
(function jalankan() {
  renderLayout();
  if ($('bk-list')) initBeranda();
  if ($('kt-list')) initKatalog();
  if ($('form-reservasi')) initPesan();
  if ($('tb-admin-pesanan')) renderDashboard();
  if ($('form-masuk')) initAuth();
  if ($('kn-nama')) initKontak();
})();
