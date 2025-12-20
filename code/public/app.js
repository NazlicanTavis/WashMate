import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
// DÜZELTME: 'updateDoc' buraya eklendi!
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, addDoc, deleteDoc, writeBatch, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


//Firebase config to connect to project
const firebaseConfig = {
    apiKey: "AIzaSyD8pcFbP4WANy68hDC1ohkM5DU_Rpx8EdA",
    authDomain: "washmate-227cf.firebaseapp.com",
    projectId: "washmate-227cf",
    storageBucket: "washmate-227cf.firebasestorage.app",
    messagingSenderId: "300306123506",
    appId: "1:300306123506:web:b27d5e492a900bbec59e6b",
    measurementId: "G-L4FKW04DPB"
};

//Initialize the application
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("WashMate loaded succesfully!"); 

//This function is to change between tabs
window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    if(tabName === 'login') {
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

//student registration
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

        if(!email || !pass || !firstName) { alert("Please fill in all fields!"); return; }

        try {
            const cred = await createUserWithEmailAndPassword(auth, email, pass);
            await setDoc(doc(db, "users", cred.user.uid), {
                firstName, lastName, studentID, dorm, block, email, role: "student"
            });
            alert("Registration Successful! Redirecting to login page...");
            window.location.reload();
        } catch (e) { 
            console.error(e);
            alert("Error: " + e.message); 
        }
    });
}

//admin registration
const btnAdminReg = document.getElementById('btnAdminReg');
if(btnAdminReg) {
    btnAdminReg.addEventListener('click', async () => {
        const fullName = document.getElementById('aFullName').value;
        const email = document.getElementById('aEmail').value;
        const pass = document.getElementById('aPass').value;

        if(!email || !pass) { alert("Please fill in all fields!"); return; }

        try {
            const cred = await createUserWithEmailAndPassword(auth, email, pass);
            await setDoc(doc(db, "users", cred.user.uid), { fullName, email, role: "admin" });
            alert("Admin Registration Successful!");
            window.location.reload();
        } catch (e) { alert("Error: " + e.message); }
    });
}

//Login
const btnLogin = document.getElementById('btnLogin');
if(btnLogin) {
    btnLogin.addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value;
        const pass = document.getElementById('loginPass').value;

        try {
            const cred = await signInWithEmailAndPassword(auth, email, pass);
            checkUserRole(cred.user.uid);
        } catch (e) { alert("Login Error: " + e.message); }
    });
}

//change of role and tab differentiate
async function checkUserRole(uid) {
    const docSnap = await getDoc(doc(db, "users", uid));
    if (docSnap.exists()) {
        const data = docSnap.data();
        
        //open the panel and make the dashboard visible
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('dashboardView').style.display = 'block';
        const container = document.getElementById('mainAppContainer');
        if(container) container.classList.add('dashboard-mode');

        if (data.role === 'admin') setupAdminView(data);
        else setupStudentView(data);
    }
}

//screen settings
function setupStudentView(user) {
    document.getElementById('welcomeMsg').innerText = `Hello, ${user.firstName || 'Student'}`;
    if (user.noShowCount && user.noShowCount >= 3) {
        // İstersen şık bir div ekle, şimdilik alert ile gösterelim
        const warningDiv = document.createElement('div');
        warningDiv.style = "background:#fee2e2; color:#b91c1c; padding:15px; margin-bottom:20px; border-radius:12px; border:1px solid #ef4444; font-weight:bold;";
        warningDiv.innerHTML = `⚠️ ACCOUNT WARNING: You have ${user.noShowCount} 'No-Show' penalties! Please attend your reservations.`;
        
        // Dashboard'ın tepesine ekle
        const dashHeader = document.querySelector('.dash-header');
        dashHeader.parentNode.insertBefore(warningDiv, dashHeader.nextSibling);
    }
    const dormInfo = document.getElementById('userDormDisplay');
    if(dormInfo) dormInfo.innerText = `${user.dorm || ''} • Block ${user.block || ''}`;
    
    // HIDE Admin controls
    const adminControls = document.getElementById('adminPanelControls');
    if(adminControls) adminControls.style.display = 'none';
    
    const addBtn = document.getElementById('addMachineBtn');
    if(addBtn) addBtn.style.display = 'none';

    loadMachines(false);
}

function setupAdminView(user) {
    document.getElementById('welcomeMsg').innerText = `Admin Panel`;
    const dormInfo = document.getElementById('userDormDisplay');
    if(dormInfo) dormInfo.innerText = `System Administrator`;
    
    // SHOW Admin controls
    const addBtn = document.getElementById('addMachineBtn');
    if(addBtn) addBtn.style.display = 'inline-block'; 

    const adminControls = document.getElementById('adminPanelControls');
    if(adminControls) adminControls.style.display = 'block';

    loadMachines(true);
}
// --- GÜNCELLENMİŞ MAKİNE LİSTELEME (Reserved & Start Özellikli) ---
function loadMachines(isAdmin) {
    onSnapshot(collection(db, "machines"), (snapshot) => {
        const grid = document.getElementById('machinesGrid');
        grid.innerHTML = "";
        
        snapshot.forEach(d => {
            const m = d.data();
            let statusClass = 'st-free'; // Yeşil
            let statusText = 'AVAILABLE';
            
            // --- DURUM RENKLERİ ---
            if (m.status === 'in_use') {
                statusClass = 'st-busy'; // Kırmızı
                statusText = 'IN USE';
            } 
            else if (m.status === 'reserved') {
                statusClass = 'st-busy'; // Sarı yapabilmek için CSS ile oynayabiliriz ama şimdilik st-busy kalsın
                statusText = '⏳ RESERVED'; // 5 Dakika sayacı işliyor
            }
            else if (m.status === 'disabled') {
                statusClass = 'st-busy'; 
                statusText = '⚠️ MAINTENANCE';
            }

            const currentUser = auth.currentUser;
            const usageStats = m.usageCount || 0; 

            let actionBtn = "";
            let statsHTML = "";

            if (isAdmin) {
                // --- ADMIN GÖRÜNÜMÜ ---
                const deleteBtn = `<button onclick="window.deleteMachine('${d.id}')" style="color:red; float:right; border:none; background:none; cursor:pointer;" title="Delete"><i class="fa-solid fa-trash"></i></button>`;
                
                if (m.status === 'disabled') {
                    actionBtn = `<button onclick="window.fixMachine('${d.id}')" class="btn-main" style="margin-top:10px; background-color:#f59e0b; color:black;">Repair / Enable</button>`;
                } else {
                    actionBtn = `<div style="height:35px;"></div>`; 
                }

                statsHTML = `${deleteBtn}<div style="font-size:0.8rem; color:#64748b; margin-top:5px; border-top:1px solid #eee; padding-top:5px;">Total Cycles: <b>${usageStats}</b></div>`;
            } 
            else {
                // --- ÖĞRENCİ GÖRÜNÜMÜ ---
                if (m.status === 'available') {
                    // BOŞ: Book ve Report butonları
                    actionBtn = `
                    <div style="display:flex; gap:5px; margin-top:10px;">
                        <button onclick="window.bookMachine('${d.id}')" class="btn-main" style="flex:2; background-color:#2563eb;">Book</button>
                        <button onclick="window.reportMachine('${d.id}')" class="btn-main" style="flex:1; background-color:#64748b;" title="Report"><i class="fa-solid fa-triangle-exclamation"></i></button>
                    </div>`;
                }
                else if (m.status === 'reserved' && m.userId === currentUser.uid) {
                    // REZERVE (Benim): "Start" butonu çıkar!
                    actionBtn = `<button onclick="window.startMachine('${d.id}')" class="btn-main" style="margin-top:10px; background-color:#f59e0b; color:black;">▶ Start Washing</button>
                                 <div style="font-size:0.75rem; color:red; margin-top:5px;">You have 5 mins to start!</div>`;
                }
                else if (m.status === 'in_use' && m.userId === currentUser.uid) {
                    // ÇALIŞIYOR (Benim): "Finish" butonu çıkar
                    actionBtn = `<button onclick="window.finishMachine('${d.id}')" class="btn-main" style="margin-top:10px; background-color:#16a34a;">Finish / Release</button>`;
                }
                else if (m.status === 'disabled') {
                    actionBtn = `<div style="margin-top:10px; font-size:0.8rem; color:#ef4444; font-weight:bold;">OUT OF ORDER</div>`;
                }
                else {
                    actionBtn = `<div style="margin-top:10px; font-size:0.8rem; color:#94a3b8;">In use/Reserved by others</div>`;
                }
            }

            // KART RENGİ AYARI (Reserved ise Sarımsı)
            let cardStyle = "";
            if(m.status === 'disabled') cardStyle = "opacity:0.8; background:#fef2f2;";
            if(m.status === 'reserved') cardStyle = "border: 2px solid #f59e0b; background:#fffbeb;";

            grid.innerHTML += `
            <div class="machine-card" style="${cardStyle}">
                <div style="font-size:2rem; color:${m.status==='disabled'?'#ef4444':(m.status==='reserved'?'#f59e0b':'#2563eb')}; margin-bottom:10px;">
                    <i class="fa-solid ${m.status==='disabled'?'fa-triangle-exclamation':'fa-soap'}"></i>
                </div>
                <h3>${m.name}</h3>
                <p style="color:#64748b;">${m.type}</p>
                ${isAdmin ? statsHTML : ''}
                <div class="status-badge ${statusClass}" style="${m.status==='reserved'?'background:#fef3c7; color:#b45309':''}">${statusText}</div>
                ${!isAdmin ? actionBtn : ''}
                ${isAdmin && m.status === 'disabled' ? actionBtn : ''}
            </div>`;
        });
    });
}

//global functions
window.logout = () => signOut(auth).then(() => location.reload());
window.addMachine = async () => {
    const name = prompt("Enter Machine Name:");
    if(name) await addDoc(collection(db, "machines"), { name, type: 'Washing', status: 'available' });
};
window.deleteMachine = async (id) => {
    if(confirm("Are you sure you want to delete this machine?")) await deleteDoc(doc(db, "machines", id));
};


// ==========================================
// ⚠️ ADMIN ADVANCED FEATURES (Initialize, Reset, Backup)
// ==========================================

// 1. INITIALIZE (Add 10 Machines Automatically)
window.initializeDatabase = async function() {
    const confirmInit = confirm("WARNING: This will automatically add 10 test machines to the database. Do you want to proceed?");
    if (!confirmInit) return;

    try {
        const batch = writeBatch(db); 

        for (let i = 1; i <= 5; i++) {
            // 5 Washing Machines
            const washerRef = doc(collection(db, "machines"));
            batch.set(washerRef, {
                type: "Washer",
                name: `Washer #${i}`,
                status: "available",
            });

            // 5 Dryers
            const dryerRef = doc(collection(db, "machines"));
            batch.set(dryerRef, {
                type: "Dryer",
                name: `Dryer #${i}`,
                status: "available",
            });
        }

        await batch.commit(); 
        alert("✅ Success! 10 machines have been added to the database.");
    } catch (error) {
        console.error("Init Error:", error);
        alert("Error: " + error.message);
    }
}

// 2. RESET ALL (Set all to Available)
window.resetSystem = async function() {
    const confirmReset = confirm("WARNING: All machines will be reset to 'Available' status. Are you sure?");
    if (!confirmReset) return;

    try {
        const querySnapshot = await getDocs(collection(db, "machines"));
        const batch = writeBatch(db);

        querySnapshot.forEach((doc) => {
            batch.update(doc.ref, { 
                status: "available",
                startTime: null,
                userId: null 
            });
        });

        await batch.commit();
        alert("✅ System Reset! All machines are now available.");
    } catch (error) {
        console.error("Reset Error:", error);
        alert("Reset failed: " + error.message);
    }
}

// 3. BACKUP (Download JSON)
window.backupData = async function() {
    try {
        const querySnapshot = await getDocs(collection(db, "machines"));
        let data = [];

        querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });

        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = "washmate_backup_" + new Date().toISOString().slice(0,10) + ".json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        alert("✅ Data backup downloaded successfully!");
    } catch (error) {
        console.error("Backup Error:", error);
        alert("Backup failed: " + error.message);
    }
}

// 4. BIND BUTTONS
const btnInit = document.getElementById('btnInitialize');
if(btnInit) btnInit.addEventListener('click', window.initializeDatabase);

const btnReset = document.getElementById('btnReset');
if(btnReset) btnReset.addEventListener('click', window.resetSystem);

const btnBackup = document.getElementById('btnBackup');
if(btnBackup) btnBackup.addEventListener('click', window.backupData);

// ... (Üstteki kodlar bitiyor) ...

// YENİ: NO-SHOW BUTONUNU BAĞLA
const btnNoShow = document.getElementById('btnNoShow');
if(btnNoShow) btnNoShow.addEventListener('click', window.checkNoShows);


// ==========================================
// ⚠️ BOOKING SYSTEM LOGIC (Rezervasyon Sistemi)
// ==========================================

// 1. MAKİNEYİ KİRALA (BOOK)
// GÜNCELLENMİŞ BOOK MACHINE (Sayaçlı Versiyon)
// 1. GÜNCELLENMİŞ BOOK (Sadece Rezerve Eder)
window.bookMachine = async function(machineId) {
    const user = auth.currentUser;
    if (!user) { alert("Please login first!"); return; }

    try {
        // Önce kullanıcının ceza puanına bakalım (Opsiyonel: 3 ceza varsa engelleyebilirsin bile!)
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists() && userSnap.data().noShowCount >= 3) {
            alert("⚠️ WARNING: You have 3 or more 'No-Show' penalties. Please be careful!");
        }

        const machineRef = doc(db, "machines", machineId);
        
        // Durumu 'reserved' yap
        await updateDoc(machineRef, {
            status: 'reserved',
            userId: user.uid,
            userEmail: user.email, 
            startTime: new Date().toISOString() // Sayaç bu saatten başlayacak
        });
        
        alert("✅ Reserved! You have 5 MINUTES to click 'Start Washing', otherwise it will be cancelled.");
    } catch (error) {
        console.error("Booking Error:", error);
        alert("Error: " + error.message);
    }
}

// 2. YENİ: START MACHINE (Yıkamayı Başlatır)
window.startMachine = async function(machineId) {
    try {
        const machineRef = doc(db, "machines", machineId);
        const docSnap = await getDoc(machineRef);
        const currentData = docSnap.data();
        const currentCount = currentData.usageCount || 0;

        // Durumu 'in_use' yap ve sayacı artır
        await updateDoc(machineRef, {
            status: 'in_use',
            usageCount: currentCount + 1 
        });
        
        alert("✅ Machine Started! Cycle is running.");
    } catch (error) {
        console.error("Start Error:", error);
        alert("Error: " + error.message);
    }
}

// 2. MAKİNEYİ BIRAK (FINISH)
window.finishMachine = async function(machineId) {
    const confirmFinish = confirm("Have you finished your laundry? The machine will be available for others.");
    if (!confirmFinish) return;

    try {
        const machineRef = doc(db, "machines", machineId);

        // Veritabanını güncelle: Tekrar boş yap, kullanıcıyı sil
        await updateDoc(machineRef, {
            status: 'available',
            userId: null,
            userEmail: null,
            startTime: null
        });

        alert("✅ Laundry finished! Machine is now available.");
    } catch (error) {
        console.error("Finish Error:", error);
        alert("Error: " + error.message);
    }
}

// ==========================================
// ⚠️ REPORTING & MAINTENANCE (Arıza Bildirimi)
// ==========================================

// 1. ÖĞRENCİ: MAKİNEYİ BOZUK OLARAK İŞARETLE (REPORT)
window.reportMachine = async function(machineId) {
    const confirmReport = confirm("Are you sure you want to report an issue with this machine? It will be marked as 'Maintenance'.");
    if (!confirmReport) return;

    try {
        const machineRef = doc(db, "machines", machineId);
        
        await updateDoc(machineRef, {
            status: 'disabled',       // Durumu 'disabled' yap
            userId: null,             // Kimse kullanamasın
            startTime: null
        });
        
        alert("⚠️ Machine reported as broken. Admin has been notified.");
    } catch (error) {
        console.error("Report Error:", error);
        alert("Error: " + error.message);
    }
}

// 2. ADMIN: MAKİNEYİ TAMİR ET / TEKRAR AÇ (FIX)
window.fixMachine = async function(machineId) {
    const confirmFix = confirm("Has the issue been resolved? Machine will be marked as 'Available'.");
    if (!confirmFix) return;

    try {
        const machineRef = doc(db, "machines", machineId);
        
        await updateDoc(machineRef, {
            status: 'available'       // Tekrar kullanıma aç
        });
        
        alert("✅ Machine is now fixed and available for students.");
    } catch (error) {
        console.error("Fix Error:", error);
        alert("Error: " + error.message);
    }
}


// ⚠️ ADMIN: NO-SHOW CHECKER (5 Dakika Kuralı & Ceza)
window.checkNoShows = async function() {
    const confirmCheck = confirm("System will check for expired reservations (>5 mins) and penalize users. Proceed?");
    if (!confirmCheck) return;

    try {
        const querySnapshot = await getDocs(collection(db, "machines"));
        const batch = writeBatch(db);
        const now = new Date();
        let expiredCount = 0;

        for (const docSnapshot of querySnapshot.docs) {
            const m = docSnapshot.data();
            
            // Sadece 'reserved' olanlara bak
            if (m.status === 'reserved' && m.startTime) {
                const reservedTime = new Date(m.startTime);
                const diffMinutes = (now - reservedTime) / 1000 / 60; // Dakika farkı

                // Eğer 5 dakikayı geçtiyse
                if (diffMinutes > 5) {
                    // 1. Makineyi Boşa Çıkar
                    batch.update(docSnapshot.ref, {
                        status: 'available',
                        userId: null,
                        startTime: null
                    });

                    // 2. Kullanıcıya Ceza Yaz (No-Show Count Artır)
                    if (m.userId) {
                        const userRef = doc(db, "users", m.userId);
                        const userSnap = await getDoc(userRef);
                        if (userSnap.exists()) {
                            const currentPenalties = userSnap.data().noShowCount || 0;
                            batch.update(userRef, { noShowCount: currentPenalties + 1 });
                        }
                    }
                    expiredCount++;
                }
            }
        }

        if (expiredCount > 0) {
            await batch.commit();
            alert(`✅ Done! ${expiredCount} expired reservations cancelled and users penalized.`);
            loadMachines(true); // Admin listesini yenile
        } else {
            alert("No expired reservations found.");
        }

    } catch (error) {
        console.error("No-Show Check Error:", error);
        alert("Error: " + error.message);
    }
}