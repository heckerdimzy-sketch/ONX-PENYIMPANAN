const USERS_KEY = 'dimzy_users';
const MEDIA_KEY = 'dimzy_media';

let users = JSON.parse(localStorage.getItem(USERS_KEY)) || {};
let currentUser = null;
let mediaFiles = JSON.parse(localStorage.getItem(MEDIA_KEY)) || {};

const authPage = document.getElementById('auth-page');
const galleryPage = document.getElementById('gallery-page');
const loginBox = document.getElementById('login-box');
const registerBox = document.getElementById('register-box');
const toggleAuth = document.getElementById('toggle-auth');
const authMsg = document.getElementById('auth-message');

const loginUser = document.getElementById('login-username');
const loginPass = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');

const regUser = document.getElementById('reg-username');
const regPass = document.getElementById('reg-password');
const regConfirm = document.getElementById('reg-confirm');
const regBtn = document.getElementById('register-btn');

const displayName = document.getElementById('display-username');
const logoutBtn = document.getElementById('logout-btn');
const fileInput = document.getElementById('file-input');
const galleryGrid = document.getElementById('gallery-grid');

function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    page.classList.add('active');
}

function setAuthMsg(text, isError = true) {
    authMsg.textContent = text;
    authMsg.style.color = isError ? '#fca5a5' : '#86efac';
}

function login(username, password) {
    if (!username || !password) { setAuthMsg('Isi username & password!'); return; }
    if (!users[username]) { setAuthMsg('Username tidak ditemukan!'); return; }
    if (users[username] !== password) { setAuthMsg('Password salah!'); return; }
    currentUser = username;
    localStorage.setItem('zenith_session', username);
    renderGallery();
    showPage(galleryPage);
    setAuthMsg('', false);
}

function register(username, password, confirm) {
    if (!username || !password || !confirm) { setAuthMsg('Semua field wajib diisi!'); return; }
    if (password !== confirm) { setAuthMsg('Password dan konfirmasi tidak cocok!'); return; }
    if (users[username]) { setAuthMsg('Username sudah terpakai!'); return; }
    users[username] = password;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    if (!mediaFiles[username]) mediaFiles[username] = [];
    localStorage.setItem(MEDIA_KEY, JSON.stringify(mediaFiles));
    setAuthMsg('✅ Akun berhasil dibuat! Silakan login.', false);
    toggleForm();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('zenith_session');
    showPage(authPage);
    loginUser.value = '';
    loginPass.value = '';
    setAuthMsg('', false);
}

function toggleForm() {
    const isLogin = loginBox.style.display !== 'none';
    loginBox.style.display = isLogin ? 'none' : 'block';
    registerBox.style.display = isLogin ? 'block' : 'none';
    toggleAuth.textContent = isLogin ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar';
    setAuthMsg('', false);
}

function renderGallery() {
    if (!currentUser) return;
    const userMedia = mediaFiles[currentUser] || [];
    galleryGrid.innerHTML = '';
    if (userMedia.length === 0) {
        galleryGrid.innerHTML = `<p style="color:#6a7a9a; grid-column:1/-1; text-align:center; padding:40px 0;">Belum ada arsip. Unggah foto atau video.</p>`;
        return;
    }
    userMedia.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'grid-item';
        if (item.type && item.type.startsWith('video')) {
            const vid = document.createElement('video');
            vid.src = item.data;
            vid.muted = true;
            vid.controls = false;
            vid.onmouseenter = () => vid.play();
            vid.onmouseleave = () => vid.pause();
            div.appendChild(vid);
        } else {
            const img = document.createElement('img');
            img.src = item.data;
            img.alt = 'Arsip';
            img.loading = 'lazy';
            div.appendChild(img);
        }
        const btn = document.createElement('button');
        btn.className = 'download-btn';
        btn.textContent = '⬇ Download';
        btn.onclick = (e) => {
            e.stopPropagation();
            const link = document.createElement('a');
            link.href = item.data;
            link.download = `zenith_${currentUser}_${Date.now()}.${item.type ? item.type.split('/')[1] : 'file'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
        div.appendChild(btn);
        galleryGrid.appendChild(div);
    });
}

function handleFiles(files) {
    if (!currentUser) return;
    if (!mediaFiles[currentUser]) mediaFiles[currentUser] = [];
    const promises = Array.from(files).map(file => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                mediaFiles[currentUser].push({
                    type: file.type,
                    data: e.target.result,
                    name: file.name
                });
                resolve();
            };
            reader.onerror = () => {
                alert('Gagal membaca file: ' + file.name);
                resolve();
            };
            reader.readAsDataURL(file);
        });
    });
    Promise.all(promises).then(() => {
        localStorage.setItem(MEDIA_KEY, JSON.stringify(mediaFiles));
        renderGallery();
    });
}

loginBtn.addEventListener('click', () => login(loginUser.value.trim(), loginPass.value.trim()));
regBtn.addEventListener('click', () => register(regUser.value.trim(), regPass.value.trim(), regConfirm.value.trim()));
toggleAuth.addEventListener('click', toggleForm);
logoutBtn.addEventListener('click', logout);
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        handleFiles(e.target.files);
        e.target.value = '';
    }
});

const session = localStorage.getItem('zenith_session');
if (session && users[session]) {
    currentUser = session;
    renderGallery();
    showPage(galleryPage);
} else {
    showPage(authPage);
    loginBox.style.display = 'block';
    registerBox.style.display = 'none';
    toggleAuth.textContent = 'Belum punya akun? Daftar';
}

document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => {
    e.preventDefault();
    if (currentUser && e.dataTransfer.files.length) {
        handleFiles(e.dataTransfer.files);
    }
});