// Get the logged-in user's details
const token = sessionStorage.getItem("doubthubToken");
const savedUser = sessionStorage.getItem("doubthubUser");

const pageRole = document.body.dataset.role;

let user = null;

try {
    user = JSON.parse(savedUser);
} catch (error) {
    user = null;
}

// Check login and user role
if (!token || !user || user.role !== pageRole) {

    sessionStorage.removeItem("doubthubToken");
    sessionStorage.removeItem("doubthubUser");

    window.location.replace("index.html");

} else {

    // Display user's name
    const userName = document.getElementById("userName");

    if (userName) {
        userName.textContent = user.fullName;
    }

    // Display student's classroom
    if (pageRole === "student") {

        const classInfo = document.getElementById("classInfo");

        if (classInfo) {
            classInfo.textContent =
                user.className + " — Section " + user.section;
        }
    }

    // Display faculty's assigned subjects
    if (pageRole === "faculty") {

        const facultySubjects =
            document.getElementById("facultySubjects");

        if (facultySubjects) {
            facultySubjects.textContent =
                user.subjects.join(", ");
        }
    }
}

// Logout functionality
const logoutLink = document.getElementById("logoutLink");

if (logoutLink) {

    logoutLink.addEventListener("click", function (event) {

        event.preventDefault();

        sessionStorage.removeItem("doubthubToken");
        sessionStorage.removeItem("doubthubUser");

        window.location.replace("index.html");
    });
}