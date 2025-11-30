import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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

//Initilazte the application
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("WashMate loaded succesfully!"); 

//This function şs to change between tabs
window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    if(tabName === 'login') {
        //find login tab and make it actgive
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

        if(!email || !pass || !firstName) { alert("Please fill all the areas!"); return; }

        try {
            const cred = await createUserWithEmailAndPassword(auth, email, pass);
            await setDoc(doc(db, "users", cred.user.uid), {
                firstName, lastName, studentID, dorm, block, email, role: "student"
            });
            alert("Succesful Registration! You will be directed to login page.");
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

        if(!email || !pass) { alert("Please fill all the areas!"); return; }

        try {
            const cred = await createUserWithEmailAndPassword(auth, email, pass);
            await setDoc(doc(db, "users", cred.user.uid), { fullName, email, role: "admin" });
            alert("Admin Registration Succesful!");
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
        } catch (e) { alert("Error in Login: " + e.message); }
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
    const dormInfo = document.getElementById('userDormDisplay');
    if(dormInfo) dormInfo.innerText = `${user.dorm || ''} • Blok ${user.block || ''}`;
    loadMachines(false);
}

function setupAdminView(user) {
    document.getElementById('welcomeMsg').innerText = `Admin Panel`;
    const dormInfo = document.getElementById('userDormDisplay');
    if(dormInfo) dormInfo.innerText = `Sistem Administrator`;
    
    const addBtn = document.getElementById('addMachineBtn');
    if(addBtn) addBtn.style.display = 'block'; 
    loadMachines(true);
}

function loadMachines(isAdmin) {
    onSnapshot(collection(db, "machines"), (snapshot) => {
        const grid = document.getElementById('machinesGrid');
        grid.innerHTML = "";
        snapshot.forEach(d => {
            const m = d.data();
            const statusClass = m.status === 'available' ? 'st-free' : 'st-busy';
            
            //delete button for admin
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

//global functions
window.logout = () => signOut(auth).then(() => location.reload());
window.addMachine = async () => {
    const name = prompt("Machine Name:");
    if(name) await addDoc(collection(db, "machines"), { name, type: 'Washing', status: 'available' });
};
window.deleteMachine = async (id) => {
    if(confirm("Do you want to delete?")) await deleteDoc(doc(db, "machines", id));
};