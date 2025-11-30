# WashMate - Cloud-Based Laundry Management System

**Course:** CNG 495 - Cloud Computing (Fall 2025)  
**Team Members:**
* Nazlıcan Taviş (2751741)
* Nisa Sağdıç (2751691)
* Fatih Demirbilek (2526234)



### Key Features for Now
* **Login and Register of User and admin:** Admin and students can register and login to system succesfully.
* **User Dashboard:** Students can view the real-time status (Available/In Use) of washing and drying machines.
* **Admin Control Panel:** Adminiscan add/remove machines.

---

## Repository Structure

* **`/code`**: The complete source code for the web application (HTML, CSS, JS, Firebase Config).
* **`/proposal`**: Project proposal document and initial requirements.
* **`/progress`**: Progress reports and intermediate milestones.

---

## Technologies Used
The project is built using a Client-Side Web Application architecture powered by Google Firebase services:

* **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
* **Authentication:** Firebase Authentication (Email/Password)
* **Database:** Cloud Firestore (NoSQL Real-time Database)
* **Hosting:** Firebase Hosting (CDN)
* **Backend Logic:** Firebase Cloud Functions

---

## How to Run the Project
1.  Clone the repository:
    git clone https://github.com/NazlicanTavis/WashMate.git
2.  Navigate to the code directory:
    cd code
3.  Install Firebase tools (if not installed):
    npm install -g firebase-tools
4.  Run the local server:
    firebase serve
5.  Open `http://localhost:5000` in your browser.