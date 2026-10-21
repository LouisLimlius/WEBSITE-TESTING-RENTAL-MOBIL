/* =========================================================
   Sahabat Rental Mobil — js/script.js (Versi Bebas Error)
   ========================================================= */
'use strict';

/* ============ 1. PENYIMPANAN & DATA AWAL (localStorage) ============ */
function ambil(k, d) {
  try {
    var v = localStorage.getItem('srm_' + k);
    return v ? JSON.parse(v) : d;
  } catch (e) {
    return d;
  }
}

function simpan(k, v) {
  localStorage.setItem('srm_' + k, JSON.stringify(v));
}

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
  if (!ambil('bookings', null)) simpan('bookings', []);
  if (!ambil('pesan', null)) simpan('pesan', []);
})();

function cariMobil(id) {
  var daftar = ambil('cars', []);
  for (var i = 0; i < daftar.length; i++) {
    if (daftar[i].id == id) return daftar[i];
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

function tgl(s) {
  if (!s) return '-';
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

function hpValid(h) {
  return /^[0-9]{10,13}$/.test(h);
}

function validasiTanggal(m, s) {
  if (!m || !s) return 'Tanggal mulai dan tanggal selesai wajib diisi.';
  if (m < hariIni()) return 'Tanggal mulai tidak boleh sebelum hari ini.';
  if (s < m) return 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.';
  return '';
}

function mobilTersedia(carId, m, s) {
  if (!m || !s) return true;
  var bookings = ambil('bookings', []);
  for (var i = 0; i < bookings.length; i++) {
    var b = bookings[i];
    if (b.carId == carId && b.status !== 'Dibatalkan' && b.status !== 'Selesai') {
      if (!(s < b.mulai || m > b.selesai)) {
        return false;
      }
    }
  }
  return true;
}

function tampilError(id, pesan) {
  var e = $(id);
  if (!e) return;
  e.textContent = pesan || '';
  e.classList.toggle('show', !!pesan);
}

var toastTimer = null;
function toast(pesan, tipe) {
  var t = $('toast');
  if (!t) return;
  t.textContent = pesan;
  t.className = 'toast show ' + (tipe || '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    t.className = 'toast';
  }, 3200);
}

function toggleMenu() {
  var nav = $('nav');
  if (nav) nav.classList.toggle('open');
}

/* ============ 3. AUTENTIKASI & HAK AKSES ============ */
function userAktif() {
  return ambil('session', null);
}

function adalahPengelola() {
  var u = userAktif();
  return u && (u.role === 'admin' || u.role === 'owner');
}

function prosesLogin(email, pass) {
  email = String(email || '').trim().toLowerCase();
  if (!email || !pass) return { err: 'Email dan password wajib diisi.' };
  var users = ambil('users', []);
  var u = null;
  for (var i = 0; i < users.length; i++) {
    if (users[i].email === email && users[i].password === pass) {
      u = users[i];
      break;
    }
  }
  if (!u) return { err: 'Email atau password salah.' };
  simpan('session', { nama: u.nama, email: u.email, hp: u.hp, role: u.role });
  return { ok: true, user: u };
}

function prosesDaftar(data) {
  var nama = String(data.nama || '').trim();
  var email = String(data.email || '').trim().toLowerCase();
  var hp = String(data.hp || '').trim();
  var pass = data.pass || '';
  var pass2 = data.pass2 || '';
  var users = ambil('users', []);
  var sudahAda = false;

  for (var i = 0; i < users.length; i++) {
    if (users[i].email === email) sudahAda = true;
  }

  var pesan = '';
  if (!nama || !email || !hp || !pass || !pass2) pesan = 'Semua kolom wajib diisi.';
  else if (!emailValid(email)) pesan = 'Format email tidak valid.';
  else if (!hpValid(hp)) pesan = 'Nomor HP harus berupa angka 10-13 digit.';
  else if (pass.length < 6) pesan = 'Password minimal 6 karakter.';
  else if (pass !== pass2) pesan = 'Ulangi password tidak sama.';
  else if (sudahAda) pesan = 'Email sudah terdaftar.';

  if (pesan) return { err: pesan };
  users.push({ nama: nama, email: email, hp: hp, password: pass, role: 'pelanggan' });
  simpan('users', users);
  return { ok: true, email: email };
}

function logout() {
  localStorage.removeItem('srm_session');
  toast('Anda berhasil logout.');
  setTimeout(function () {
    location.href = 'login.html';
  }, 400);
}

/* ============ 4. LOGO WEBSITE & KARTU MOBIL ============ */
function logoSvg() {
  return '<svg viewBox="0 0 32 32" fill="none" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" aria-hidden="true">' +
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
  return '<div class="car-card">' +
    '<div class="car-top">' +
      '<span class="type-tag">' + esc(c.tipe || 'Mobil') + '</span>' +
      (badgeHtml || '') +
    '</div>' +
    '<div class="car-body">' +
      '<h3>' + esc(c.nama) + '</h3>' +
      '<div class="chips">' +
        '<span class="chip">' + (c.kursi || 7) + ' Kursi</span>' +
        '<span class="chip">Transmisi ' + esc(c.transmisi) + '</span>' +
        '<span class="chip">Lepas Kunci / Sopir</span>' +
      '</div>' +
      '<div class="car-foot">' +
        '<div class="price">' + rupiah(c.tarif) + ' <small>/ hari</small></div>' +
        (aksiHtml || '') +
      '</div>' +
    '</div>' +
  '</div>';
}

function tombolPesanKartu(carId, tersedia) {
  if (adalahPengelola()) {
    return '<button class="btn btn-small" disabled title="Admin & Owner tidak dapat memesan">Khusus Pelanggan</button>';
  }
  if (tersedia === false) {
    return '<button class="btn btn-small" disabled>Tidak Tersedia</button>';
  }
  return '<button class="btn btn-primary btn-small" onclick="pesanMobil(' + carId + ')">Pesan</button>';
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
    var cls = menu[i][0] === berkas ? 'active' : '';
    linkHtml += '<a href="' + menu[i][0] + '" class="' + cls + '">' + menu[i][1] + '</a>';
  }

  var chip = '';
  if (u) {
    var namaDepan = u.nama ? u.nama.split(' ')[0] : 'User';
    chip = '<div class="user-chip"><span>' + esc(namaDepan) + ' <small>(' + esc(u.role) + ')</small></span>' +
      '<button class="btn-logout" onclick="logout()">' + ikon('keluar', 13) + ' Logout</button></div>';
  }

  var navRoot = $('navbar-root');
  if (navRoot) {
    navRoot.outerHTML = '<header class="navbar no-print">' +
      '<div class="container navbar-inner">' +
        '<a href="index.html" class="logo">' +
          '<span class="logo-mark">' + logoSvg() + '</span>' +
          '<span>Sahabat <b>Rental Mobil</b></span>' +
        '</a>' +
        '<button class="menu-toggle" onclick="toggleMenu()" aria-label="Buka menu">' + ikon('menu') + ' Menu</button>' +
        '<nav class="nav" id="nav">' + linkHtml + chip + '</nav>' +
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
      '<div class="footer-bottom">&copy; 2026 Sahabat Rental Mobil - Kelompok SIOMAY</div>' +
    '</footer>';
  }

  if (!$('toast')) {
    var t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
}

/* ============ 6. HALAMAN BERANDA ============ */
function cariBeranda() {
  var m = $('bk-mulai').value;
  var s = $('bk-selesai').value;
  var pesan = validasiTanggal(m, s);
  if (pesan) return tampilError('bk-err', pesan);
  tampilError('bk-err', '');
  location.href = 'katalog.html?mulai=' + encodeURIComponent(m) + '&selesai=' + encodeURIComponent(s);
}

function pesanMobil(id) {
  var u = userAktif();
  if (u && (u.role === 'admin' || u.role === 'owner')) {
    toast('Akun Admin dan Owner tidak dapat melakukan pemesanan mobil.', 'err');
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
    setTimeout(function () {
      location.href = 'login.html';
    }, 500);
    return;
  }
  location.href = 'pesan.html?' + q.toString();
}

function initBeranda() {
  setHtml('fi-1', ikon('kunci', 22));
  setHtml('fi-2', ikon('biaya', 22));
  setHtml('fi-3', ikon('pantau', 22));

  if (userAktif() && $('hero-btn-daftar')) {
    $('hero-btn-daftar').style.display = 'none';
  }

  var cars = ambil('cars', []);
  setText('bk-unit', cars.length);
  if ($('bk-mulai')) $('bk-mulai').min = hariIni();
  if ($('bk-selesai')) $('bk-selesai').min = hariIni();

  var html = '';
  var batas = Math.min(cars.length, 3);
  for (var i = 0; i < batas; i++) {
    html += kartuMobil(cars[i], '<span class="badge badge-ok">Siap Jalan</span>', tombolPesanKartu(cars[i].id, true));
  }
  setHtml('bk-list', html);
}

/* ============ 7. HALAMAN KATALOG ============ */
var ktTanggal = { mulai: '', selesai: '' };

function tampilKatalog() {
  var m = $('kt-mulai') ? $('kt-mulai').value : '';
  var s = $('kt-selesai') ? $('kt-selesai').value : '';
  var pesan = '';
  if (m || s) pesan = validasiTanggal(m, s);
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
    var cocokCari = !cari || c.nama.toLowerCase().indexOf(cari) !== -1;
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

  var infoTeks = cekTanggal
    ? jmlTersedia + ' dari ' + daftar.length + ' mobil tersedia untuk ' + tgl(m) + ' s/d ' + tgl(s) + ' (' + jumlahHari(m, s) + ' hari).'
    : 'Menampilkan ' + daftar.length + ' unit mobil. Pilih tanggal mulai & selesai untuk mengecek jadwal kosong.';
  setText('kt-info', infoTeks);
}

function initKatalog() {
  var q = new URLSearchParams(location.search);
  if ($('kt-mulai')) {
    $('kt-mulai').min = hariIni();
    $('kt-mulai').value = q.get('mulai') || '';
  }
  if ($('kt-selesai')) {
    $('kt-selesai').min = hariIni();
    $('kt-selesai').value = q.get('selesai') || '';
  }
  tampilKatalog();
}

/* ============ 8. HALAMAN PEMESANAN & PEMBAYARAN (pesan.html) ============ */
function ubahMetodeBayar() {
  var metodeEl = document.querySelector('input[name="metode_bayar"]:checked');
  var metode = metodeEl ? metodeEl.value : 'QRIS';
  var box = $('instruksi-bayar');
  if (!box) return;

  if (metode === 'QRIS') {
    box.innerHTML = '<p><b>Pembayaran QRIS Instan</b></p>' +
      '<p style="margin:0;font-size:13px;">Kode QRIS Merchant: <b>SRM-QRIS-20268891</b>. Pembayaran otomatis terverifikasi saat Anda menekan tombol bayar di bawah.</p>';
  } else if (metode === 'BCA Virtual Account') {
    box.innerHTML = '<p><b>Nomor BCA Virtual Account: 8801 0812 0000 2026</b></p>' +
      '<p style="margin:0;font-size:13px;">A.n. Sahabat Rental Mobil. Tagihan otomatis lunas setelah konfirmasi pembayaran.</p>';
  } else {
    box.innerHTML = '<p><b>Nomor Mandiri Virtual Account: 8902 0812 0000 2026</b></p>' +
      '<p style="margin:0;font-size:13px;">A.n. Sahabat Rental Mobil. Tagihan otomatis lunas setelah konfirmasi pembayaran.</p>';
  }
}

function hitungBiayaSewa() {
  if (!$('ps-mobil')) return;
  var carId = $('ps-mobil').value;
  var m = $('ps-mulai').value;
  var s = $('ps-selesai').value;
  var layanan = $('ps-layanan').value;
  var mobil = cariMobil(carId);

  setText('sum-mobil', mobil ? mobil.nama : '-');
  setText('sum-tarif', mobil ? rupiah(mobil.tarif) : 'Rp 0');
  setText('sum-layanan', layanan);

  if (!mobil || !m || !s || s < m) {
    setText('sum-durasi', '0 Hari');
    setText('sum-total', 'Rp 0');
    setHtml('sum-status', '<span class="badge badge-dark">Pilih Tanggal Valid</span>');
    return;
  }

  var hari = jumlahHari(m, s);
  var tambahanSopir = layanan === 'Dengan Sopir' ? 150000 * hari : 0;
  var total = (mobil.tarif * hari) + tambahanSopir;
  var tersedia = mobilTersedia(carId, m, s);

  setText('sum-durasi', hari + ' Hari');
  setText('sum-total', rupiah(total));
  setHtml('sum-status', tersedia
    ? '<span class="badge badge-ok">Jadwal Tersedia</span>'
    : '<span class="badge badge-no">Jadwal Bentrok / Penuh</span>');
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
  var layanan = $('ps-layanan').value;
  var catatan = $('ps-catatan').value.trim();
  var metodeEl = document.querySelector('input[name="metode_bayar"]:checked');
  var metode = metodeEl ? metodeEl.value : 'QRIS';

  var errTgl = validasiTanggal(m, s);
  if (errTgl) {
    tampilError('ps-err', errTgl);
    return false;
  }
  if (!mobilTersedia(carId, m, s)) {
    tampilError('ps-err', 'Maaf, mobil ini sudah dipesan pada tanggal tersebut. Silakan pilih tanggal atau mobil lain.');
    return false;
  }
  tampilError('ps-err', '');

  var mobil = cariMobil(carId);
  var hari = jumlahHari(m, s);
  var total = (mobil.tarif * hari) + (layanan === 'Dengan Sopir' ? 150000 * hari : 0);

  var daftar = ambil('bookings', []);
  var kode = 'SRM-' + String(daftar.length + 101);
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
    total: total,
    catatan: catatan
  });
  simpan('bookings', daftar);

  toast('Pembayaran berhasil! Pesanan ' + kode + ' telah tercatat.');
  $('ps-catatan').value = '';
  hitungBiayaSewa();
  renderRiwayatPelanggan();
  return false;
}

function renderRiwayatPelanggan() {
  var u = userAktif();
  var tbody = $('tb-riwayat-pelanggan');
  if (!tbody || !u) return;

  var semua = ambil('bookings', []);
  var html = '';
  for (var i = 0; i < semua.length; i++) {
    var b = semua[i];
    if (b.emailPelanggan === u.email) {
      html += '<tr>' +
        '<td><b>' + esc(b.kode) + '</b></td>' +
        '<td>' + esc(b.namaMobil) + '</td>' +
        '<td>' + tgl(b.mulai) + ' - ' + tgl(b.selesai) + ' (' + b.hari + ' hari)</td>' +
        '<td>' + esc(b.layanan) + '</td>' +
        '<td><b>' + rupiah(b.total) + '</b></td>' +
        '<td><span class="badge badge-ok">' + esc(b.metodeBayar) + ' (' + esc(b.statusBayar) + ')</span></td>' +
        '<td><span class="badge badge-dark">' + esc(b.status) + '</span></td>' +
      '</tr>';
    }
  }
  if (!html) {
    html = '<tr><td colspan="7" class="center muted">Belum ada riwayat pemesanan.</td></tr>';
  }
  tbody.innerHTML = html;
}

function initPesan() {
  var u = userAktif();
  if (!u) {
    toast('Silakan login terlebih dahulu untuk memesan mobil.');
    setTimeout(function () {
      location.href = 'login.html';
    }, 400);
    return;
  }
  if (u.role === 'admin' || u.role === 'owner') {
    toast('Akun Admin dan Owner tidak dapat melakukan pemesanan mobil.', 'err');
    setTimeout(function () {
      location.href = 'dashboard.html';
    }, 500);
    return;
  }

  setText('sum-nama', u.nama);
  var cars = ambil('cars', []);
  var opsiHtml = '';
  for (var i = 0; i < cars.length; i++) {
    var c = cars[i];
    opsiHtml += '<option value="' + c.id + '">' + esc(c.nama) + ' — ' + rupiah(c.tarif) + '/hari (' + esc(c.transmisi) + ')</option>';
  }
  setHtml('ps-mobil', opsiHtml);

  var q = new URLSearchParams(location.search);
  var besok = hariIni();
  $('ps-mulai').min = besok;
  $('ps-selesai').min = besok;
  if (q.get('mobil')) $('ps-mobil').value = q.get('mobil');
  $('ps-mulai').value = q.get('mulai') || besok;
  $('ps-selesai').value = q.get('selesai') || besok;

  ubahMetodeBayar();
  hitungBiayaSewa();
  renderRiwayatPelanggan();
}

/* ============ 9. HALAMAN DASHBOARD ADMIN & OWNER ============ */
function simpanMobilAdmin(e) {
  e.preventDefault();
  var nama = $('adm-nama').value.trim();
  var tipe = $('adm-tipe').value;
  var transmisi = $('adm-transmisi').value;
  var tarif = Number($('adm-tarif').value);

  if (!nama || !tarif || tarif <= 0) {
    tampilError('adm-err', 'Nama mobil dan tarif harian wajib diisi dengan benar.');
    return false;
  }
  tampilError('adm-err', '');

  var cars = ambil('cars', []);
  var maxId = 0;
  for (var i = 0; i < cars.length; i++) {
    if (cars[i].id > maxId) maxId = cars[i].id;
  }
  cars.push({ id: maxId + 1, nama: nama, tipe: tipe, kursi: 7, transmisi: transmisi, tarif: tarif });
  simpan('cars', cars);

  $('adm-nama').value = '';
  $('adm-tarif').value = '';
  toast('Unit kendaraan berhasil ditambahkan.');
  renderDashboard();
  return false;
}

function hapusMobilAdmin(id) {
  var cars = ambil('cars', []);
  var baru = [];
  for (var i = 0; i < cars.length; i++) {
    if (cars[i].id != id) baru.push(cars[i]);
  }
  simpan('cars', baru);
  toast('Unit kendaraan dihapus.');
  renderDashboard();
}

function ubahStatusPesanan(kode, statusBaru) {
  var daftar = ambil('bookings', []);
  for (var i = 0; i < daftar.length; i++) {
    if (daftar[i].kode === kode) {
      daftar[i].status = statusBaru;
      break;
    }
  }
  simpan('bookings', daftar);
  toast('Status pesanan ' + kode + ' diperbarui menjadi ' + statusBaru + '.');
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
        '<td>' + rupiah(c.tarif) + '</td>' +
        '<td><button class="btn btn-outline btn-small" onclick="hapusMobilAdmin(' + c.id + ')">Hapus</button></td>' +
      '</tr>';
    }
    $('tb-admin-mobil').innerHTML = htmlMobil;
  }

  var htmlPesanan = '';
  var statusOpsi = ['Menunggu Konfirmasi', 'Dikonfirmasi', 'Sedang Disewa', 'Selesai', 'Dibatalkan'];

  for (var k = 0; k < bookings.length; k++) {
    var b = bookings[k];
    var kolomAksi = '';

    if (!isOwner) {
      var selectHtml = '<select onchange="ubahStatusPesanan(\'' + esc(b.kode) + '\', this.value)" style="margin:0;padding:6px 8px;font-size:13px;">';
      for (var s = 0; s < statusOpsi.length; s++) {
        var st = statusOpsi[s];
        var sel = b.status === st ? ' selected' : '';
        selectHtml += '<option' + sel + '>' + st + '</option>';
      }
      selectHtml += '</select>';
      kolomAksi = '<td>' + selectHtml + '</td>';
    }

    htmlPesanan += '<tr>' +
      '<td><b>' + esc(b.kode) + '</b></td>' +
      '<td>' + esc(b.namaPelanggan) + '<br><small>' + esc(b.hpPelanggan) + '</small></td>' +
      '<td>' + esc(b.namaMobil) + '</td>' +
      '<td>' + tgl(b.mulai) + ' - ' + tgl(b.selesai) + '</td>' +
      '<td>' + esc(b.layanan) + '</td>' +
      '<td><span class="badge badge-ok">' + esc(b.metodeBayar) + '</span></td>' +
      '<td><b>' + rupiah(b.total) + '</b></td>' +
      '<td><span class="badge badge-dark">' + esc(b.status) + '</span></td>' +
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
function pindahTab(tab) {
  var masuk = tab === 'masuk';
  if ($('tab-masuk')) $('tab-masuk').classList.toggle('active', masuk);
  if ($('tab-daftar')) $('tab-daftar').classList.toggle('active', !masuk);
  if ($('form-masuk')) $('form-masuk').classList.toggle('hidden', !masuk);
  if ($('form-daftar')) $('form-daftar').classList.toggle('hidden', masuk);
  setText('auth-judul', masuk ? 'Login' : 'Registrasi');
  setText('auth-sub', masuk
    ? 'Masukkan email dan password yang sudah terdaftar.'
    : 'Lengkapi data diri di bawah ini untuk membuat akun pelanggan.');
  tampilError('lg-err', '');
  tampilError('rg-err', '');
  history.replaceState(null, '', masuk ? '#masuk' : '#daftar');
}

function login(e) {
  e.preventDefault();
  var hasil = prosesLogin($('lg-email').value, $('lg-pass').value);
  if (hasil.err) {
    tampilError('lg-err', hasil.err);
    return false;
  }

  toast('Login berhasil. Selamat datang, ' + hasil.user.nama.split(' ')[0] + '!');
  var pending = ambil('pending_order', null);
  localStorage.removeItem('srm_pending_order');

  setTimeout(function () {
    if (hasil.user.role === 'admin' || hasil.user.role === 'owner') {
      location.href = 'dashboard.html';
    } else if (pending) {
      location.href = 'pesan.html?' + pending;
    } else {
      location.href = 'index.html';
    }
  }, 500);
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
  pindahTab('masuk');
  $('lg-email').value = hasil.email;
  $('lg-pass').value = '';
  $('lg-pass').focus();
  return false;
}

function initAuth() {
  if (userAktif()) {
    location.replace('index.html');
    return;
  }
  var ids = ['cl-1', 'cl-2', 'cl-3'];
  for (var i = 0; i < ids.length; i++) {
    var li = $(ids[i]);
    if (li) li.innerHTML = ikon('cek', 14) + li.innerHTML;
  }
  if (location.hash === '#daftar') pindahTab('daftar');
}

/* ============ 11. HALAMAN KONTAK ============ */
function kirimPesan(e) {
  e.preventDefault();
  var nama = $('kn-nama').value.trim();
  var email = $('kn-email').value.trim();
  var hp = $('kn-hp').value.trim();
  var subjek = $('kn-subjek').value;
  var pesan = $('kn-pesan').value.trim();

  var err = '';
  if (!nama || !email || !pesan) err = 'Nama, email, dan pesan wajib diisi.';
  else if (!emailValid(email)) err = 'Format email tidak valid.';
  else if (hp && !hpValid(hp)) err = 'Nomor HP harus berupa angka 10-13 digit.';
  else if (pesan.length < 10) err = 'Pesan terlalu pendek, tulis minimal 10 karakter.';

  if (err) {
    tampilError('kn-err', err);
    return false;
  }
  tampilError('kn-err', '');

  var daftar = ambil('pesan', []);
  daftar.push({ nama: nama, email: email, hp: hp, subjek: subjek, pesan: pesan, tanggal: hariIni() });
  simpan('pesan', daftar);

  toast('Pesan berhasil dikirim. Terima kasih telah menghubungi kami.');
  $('kn-pesan').value = '';
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
renderLayout();
if ($('bk-list')) initBeranda();
if ($('kt-list')) initKatalog();
if ($('form-reservasi')) initPesan();
if ($('tb-admin-pesanan')) renderDashboard();
if ($('form-masuk')) initAuth();
if ($('kn-nama')) initKontak();