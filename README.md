# WashMate - Cloud-Based Laundry Management System

**Course:** CNG 495 - Cloud Computing (Fall 2025)  
**Team Members:**
* Nazlıcan Taviş (2751741)
* Nisa Sağdıç (2751691)
* Fatih Demirbilek (2526234)



### Key Features of the Project
* **Login and Register of User and admin:** Admin and students can register and login to system succesfully,
students should wait admin approval to login to system.
* **User Dashboard:** Students can view the real-time status (Available/In Use/Out of Order/Reserved) of washing 
and drying machines. They can book time slots, or if the machine is available they can start immediately. 
They can view the laundry rules and service information. If they don't attend their booked slots 3 times, 
they will see an warning in their dashborad. They can issue a machine if it is not working properly. 
When they finish they can state that with a button.
* **Admin Control Panel:** Admins can add/remove machines. They can accept or reject student registrations. 
If the machine is reported with a problem, they can see and make it available when it is fixed. 
There is system control panel for the admin. From that they can delete, initialize backup and save the database 
in their local computer. Also they can check student who didn't attend their booked slots and send them warning.
They can see status of the all machines and also how many times they were used.

---

## Repository Structure

* **`/code`**: The complete source code for the web application (HTML, CSS, JS, Firebase Config).
* **`/proposal`**: Project proposal document and initial requirements.
* **`/progress`**: Progress reports and intermediate milestones.
* **`/final`**: Final reports.

---

## Technologies Used
The project is built using a Client-Side Web Application architecture powered by Google Firebase services:

* **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
* **Authentication:** Firebase Authentication (Email/Password)
* **Database:** Cloud Firestore (NoSQL Real-time Database)
* **Hosting:** Firebase Hosting (CDN)
* **Backend Logic:** Firebase Cloud Functions
* **Email Sender:** Email JS

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
6.  Or you can directly reach with this link: https://washmate-227cf.web.app/
