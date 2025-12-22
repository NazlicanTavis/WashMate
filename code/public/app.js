/**
 * WASHMATE APP - V2 (With Approval System)
 * -----------------------------
 * Features:
 * 1. Admin Panel with "Add Machine" Modal Form.
 * 2. User Approval System (Approve/Reject).
 * 3. Student Booking & Reporting.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
// UPDATED IMPORTS: Added 'query' and 'where'
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, addDoc, deleteDoc, writeBatch, getDocs, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


//Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyD8pcFbP4WANy68hDC1ohkM5DU_Rpx8EdA",
    authDomain: "washmate-227cf.firebaseapp.com",
    projectId: "washmate-227cf",
    storageBucket: "washmate-227cf.firebasestorage.app",
    messagingSenderId: "300306123506",
    appId: "1:300306123506:web:b27d5e492a900bbec59e6b",
    measurementId: "G-L4FKW04DPB"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("WashMate loaded succesfully!"); 

// Tab Switching
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

// ==========================================
// ⚠️ UPDATED: STUDENT REGISTRATION (PENDING STATUS)
// ==========================================
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
            
            // Set status to 'pending' by default
            await setDoc(doc(db, "users", cred.user.uid), {
                firstName, 
                lastName, 
                studentID, 
                dorm, 
                block, 
                email, 
                role: "student",
                status: "pending" // <--- NEW FIELD
            });

            alert("✅ Registration Successful!\n\nYour account is currently PENDING approval from the Administrator. You cannot login until approved.");
            window.location.reload();
        } catch (e) { 
            console.error(e);
            alert("Error: " + e.message); 
        }
    });
}

// Admin Reg
const btnAdminReg = document.getElementById('btnAdminReg');
if(btnAdminReg) {
    btnAdminReg.addEventListener('click', async () => {
        const fullName = document.getElementById('aFullName').value;
        const email = document.getElementById('aEmail').value;
        const pass = document.getElementById('aPass').value;

        if(!email || !pass) { alert("Please fill in all fields!"); return; }

        try {
            const cred = await createUserWithEmailAndPassword(auth, email, pass);
            // Admins are auto-approved for now, or you can make them pending too
            await setDoc(doc(db, "users", cred.user.uid), { 
                fullName, 
                email, 
                role: "admin", 
                status: "approved" 
            });
            alert("Admin Registration Successful!");
            window.location.reload();
        } catch (e) { alert("Error: " + e.message); }
    });
}

// Login
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

// ==========================================
// ⚠️ UPDATED: LOGIN CHECK (BLOCK PENDING USERS)
// ==========================================
async function checkUserRole(uid) {
    const docSnap = await getDoc(doc(db, "users", uid));
    
    if (docSnap.exists()) {
        const data = docSnap.data();

        // 1. Check Approval Status
        if (data.status === 'pending') {
            alert("⏳ Account Pending Approval\n\nThe administrator has not approved your account yet. Please try again later.");
            await signOut(auth); // Log them out immediately
            return;
        }

        if (data.status === 'rejected') {
            alert("🚫 Account Rejected\n\nYour registration request was rejected by the administrator.");
            await signOut(auth);
            return;
        }
        
        // 2. If Approved, Proceed
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('dashboardView').style.display = 'block';
        const container = document.getElementById('mainAppContainer');
        if(container) container.classList.add('dashboard-mode');

        if (data.role === 'admin') setupAdminView(data);
        else setupStudentView(data);
    } else {
        alert("User data not found in database.");
        await signOut(auth);
    }
}

function setupStudentView(user) {
    document.getElementById('welcomeMsg').innerText = `Hello, ${user.firstName || 'Student'}`;
    if (user.noShowCount && user.noShowCount >= 3) {
        const warningDiv = document.createElement('div');
        warningDiv.style = "background:#fee2e2; color:#b91c1c; padding:15px; margin-bottom:20px; border-radius:12px; border:1px solid #ef4444; font-weight:bold;";
        warningDiv.innerHTML = `⚠️ ACCOUNT WARNING: You have ${user.noShowCount} 'No-Show' penalties! Please attend your reservations.`;
        const dashHeader = document.querySelector('.dash-header');
        dashHeader.parentNode.insertBefore(warningDiv, dashHeader.nextSibling);
    }
    const dormInfo = document.getElementById('userDormDisplay');
    if(dormInfo) dormInfo.innerText = `${user.dorm || ''} • Block ${user.block || ''}`;
    
    const adminControls = document.getElementById('adminPanelControls');
    if(adminControls) adminControls.style.display = 'none';
    
    // Hide Admin Approval Section for Students
    const approvalSection = document.getElementById('adminApprovalsSection');
    if(approvalSection) approvalSection.style.display = 'none';
    
    const addBtn = document.getElementById('addMachineBtn');
    if(addBtn) addBtn.style.display = 'none';

    loadMachines(false);
}

function setupAdminView(user) {
    document.getElementById('welcomeMsg').innerText = `Admin Panel`;
    const dormInfo = document.getElementById('userDormDisplay');
    if(dormInfo) dormInfo.innerText = `System Administrator`;
    
    const addBtn = document.getElementById('addMachineBtn');
    if(addBtn) addBtn.style.display = 'inline-block'; 

    const adminControls = document.getElementById('adminPanelControls');
    if(adminControls) adminControls.style.display = 'block';

    // Show Approval Section
    const approvalSection = document.getElementById('adminApprovalsSection');
    if(approvalSection) approvalSection.style.display = 'block';

    // Load Data
    loadMachines(true);
    loadPendingUsers(); // <--- NEW FUNCTION CALL
}

// ==========================================
// ⚠️ NEW: ADMIN APPROVAL SYSTEM LOGIC
// ==========================================

function loadPendingUsers() {
    // Listen specifically for users where status == 'pending'
    const q = query(collection(db, "users"), where("status", "==", "pending"));

    onSnapshot(q, (snapshot) => {
        const grid = document.getElementById('pendingUsersGrid');
        if(!grid) return;
        
        grid.innerHTML = ""; // Clear current list

        if (snapshot.empty) {
            grid.innerHTML = `<p style="color:#64748b; font-style:italic;">No pending approvals.</p>`;
            return;
        }

        snapshot.forEach(docSnap => {
            const u = docSnap.data();
            const uid = docSnap.id;

            // Create a nice card for the pending user
            const card = document.createElement('div');
            card.style = "background:white; border:1px solid #e2e8f0; padding:15px; border-radius:12px; box-shadow:0 2px 4px rgba(0,0,0,0.05);";
            
            card.innerHTML = `
                <div style="font-weight:bold; color:#1e293b; margin-bottom:5px;">${u.firstName} ${u.lastName}</div>
                <div style="font-size:0.85rem; color:#64748b; margin-bottom:2px;">ID: ${u.studentID}</div>
                <div style="font-size:0.85rem; color:#64748b; margin-bottom:10px;">${u.dorm}, Block ${u.block}</div>
                <div style="display:flex; gap:10px;">
                    <button onclick="window.approveUser('${uid}')" style="flex:1; background:#16a34a; color:white; border:none; padding:8px; border-radius:6px; cursor:pointer; font-weight:600;">Approve</button>
                    <button onclick="window.rejectUser('${uid}')" style="flex:1; background:#ef4444; color:white; border:none; padding:8px; border-radius:6px; cursor:pointer; font-weight:600;">Reject</button>
                </div>
            `;
            grid.appendChild(card);
        });
    });
}

// Global functions for the buttons
window.approveUser = async (uid) => {
    if(!confirm("Approve this student?")) return;
    try {
        await updateDoc(doc(db, "users", uid), { status: 'approved' });
        // Alert is optional, the UI will update automatically due to onSnapshot
    } catch(e) {
        alert("Error approving: " + e.message);
    }
};

window.rejectUser = async (uid) => {
    if(!confirm("Reject (Delete) this registration request?")) return;
    try {
        // We simply delete the user document. 
        // Note: The Auth user still exists in Firebase Auth but they can't log in because checkUserRole fails.
        // For a full clean up, you'd need Cloud Functions, but this is sufficient for this scope.
        await deleteDoc(doc(db, "users", uid));
    } catch(e) {
        alert("Error rejecting: " + e.message);
    }
};


// --- Load Machines ---
function loadMachines(isAdmin) {
    onSnapshot(collection(db, "machines"), (snapshot) => {
        const grid = document.getElementById('machinesGrid');
        grid.innerHTML = "";
        
        snapshot.forEach(d => {
            const m = d.data();
            let statusClass = 'st-free';
            let statusText = 'AVAILABLE';
            
            if (m.status === 'in_use') {
                statusClass = 'st-busy'; 
                statusText = 'IN USE';
            } 
            else if (m.status === 'reserved') {
                statusClass = 'st-busy'; 
                statusText = '⏳ RESERVED'; 
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
                const deleteBtn = `<button onclick="window.deleteMachine('${d.id}')" style="color:red; float:right; border:none; background:none; cursor:pointer;" title="Delete"><i class="fa-solid fa-trash"></i></button>`;
                
                if (m.status === 'disabled') {
                    actionBtn = `<button onclick="window.fixMachine('${d.id}')" class="btn-main" style="margin-top:10px; background-color:#f59e0b; color:black;">Repair / Enable</button>`;
                } else {
                    actionBtn = `<div style="height:35px;"></div>`; 
                }
                statsHTML = `${deleteBtn}<div style="font-size:0.8rem; color:#64748b; margin-top:5px; border-top:1px solid #eee; padding-top:5px;">Total Cycles: <b>${usageStats}</b></div>`;
            } 
            else {
                if (m.status === 'available') {
                    actionBtn = `
                    <div style="display:flex; gap:5px; margin-top:10px;">
                        <button onclick="window.bookMachine('${d.id}')" class="btn-main" style="flex:2; background-color:#2563eb;">Book</button>
                        <button onclick="window.reportMachine('${d.id}')" class="btn-main" style="flex:1; background-color:#64748b;" title="Report"><i class="fa-solid fa-triangle-exclamation"></i></button>
                    </div>`;
                }
                else if (m.status === 'reserved' && m.userId === currentUser.uid) {
                    actionBtn = `<button onclick="window.startMachine('${d.id}')" class="btn-main" style="margin-top:10px; background-color:#f59e0b; color:black;">▶ Start Washing</button>
                                 <div style="font-size:0.75rem; color:red; margin-top:5px;">You have 5 mins to start!</div>`;
                }
                else if (m.status === 'in_use' && m.userId === currentUser.uid) {
                    actionBtn = `<button onclick="window.finishMachine('${d.id}')" class="btn-main" style="margin-top:10px; background-color:#16a34a;">Finish / Release</button>`;
                }
                else if (m.status === 'disabled') {
                    actionBtn = `<div style="margin-top:10px; font-size:0.8rem; color:#ef4444; font-weight:bold;">OUT OF ORDER</div>`;
                }
                else {
                    actionBtn = `<div style="margin-top:10px; font-size:0.8rem; color:#94a3b8;">In use/Reserved by others</div>`;
                }
            }

            let cardStyle = "";
            if(m.status === 'disabled') cardStyle = "opacity:0.8; background:#fef2f2;";
            if(m.status === 'reserved') cardStyle = "border: 2px solid #f59e0b; background:#fffbeb;";

            grid.innerHTML += `
            <div class="machine-card" style="${cardStyle}">
                <div style="font-size:2rem; color:${m.status==='disabled'?'#ef4444':(m.status==='reserved'?'#f59e0b':'#2563eb')}; margin-bottom:10px;">
                    <i class="fa-solid ${m.status==='disabled'?'fa-triangle-exclamation':'fa-soap'}"></i>
                </div>
                <h3>${m.name}</h3>
                <div style="font-size:0.9rem; color:#475569; font-weight:600; margin-bottom:5px;">
                    ${m.brand || 'Generic'} • ${m.capacity || '-'}kg
                </div>
                <p style="color:#64748b;">${m.type}</p>
                ${isAdmin ? statsHTML : ''}
                <div class="status-badge ${statusClass}" style="${m.status==='reserved'?'background:#fef3c7; color:#b45309':''}">${statusText}</div>
                ${!isAdmin ? actionBtn : ''}
                ${isAdmin && m.status === 'disabled' ? actionBtn : ''}
            </div>`;
        });
    });
}

window.logout = () => signOut(auth).then(() => location.reload());

// =======================================================
// ADD MACHINE MODAL
// =======================================================
window.addMachine = function() {
    const modal = document.getElementById('addMachineModal');
    if(modal) modal.style.display = 'flex';
};

const btnSaveMachine = document.getElementById('btnSaveMachine');
const btnCancelAdd = document.getElementById('btnCancelAdd');

if(btnSaveMachine) {
    btnSaveMachine.addEventListener('click', async () => {
        const nameVal = document.getElementById('newM_Name').value;
        const brandVal = document.getElementById('newM_Brand').value;
        const typeVal = document.getElementById('newM_Type').value;
        const capVal = document.getElementById('newM_Cap').value;

        if (!nameVal || !brandVal || !capVal) {
            alert("Please fill in all fields!");
            return;
        }

        try {
            await addDoc(collection(db, "machines"), { 
                name: nameVal, 
                brand: brandVal,
                type: typeVal,
                capacity: capVal,
                status: 'available',
                usageCount: 0
            });
            document.getElementById('addMachineModal').style.display = 'none';
            document.getElementById('newM_Name').value = "";
            document.getElementById('newM_Brand').value = "";
            document.getElementById('newM_Cap').value = "";
        } catch(error) {
            console.error("Error adding machine: ", error);
            alert("Error: " + error.message);
        }
    });
}

if(btnCancelAdd) {
    btnCancelAdd.addEventListener('click', () => {
        document.getElementById('addMachineModal').style.display = 'none';
    });
}

// ==========================================
// ADMIN ADVANCED FEATURES
// ==========================================

window.initializeDatabase = async function() {
    const confirmInit = confirm("WARNING: This will automatically add 10 test machines. Proceed?");
    if (!confirmInit) return;
    try {
        const batch = writeBatch(db); 
        for (let i = 1; i <= 5; i++) {
            batch.set(doc(collection(db, "machines")), {
                type: "Washer", name: `Washer #${i}`, brand: "Samsung", capacity: "9", status: "available"
            });
            batch.set(doc(collection(db, "machines")), {
                type: "Dryer", name: `Dryer #${i}`, brand: "LG", capacity: "8", status: "available"
            });
        }
        await batch.commit(); 
        alert("✅ Success! 10 machines added.");
    } catch (error) { console.error("Init Error:", error); alert("Error: " + error.message); }
}

window.resetSystem = async function() {
    const confirmReset = confirm("WARNING: Reset all machines to 'Available'?");
    if (!confirmReset) return;
    try {
        const querySnapshot = await getDocs(collection(db, "machines"));
        const batch = writeBatch(db);
        querySnapshot.forEach((doc) => {
            batch.update(doc.ref, { status: "available", startTime: null, userId: null });
        });
        await batch.commit();
        alert("✅ System Reset!");
    } catch (error) { console.error("Reset Error:", error); alert("Reset failed: " + error.message); }
}

window.backupData = async function() {
    try {
        const querySnapshot = await getDocs(collection(db, "machines"));
        let data = [];
        querySnapshot.forEach((doc) => { data.push({ id: doc.id, ...doc.data() }); });
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "washmate_backup.json";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        alert("✅ Backup downloaded!");
    } catch (error) { console.error("Backup Error:", error); alert("Backup failed: " + error.message); }
}

const btnInit = document.getElementById('btnInitialize');
if(btnInit) btnInit.addEventListener('click', window.initializeDatabase);
const btnReset = document.getElementById('btnReset');
if(btnReset) btnReset.addEventListener('click', window.resetSystem);
const btnBackup = document.getElementById('btnBackup');
if(btnBackup) btnBackup.addEventListener('click', window.backupData);
const btnNoShow = document.getElementById('btnNoShow');
if(btnNoShow) btnNoShow.addEventListener('click', window.checkNoShows);

// ==========================================
// BOOKING & REPORTING LOGIC
// ==========================================

window.bookMachine = async function(machineId) {
    const user = auth.currentUser;
    if (!user) { alert("Please login first!"); return; }
    try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists() && userSnap.data().noShowCount >= 3) {
            alert("⚠️ WARNING: You have 3 or more 'No-Show' penalties.");
        }
        await updateDoc(doc(db, "machines", machineId), {
            status: 'reserved', userId: user.uid, userEmail: user.email, startTime: new Date().toISOString()
        });
        alert("✅ Reserved! You have 5 MINUTES to start.");
    } catch (error) { console.error("Booking Error:", error); alert("Error: " + error.message); }
}

window.startMachine = async function(machineId) {
    try {
        const machineRef = doc(db, "machines", machineId);
        const docSnap = await getDoc(machineRef);
        await updateDoc(machineRef, { status: 'in_use', usageCount: (docSnap.data().usageCount || 0) + 1 });
        alert("✅ Machine Started!");
    } catch (error) { console.error("Start Error:", error); alert("Error: " + error.message); }
}

window.finishMachine = async function(machineId) {
    if (!confirm("Finish laundry?")) return;
    try {
        await updateDoc(doc(db, "machines", machineId), { status: 'available', userId: null, userEmail: null, startTime: null });
        alert("✅ Laundry finished!");
    } catch (error) { console.error("Finish Error:", error); alert("Error: " + error.message); }
}

window.reportMachine = async function(machineId) {
    if (!confirm("Report issue?")) return;
    try {
        await updateDoc(doc(db, "machines", machineId), { status: 'disabled', userId: null, startTime: null });
        alert("⚠️ Machine reported as broken.");
    } catch (error) { console.error("Report Error:", error); alert("Error: " + error.message); }
}

window.fixMachine = async function(machineId) {
    if (!confirm("Mark as Fixed?")) return;
    try {
        await updateDoc(doc(db, "machines", machineId), { status: 'available' });
        alert("✅ Machine fixed.");
    } catch (error) { console.error("Fix Error:", error); alert("Error: " + error.message); }
}

window.checkNoShows = async function() {
    if (!confirm("Check for expired reservations?")) return;
    try {
        const querySnapshot = await getDocs(collection(db, "machines"));
        const batch = writeBatch(db);
        const now = new Date();
        let expiredCount = 0;
        for (const docSnapshot of querySnapshot.docs) {
            const m = docSnapshot.data();
            if (m.status === 'reserved' && m.startTime) {
                if ((now - new Date(m.startTime)) / 1000 / 60 > 5) {
                    batch.update(docSnapshot.ref, { status: 'available', userId: null, startTime: null });
                    if (m.userId) {
                        const userRef = doc(db, "users", m.userId);
                        const userSnap = await getDoc(userRef);
                        if (userSnap.exists()) batch.update(userRef, { noShowCount: (userSnap.data().noShowCount || 0) + 1 });
                    }
                    expiredCount++;
                }
            }
        }
        if (expiredCount > 0) { await batch.commit(); alert(`✅ ${expiredCount} expired reservations cancelled.`); loadMachines(true); } 
        else { alert("No expired reservations found."); }
    } catch (error) { console.error("No-Show Check Error:", error); alert("Error: " + error.message); }
}

window.deleteMachine = async (id) => {
    if(confirm("Delete machine?")) await deleteDoc(doc(db, "machines", id));
};