
const roles = document.querySelectorAll(".role");
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const authForm = document.getElementById("authForm");

const formTitle = document.getElementById("formTitle");
const formSubtitle = document.getElementById("formSubtitle");
const idLabel = document.getElementById("idLabel");
const userId = document.getElementById("userId");
const submitBtn = document.getElementById("submitBtn");
const switchText = document.getElementById("switchText");
const message = document.getElementById("formMessage");

const nameField = document.getElementById("nameField");
const emailField = document.getElementById("emailField");
const classField = document.getElementById("classField");
const subjectField = document.getElementById("subjectField");
const confirmField = document.getElementById("confirmField");
const formOptions = document.getElementById("formOptions");

const fullName = document.getElementById("fullName");
const email = document.getElementById("email");
const className = document.getElementById("className");
const section = document.getElementById("section");
const subjects = document.getElementById("subjects");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");

let currentRole = "student";
let currentMode = "login";

function showField(field, show) {
    field.classList.toggle("hidden", !show);
}

function setRequired(input, required) {
    input.required = required;
}

function updateForm() {
    const isAdmin = currentRole === "admin";

    // Admin is allowed to sign in only.
    if (isAdmin && currentMode === "register") {
        currentMode = "login";
    }

    const isRegister = currentMode === "register";
    const isStudent = currentRole === "student";
    const isFaculty = currentRole === "faculty";

    roles.forEach(function (button) {
        button.classList.toggle(
            "active",
            button.dataset.role === currentRole
        );
    });

    loginTab.classList.toggle("active", !isRegister);
    registerTab.classList.toggle("active", isRegister);
    registerTab.classList.toggle("hidden", isAdmin);

    formTitle.textContent = isRegister
        ? "Create your account."
        : "Sign in to your world.";

    formSubtitle.textContent = isRegister
        ? "Your learning community starts here."
        : "Pick up where your curiosity left off.";

    idLabel.textContent = isStudent
        ? "Student ID"
        : isAdmin
            ? "Admin ID"
            : "Faculty ID";

    userId.placeholder = isStudent
        ? "Enter your student ID"
        : isAdmin
            ? "Enter your admin ID"
            : "Enter your faculty ID";

    submitBtn.innerHTML = isRegister
        ? 'Create Account <span>→</span>'
        : 'Sign In <span>→</span>';

    showField(nameField, isRegister);
    showField(emailField, isRegister);
    showField(classField, isRegister && isStudent);
    showField(subjectField, isRegister && isFaculty);
    showField(confirmField, isRegister);
    showField(formOptions, !isRegister);

    setRequired(fullName, isRegister);
    setRequired(email, isRegister);
    setRequired(className, isRegister && isStudent);
    setRequired(section, isRegister && isStudent);
    setRequired(subjects, isRegister && isFaculty);
    setRequired(confirmPassword, isRegister);

    if (isAdmin) {
        switchText.textContent = "";
    } else {
        switchText.innerHTML = isRegister
            ? 'Already have an account? <button type="button" id="switchMode">Sign in</button>'
            : 'New to DoubtHub? <button type="button" id="switchMode">Create an account</button>';

        document.getElementById("switchMode").addEventListener(
            "click",
            toggleMode
        );
    }

    message.textContent = "";
    message.className = "message";
}

function toggleMode() {
    if (currentRole === "admin") return;

    currentMode = currentMode === "login" ? "register" : "login";
    authForm.reset();
    updateForm();
}

roles.forEach(function (button) {
    button.addEventListener("click", function () {
        currentRole = button.dataset.role;
        currentMode = "login";
        authForm.reset();
        updateForm();
    });
});

loginTab.addEventListener("click", function () {
    currentMode = "login";
    authForm.reset();
    updateForm();
});

registerTab.addEventListener("click", function () {
    if (currentRole === "admin") return;

    currentMode = "register";
    authForm.reset();
    updateForm();
});

document.getElementById("togglePassword").addEventListener(
    "click",
    function () {
        const isHidden = password.type === "password";
        password.type = isHidden ? "text" : "password";
        this.textContent = isHidden ? "Hide" : "Show";
    }
);

// REGISTRATION AND LOGIN
authForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    message.textContent = "";
    message.className = "message";

    if (currentRole === "admin" && currentMode === "register") {
        message.textContent = "Admin registration is not allowed.";
        message.classList.add("error");
        return;
    }

    if (currentMode === "register") {
        if (password.value.length < 8) {
            message.textContent =
                "Password must contain at least 8 characters.";
            message.classList.add("error");
            return;
        }

        if (password.value !== confirmPassword.value) {
            message.textContent = "Passwords do not match.";
            message.classList.add("error");
            return;
        }
    }

    const formData = {
        role: currentRole,
        userId: userId.value.trim(),
        password: password.value
    };

    if (currentMode === "register") {
        formData.fullName = fullName.value.trim();
        formData.email = email.value.trim();

        if (currentRole === "student") {
            formData.className = className.value.trim();
            formData.section = section.value.trim();
        }

        if (currentRole === "faculty") {
            formData.subjects = subjects.value
                .split(",")
                .map(subject => subject.trim())
                .filter(Boolean);
        }
    }

    const endpoint = currentMode === "register"
        ? "/api/auth/register"
        : "/api/auth/login";

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = "Please wait...";

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Something went wrong.");
        }

        if (currentMode === "register") {
            authForm.reset();
            currentMode = "login";
            updateForm();

            message.textContent = result.message;
            message.classList.add("success");

        } else {
            sessionStorage.setItem(
                "doubthubToken",
                result.token
            );

            sessionStorage.setItem(
                "doubthubUser",
                JSON.stringify(result.user)
            );

            // Redirect according to the selected role.
           // Force users to change their temporary password first.
if (result.user.mustChangePassword === true) {
    window.location.href = "changePassword.html";
}

// Redirect users who have already changed their password.
else if (currentRole === "student") {
    window.location.href = "studentDashboard.html";
} else if (currentRole === "faculty") {
    window.location.href = "facultyDashboard.html";
} else if (currentRole === "admin") {
    window.location.href = "adminDashboard.html";
}
        }

    } catch (error) {
        message.textContent = error.message;
        message.classList.add("error");

    } finally {
        submitBtn.disabled = false;

        submitBtn.innerHTML = currentMode === "register"
            ? 'Create Account <span>→</span>'
            : 'Sign In <span>→</span>';
    }
});

updateForm();
