import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// --- SENİN FIREBASE AYARLARIN ---
const firebaseConfig = {
    apiKey: "AIzaSyD8pcFbP4WANy68hDC1ohkM5DU_Rpx8EdA",
    authDomain: "washmate-227cf.firebaseapp.com",
    projectId: "washmate-227cf",
    storageBucket: "washmate-227cf.firebasestorage.app",
    messagingSenderId: "300306123506",
    appId: "1:300306123506:web:b27d5e492a900bbec59e6b",
    measurementId: "G-L4FKW04DPB"
};

// Uygulamayı Başlat
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("WashMate Başarıyla Yüklendi!"); 

// ======================================================
// 1. EKSİK OLAN KISIM: SEKME DEĞİŞTİRME (TAB) FONKSİYONU
// ======================================================
window.switchTab = function(tabName) {
    // Tüm butonların aktifliğini kaldır
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    // Tüm formları gizle
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));

    // İlgili butonu ve formu bulup aktif yap
    if(tabName === 'login') {
        // Login sekmesini bul ve aktif yap
        const btns = document.querySelectorAll("button");
        btns.forEach(b => { if(b.innerText === 'Login') b.classList.add('active') });
        document.getElementById('form-login').classList.add('active');
    }
    if(tabName === 'student') {
        const btns = document.querySelectorAll("button");
        btns.forEach(b => { if(b.innerText.includes('Student')) b.classList.add('active') });
        document.getElementById('form-student').classList.add('active');
    }
    if(tabName === 'admin') {
        const btns = document.querySelectorAll("button");
        btns.forEach(b => { if(b.innerText === 'Admin') b.classList.add('active') });
        document.getElementById('form-admin').classList.add('active');
    }
};

// --- 2. ÖĞRENCİ KAYIT ---
const btnStudentReg = document.getElementById('btnStudentReg');
if(btnStudentReg) {
    btnStudentReg.addEventListener('click', async () => {
        const firstName = document.getElementById('sFirstName').value;
        const lastName = document.getElementById('sLastName').value;
        const studentID = document.getElementById('sID').value;
        const dorm = document.getElementById('sDorm').value;
        const block = document.getElementById('sBlock').value;
        const email = document.getElementById('sEmail').value;
        const pass = document.getElementById('sPass').value;

        if(!email || !pass || !firstName) { alert("Lütfen tüm alanları doldurun!"); return; }

        try {
            const cred = await createUserWithEmailAndPassword(auth, email, pass);
            await setDoc(doc(db, "users", cred.user.uid), {
                firstName, lastName, studentID, dorm, block, email, role: "student"
            });
            alert("Kayıt Başarılı! Giriş yapabilirsiniz.");
            window.location.reload();
        } catch (e) { 
            console.error(e);
            alert("Hata: " + e.message); 
        }
    });
}

// --- 3. ADMIN KAYIT ---
const btnAdminReg = document.getElementById('btnAdminReg');
if(btnAdminReg) {
    btnAdminReg.addEventListener('click', async () => {
        const fullName = document.getElementById('aFullName').value;
        const email = document.getElementById('aEmail').value;
        const pass = document.getElementById('aPass').value;

        if(!email || !pass) { alert("Eksik bilgi!"); return; }

        try {
            const cred = await createUserWithEmailAndPassword(auth, email, pass);
            await setDoc(doc(db, "users", cred.user.uid), { fullName, email, role: "admin" });
            alert("Admin Kaydı Başarılı!");
            window.location.reload();
        } catch (e) { alert("Hata: " + e.message); }
    });
}

// --- 4. GİRİŞ YAPMA (LOGIN) ---
const btnLogin = document.getElementById('btnLogin');
if(btnLogin) {
    btnLogin.addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value;
        const pass = document.getElementById('loginPass').value;

        try {
            const cred = await signInWithEmailAndPassword(auth, email, pass);
            checkUserRole(cred.user.uid);
        } catch (e) { alert("Giriş Hatalı: " + e.message); }
    });
}

// --- 5. ROL KONTROLÜ VE EKRAN DEĞİŞİMİ ---
async function checkUserRole(uid) {
    const docSnap = await getDoc(doc(db, "users", uid));
    if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Giriş ekranını gizle, Paneli aç
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('dashboardView').style.display = 'block';
        
        // CSS class ekle (geniş görünüm için)
        const container = document.getElementById('mainAppContainer');
        if(container) container.classList.add('dashboard-mode');

        if (data.role === 'admin') setupAdminView(data);
        else setupStudentView(data);
    }
}

// --- EKRAN AYARLARI ---
function setupStudentView(user) {
    document.getElementById('welcomeMsg').innerText = `Merhaba, ${user.firstName || 'Öğrenci'}`;
    const dormInfo = document.getElementById('userDormDisplay');
    if(dormInfo) dormInfo.innerText = `${user.dorm || ''} • Blok ${user.block || ''}`;
    loadMachines(false);
}

function setupAdminView(user) {
    document.getElementById('welcomeMsg').innerText = `Yönetici Paneli`;
    const dormInfo = document.getElementById('userDormDisplay');
    if(dormInfo) dormInfo.innerText = `Sistem Yöneticisi`;
    
    const addBtn = document.getElementById('addMachineBtn');
    if(addBtn) addBtn.style.display = 'block'; // Admin butonunu göster
    loadMachines(true);
}

function loadMachines(isAdmin) {
    onSnapshot(collection(db, "machines"), (snapshot) => {
        const grid = document.getElementById('machinesGrid');
        grid.innerHTML = "";
        snapshot.forEach(d => {
            const m = d.data();
            const statusClass = m.status === 'available' ? 'st-free' : 'st-busy';
            
            // Silme butonu (Sadece Admin için)
            const deleteBtn = isAdmin ? `<button onclick="window.deleteMachine('${d.id}')" style="color:red;float:right;border:none;background:none;cursor:pointer;"><i class="fa-solid fa-trash"></i></button>` : '';

            grid.innerHTML += `
            <div class="machine-card">
                ${deleteBtn}
                <div style="font-size:2rem; color:#2563eb; margin-bottom:10px;"><i class="fa-solid fa-soap"></i></div>
                <h3>${m.name}</h3>
                <p style="color:#64748b;">${m.type}</p>
                <div class="status-badge ${statusClass}">${m.status ? m.status.toUpperCase() : 'UNKNOWN'}</div>
            </div>`;
        });
    });
}

// --- GLOBAL FONKSİYONLAR ---
window.logout = () => signOut(auth).then(() => location.reload());
window.addMachine = async () => {
    const name = prompt("Makine Adı:");
    if(name) await addDoc(collection(db, "machines"), { name, type: 'Washing', status: 'available' });
};
window.deleteMachine = async (id) => {
    if(confirm("Silmek istiyor musun?")) await deleteDoc(doc(db, "machines", id));
};