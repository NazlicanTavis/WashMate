/**
 * WASHMATE APP - V3 (Approval System + Time Slot Booking + Email Notifications)
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
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

// 🆕 CONSTANT: Time Slots (Updated to 1-Hour Intervals)
const TIME_SLOTS = [
    "08:00 - 09:00",
    "09:00 - 10:00",
    "10:00 - 11:00",
    "11:00 - 12:00",
    "12:00 - 13:00",
    "13:00 - 14:00",
    "14:00 - 15:00",
    "15:00 - 16:00",
    "16:00 - 17:00",
    "17:00 - 18:00",
    "18:00 - 19:00",
    "19:00 - 20:00",
    "20:00 - 21:00",
    "21:00 - 22:00",
    "22:00 - 23:00",
    "23:00 - 24:00",
];

console.log("WashMate loaded succesfully!"); 
// ==========================================
// 🔄 AUTH LISTENER (Keeps you logged in!)
// ==========================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User detected:", user.email);
        // Automatically load dashboard
        checkUserRole(user.uid);
    } else {
        console.log("No user signed in.");
        switchTab('login');
    }
});

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
// STUDENT REGISTRATION (PENDING STATUS)
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
                firstName, lastName, studentID, dorm, block, email, role: "student", status: "pending"
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
            await setDoc(doc(db, "users", cred.user.uid), { fullName, email, role: "admin", status: "approved" });
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
// LOGIN CHECK (BLOCK PENDING USERS)
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
    
    // Hide Admin Controls
    document.getElementById('adminPanelControls').style.display = 'none';
    document.getElementById('adminApprovalsSection').style.display = 'none';
    document.getElementById('addMachineBtn').style.display = 'none';

    // 🆕 Show Reservations for Student
    const myResSection = document.getElementById('myReservationsSection');
    if(myResSection) myResSection.style.display = 'block';
    
    // 🆕 Load Data
    loadMyReservations();
    loadMachines(false);
}

function setupAdminView(user) {
    document.getElementById('welcomeMsg').innerText = `Admin Panel`;
    const dormInfo = document.getElementById('userDormDisplay');
    if(dormInfo) dormInfo.innerText = `System Administrator`;
    
    // Show Admin Controls
    document.getElementById('addMachineBtn').style.display = 'inline-block'; 
    document.getElementById('adminPanelControls').style.display = 'block';
    document.getElementById('adminApprovalsSection').style.display = 'block';

    // Hide Student Reservations
    const myResSection = document.getElementById('myReservationsSection');
    if(myResSection) myResSection.style.display = 'none';

    // Load Data
    loadMachines(true);
    loadPendingUsers(); 
}

// ==========================================
// ADMIN APPROVAL SYSTEM LOGIC
// ==========================================

function loadPendingUsers() {
    const q = query(collection(db, "users"), where("status", "==", "pending"));

    onSnapshot(q, (snapshot) => {
        const grid = document.getElementById('pendingUsersGrid');
        if(!grid) return;
        
        grid.innerHTML = ""; 

        if (snapshot.empty) {
            grid.innerHTML = `<p style="color:#64748b; font-style:italic;">No pending approvals.</p>`;
            return;
        }

        snapshot.forEach(docSnap => {
            const u = docSnap.data();
            const uid = docSnap.id;

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

// ==========================================
// ⚠️ UPDATED: APPROVE USER WITH EMAIL
// ==========================================
window.approveUser = async (uid) => {
    if(!confirm("Approve this student and send email?")) return;
    
    try {
        // 1. Get User Data (We need their Email & Name)
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            alert("Error: User not found!");
            return;
        }
        
        const userData = userSnap.data();

        // 2. Prepare Email Parameters
        const templateParams = {
            to_email: userData.email,
            name: userData.firstName || "Student",
            message: "Your account has been approved! You can now login to WashMate."
        };

        // 3. Send Email (Replace 'YOUR_NEW_TEMPLATE_ID' below!)
        // Note: We use the same Service ID ('service_71yqlq4') but the NEW Template ID
        await emailjs.send('service_71yqlq4', 'template_svwh05l', templateParams);
        console.log(`✅ Approval email sent to ${userData.email}`);

        // 4. Update Database Status
        await updateDoc(userRef, { status: 'approved' });
        
        // Alert is optional since the list updates automatically, but good for confirmation
        alert(`✅ User Approved & Email Sent to ${userData.email}`);

    } catch(e) { 
        console.error("Approval Error:", e);
        alert("Error: " + e.message); 
    }
};

window.rejectUser = async (uid) => {
    if(!confirm("Reject this registration request?")) return;
    try { await deleteDoc(doc(db, "users", uid)); } catch(e) { alert("Error: " + e.message); }
};


// ==========================================
// 🆕 TIME SLOT BOOKING LOGIC
// ==========================================

// 1. Open Booking Modal
window.openBookingModal = async function(machineId, machineName) {
    const modal = document.getElementById('bookingModal');
    if(modal) {
        modal.style.display = 'flex';
        document.getElementById('bookingTitle').innerText = `Book ${machineName}`;
        document.getElementById('selectedMachineId').value = machineId;
        // Default select 'Today'
        selectDateTab('today');
    }
}

window.closeBookingModal = function() {
    const modal = document.getElementById('bookingModal');
    if(modal) modal.style.display = 'none';
}

// 2. Date Tabs Logic
const btnToday = document.getElementById('btnDateToday');
const btnTom = document.getElementById('btnDateTom');

if(btnToday) btnToday.addEventListener('click', () => selectDateTab('today'));
if(btnTom) btnTom.addEventListener('click', () => selectDateTab('tomorrow'));

function selectDateTab(day) {
    document.getElementById('selectedDate').value = day;
    
    if(day === 'today') {
        btnToday.classList.add('active'); btnToday.style.background='white'; btnToday.style.color='#2563eb';
        btnTom.classList.remove('active'); btnTom.style.background='transparent'; btnTom.style.color='#64748b';
    } else {
        btnTom.classList.add('active'); btnTom.style.background='white'; btnTom.style.color='#2563eb';
        btnToday.classList.remove('active'); btnToday.style.background='transparent'; btnToday.style.color='#64748b';
    }
    
    renderSlots();
}

// 3. Render Slots (Check availability)
async function renderSlots() {
    const machineId = document.getElementById('selectedMachineId').value;
    const day = document.getElementById('selectedDate').value;
    const grid = document.getElementById('slotsGrid');
    
    grid.innerHTML = "<p style='grid-column: span 2; text-align:center; color:#64748b;'>Loading availability...</p>";

    try {
        // Calc Date String
        const dateObj = new Date();
        if(day === 'tomorrow') dateObj.setDate(dateObj.getDate() + 1);
        const dateStr = dateObj.toISOString().split('T')[0];

        // Check Firebase for bookings
        const q = query(
            collection(db, "appointments"), 
            where("machineId", "==", machineId),
            where("date", "==", dateStr)
        );
        
        const snapshot = await getDocs(q);
        const bookedSlots = [];
        snapshot.forEach(doc => bookedSlots.push(doc.data().slot));

        grid.innerHTML = ""; 
        const currentHour = new Date().getHours();

        TIME_SLOTS.forEach(slot => {
            const startHour = parseInt(slot.split(':')[0]);
            const btn = document.createElement('button');
            btn.className = "slot-btn";
            btn.innerText = slot;
            // Basic CSS
            btn.style = "padding:12px; border:1px solid #cbd5e1; border-radius:10px; cursor:pointer; font-weight:500; transition:0.2s;";

            let isPast = (day === 'today' && startHour <= currentHour);
            let isBooked = bookedSlots.includes(slot);

            if (isBooked) {
                btn.disabled = true;
                btn.style.background = "#fee2e2";
                btn.style.color = "#b91c1c";
                btn.innerText += " (Busy)";
            } else if (isPast) {
                btn.disabled = true;
                btn.style.background = "#f1f5f9";
                btn.style.color = "#94a3b8";
                btn.innerText += " (Past)";
            } else {
                btn.style.background = "white";
                btn.onclick = () => confirmBooking(slot, dateStr);
            }
            grid.appendChild(btn);
        });
    } catch(error) {
        console.error("Slot Error:", error);
        grid.innerHTML = `<p style="color:red; grid-column:span 2; text-align:center;">Error: ${error.message}</p>`;
    }
}

// 4. Save Booking
async function confirmBooking(slot, dateStr) {
    if(!confirm(`Confirm booking for ${dateStr} at ${slot}?`)) return;

    const machineId = document.getElementById('selectedMachineId').value;
    const user = auth.currentUser;

    try {
        await addDoc(collection(db, "appointments"), {
            machineId: machineId,
            userId: user.uid,
            userEmail: user.email,
            date: dateStr,
            slot: slot,
            createdAt: new Date().toISOString()
        });
        
        alert("✅ Booking Confirmed!");
        closeBookingModal();
        loadMyReservations();
    } catch(e) {
        console.error(e);
        alert("Booking failed: " + e.message);
    }
}

// 5. My Reservations List
function loadMyReservations() {
    const user = auth.currentUser;
    if(!user) return;

    const q = query(collection(db, "appointments"), where("userId", "==", user.uid));
    
    onSnapshot(q, (snapshot) => {
        const list = document.getElementById('myResList');
        if(!list) return;
        list.innerHTML = "";

        if(snapshot.empty) {
            list.innerHTML = "<p style='color:#94a3b8; font-size:0.9rem;'>No active reservations.</p>";
            return;
        }

        snapshot.forEach(d => {
            const r = d.data();
            const card = document.createElement('div');
            card.style = "background:#f8fafc; padding:10px 15px; border-radius:10px; border:1px solid #e2e8f0; font-size:0.9rem; display:flex; align-items:center; gap:10px; margin-bottom:10px;";
            card.innerHTML = `
                <div style="color:#2563eb; font-weight:bold;">${r.date}</div>
                <div style="font-weight:600;">${r.slot}</div>
                <button onclick="deleteReservation('${d.id}')" style="margin-left:auto; color:red; border:none; background:none; cursor:pointer;" title="Cancel"><i class="fa-solid fa-xmark"></i></button>
            `;
            list.appendChild(card);
        });
    });
}

window.deleteReservation = async (id) => {
    if(confirm("Cancel this reservation?")) await deleteDoc(doc(db, "appointments", id));
}


// --- Load Machines (Updated for Time Slots) ---
function loadMachines(isAdmin) {
    onSnapshot(collection(db, "machines"), (snapshot) => {
        const grid = document.getElementById('machinesGrid');
        grid.innerHTML = "";
        
        snapshot.forEach(d => {
            const m = d.data();
            
            // Simplified status logic for Time Slot version
            // "In Use" is set manually by students when they arrive
            let statusClass = 'st-free';
            let statusText = 'AVAILABLE';
            
            if (m.status === 'in_use') {
                statusClass = 'st-busy'; 
                statusText = 'IN USE';
            } 
            else if (m.status === 'disabled') {
                statusClass = 'st-busy'; 
                statusText = '⚠️ MAINTENANCE';
            }

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
                // STUDENT VIEW
                if (m.status === 'disabled') {
                    actionBtn = `<div style="margin-top:10px; font-size:0.8rem; color:#ef4444; font-weight:bold;">OUT OF ORDER</div>`;
                } 
                else if (m.status === 'in_use') {
                    // If in use, only show "Finish" if the user started it? 
                    // Or keep it simple: Anyone can finish if they see it's done? 
                    // Let's assume generic "Finish" for now or just show status.
                    actionBtn = `<button onclick="window.finishMachine('${d.id}')" class="btn-main" style="margin-top:10px; background-color:#16a34a;">Finish / Free Up</button>`;
                }
                else {
                    // AVAILABLE -> Show "Book Slot" OR "Start Now"
                    actionBtn = `
                    <div style="display:flex; flex-direction:column; gap:5px; margin-top:10px;">
                        <button onclick="window.openBookingModal('${d.id}', '${m.name}')" class="btn-main" style="background-color:#2563eb;">📅 Book Future Slot</button>
                        <div style="display:flex; gap:5px;">
                            <button onclick="window.startMachine('${d.id}')" class="btn-main" style="flex:1; background-color:#f59e0b; color:black;">▶ Start Now</button>
                            <button onclick="window.reportMachine('${d.id}')" class="btn-main" style="flex:0.5; background-color:#64748b;" title="Report"><i class="fa-solid fa-triangle-exclamation"></i></button>
                        </div>
                    </div>`;
                }
            }

            let cardStyle = "";
            if(m.status === 'disabled') cardStyle = "opacity:0.8; background:#fef2f2;";

            grid.innerHTML += `
            <div class="machine-card" style="${cardStyle}">
                <div style="font-size:2rem; color:${m.status==='disabled'?'#ef4444':(m.status==='in_use'?'#dc2626':'#2563eb')}; margin-bottom:10px;">
                    <i class="fa-solid ${m.status==='disabled'?'fa-triangle-exclamation':'fa-soap'}"></i>
                </div>
                <h3>${m.name}</h3>
                <div style="font-size:0.9rem; color:#475569; font-weight:600; margin-bottom:5px;">
                    ${m.brand || 'Generic'} • ${m.capacity || '-'}kg
                </div>
                <p style="color:#64748b;">${m.type}</p>
                ${isAdmin ? statsHTML : ''}
                <div class="status-badge ${statusClass}">${statusText}</div>
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
// Removed Check No Shows button listener since we removed the logic

// ==========================================
// START / FINISH / REPORT LOGIC (UPDATED)
// ==========================================

// NOTE: bookMachine is removed. We use openBookingModal instead.

window.startMachine = async function(machineId) {
    try {
        const user = auth.currentUser;
        if (!user) { alert("Please login first!"); return; }

        const machineRef = doc(db, "machines", machineId);
        const docSnap = await getDoc(machineRef);
        const m = docSnap.data();

        await updateDoc(machineRef, { 
            status: 'in_use', 
            usageCount: (m.usageCount || 0) + 1,
            userId: user.uid,
            userEmail: user.email,
            // ⚠️ NEW: We save the Start Time so the auto-checker knows when to finish it
            startTime: new Date().toISOString() 
        });

        sendEmailNotification(user.email, m.name, "start"); // Helper function updated below

        alert(`✅ Machine Started! Email sent.`);

    } catch (error) { 
        console.error("Start Error:", error); 
        alert("Error: " + error.message); 
    }
}

window.finishMachine = async function(machineId) {
    if (!confirm("Finish laundry and mark available?")) return;

    try {
        // 1. Get machine data BEFORE clearing it (to find the email)
        const machineRef = doc(db, "machines", machineId);
        const docSnap = await getDoc(machineRef);
        
        if (docSnap.exists()) {
            const m = docSnap.data();
            
            // 2. Send the "Finished" Email
            // Note: We use the helper function you already created
            if (m.userEmail) {
                const templateParams = {
                    to_email: m.userEmail,
                    name: "Student",
                    machine: m.name,
                    status: "Finished ✅",
                    message: "Your laundry cycle has been marked as finished. Please collect your items immediately."
                };
                
                // Use the SAME Service ID and Template ID that worked for the Start email
                await emailjs.send('service_71yqlq4', 'template_c3n187k', templateParams);
                console.log("Finish email sent!");
            }
        }

        // 3. Clear the machine data (Make Available)
        await updateDoc(machineRef, { 
            status: 'available', 
            userId: null, 
            userEmail: null, 
            startTime: null 
        });

        alert("✅ Laundry finished! Notification email sent.");

    } catch (error) { 
        console.error("Finish Error:", error); 
        alert("Error: " + error.message); 
    }
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

window.deleteMachine = async (id) => {
    if(confirm("Delete machine?")) await deleteDoc(doc(db, "machines", id));
};

// ==========================================
// 📧 EMAIL NOTIFICATION HELPER
// ==========================================
// ==========================================
// 📧 EMAIL NOTIFICATION HELPER (Updated)
// ==========================================
// ==========================================
// 📧 EMAIL NOTIFICATION HELPER (Fixed)
// ==========================================
async function sendEmailNotification(userEmail, machineName, type) {
    if(!userEmail) return;

    let subjectStatus = "";
    let messageBody = "";

    if (type === "start") {
        // Calculate finish time (currently set to 2 mins for testing)
        const now = new Date();
        now.setMinutes(now.getMinutes() + 2); 
        const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        subjectStatus = "Started ⏳";
        messageBody = `Your laundry cycle has started! It will finish at approximately ${timeString}.`;
    } 
    else if (type === "finish") {
        subjectStatus = "Finished ✅";
        messageBody = `Your laundry timer is up! The machine has been marked as available. Please collect your items immediately.`;
    }

    const templateParams = {
        to_email: userEmail,
        name: "Student",
        machine: machineName,
        status: subjectStatus,
        message: messageBody
    };

    try {
        // ✅ I updated these with the IDs found in your finishMachine function
        await emailjs.send('service_71yqlq4', 'template_c3n187k', templateParams);
        console.log(`📧 ${type} email sent to ${userEmail}`);
    } catch(error) {
        console.error("Failed to send email:", error);
    }
}


// ==========================================
// ⏱️ AUTOMATIC BACKGROUND CHECKS ("Heartbeat")
// ==========================================
// Runs every 60 seconds
setInterval(() => {
    checkExpiredMachines(); // Existing: Checks for finish time
    checkNoShows();         // 🆕 NEW: Checks for late students
}, 60000);


async function checkExpiredMachines() {
    console.log("💜 Heartbeat: Checking for finished machines...");
    
    try {
        // 1. Get all machines that are currently "in_use"
        const q = query(collection(db, "machines"), where("status", "==", "in_use"));
        const snapshot = await getDocs(q);

        const now = new Date();

        snapshot.forEach(async (docSnap) => {
            const m = docSnap.data();
            
            if (m.startTime) {
                const startTime = new Date(m.startTime);
                // Calculate difference in minutes
                const diffMinutes = (now - startTime) / 1000 / 60;

                // ⚠️ CHANGE '2' TO '32' FOR REAL APP
                if (diffMinutes >= 2) {
                    console.log(`Machine ${m.name} finished! Auto-completing...`);

                    // 2. Send "Finished" Email
                    if (m.userEmail) {
                        sendEmailNotification(m.userEmail, m.name, "finish");
                    }

                    // 3. Reset Machine to Available
                    await updateDoc(docSnap.ref, {
                        status: 'available',
                        userId: null,
                        userEmail: null,
                        startTime: null
                    });
                }
            }
        });
    } catch (error) {
        console.error("Auto-Check Error:", error);
    }
}


// 🆕 5-MINUTE NO-SHOW RULE
async function checkNoShows() {
    console.log("🕵️ Checking for No-Shows...");
    
    try {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // Today's date (YYYY-MM-DD)
        
        // 1. Get ALL appointments for TODAY
        const q = query(collection(db, "appointments"), where("date", "==", dateStr));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) return;

        snapshot.forEach(async (appSnap) => {
            const booking = appSnap.data();
            
            // 2. Parse the Slot Start Time (e.g., "10:00 - 12:00")
            const slotStartString = booking.slot.split(' - ')[0]; // Gets "10:00"
            const [hours, minutes] = slotStartString.split(':');
            
            // Create a Date object for the Booking Start Time
            const bookingTime = new Date();
            bookingTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            // Calculate how many minutes late they are
            const diffMinutes = (now - bookingTime) / 60000; // milliseconds to minutes

            // ⚠️ RULE: If they are more than 5 mins late (and less than 120 mins)
            if (diffMinutes > 5 && diffMinutes < 120) {
                
                // 3. Check if Machine is STILL Available (Not Started)
                const mRef = doc(db, "machines", booking.machineId);
                const mSnap = await getDoc(mRef);
                
                if (mSnap.exists() && mSnap.data().status === 'available') {
                    console.log(`⚠️ No-Show detected for ${booking.userEmail}. Deleting reservation.`);
                    
                    // A. Delete the Appointment
                    await deleteDoc(appSnap.ref);
                    
                    // B. Penalize the User (Increase No-Show Count)
                    const uRef = doc(db, "users", booking.userId);
                    const uSnap = await getDoc(uRef);
                    
                    if(uSnap.exists()) {
                        const currentCount = uSnap.data().noShowCount || 0;
                        await updateDoc(uRef, { noShowCount: currentCount + 1 });
                    }

                    // C. Optional: Send "Cancelled" Email
                    // You can use your sendEmailNotification helper here if you want!
                }
            }
        });

    } catch (error) {
        console.error("No-Show Check Error:", error);
    }
}

