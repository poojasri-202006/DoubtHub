
// Get the login token
const token = sessionStorage.getItem("doubthubToken");

// Get the analytics elements
const todayCount = document.getElementById("todayCount");
const unansweredCount = document.getElementById("unansweredCount");
const weekCount = document.getElementById("weekCount");
const subjectAnalytics = document.getElementById("subjectAnalytics");
const attentionList = document.getElementById("attentionList");

// Convert user-generated text into safe HTML
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (char) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[char];
    });
}

// Check whether a date belongs to today
function isToday(dateValue) {
    const date = new Date(dateValue);
    const today = new Date();

    return date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate();
}

// Check whether a date belongs to the current week (Monday to Sunday)
function isThisWeek(dateValue) {
    const date = new Date(dateValue);
    const today = new Date();

    const startOfWeek = new Date(today);
    const day = (today.getDay() + 6) % 7;

    startOfWeek.setDate(today.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);

    return date >= startOfWeek && date <= today;
}

// Load faculty analytics
async function loadFacultyAnalytics() {
    try {
        if (!token) {
            throw new Error("Please sign in again.");
        }

        const response = await fetch("/api/doubts", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const doubts = await response.json();

        if (!response.ok) {
            throw new Error(doubts.message || "Unable to load doubts.");
        }

        // Calculate the main statistics
        const todayDoubts = doubts.filter(d => isToday(d.createdAt));
        const unanswered = doubts.filter(d => !d.answers || d.answers.length === 0);
        const weekDoubts = doubts.filter(d => isThisWeek(d.createdAt));

        todayCount.textContent = todayDoubts.length;
        unansweredCount.textContent = unanswered.length;
        weekCount.textContent = weekDoubts.length;

        // Calculate subject-wise doubt counts
        const subjectCounts = {};

        doubts.forEach(doubt => {
            const subject = doubt.course || "Other";
            subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
        });

        const subjects = Object.entries(subjectCounts)
            .sort((a, b) => b[1] - a[1]);

        if (subjects.length === 0) {
            subjectAnalytics.innerHTML =
                '<div class="card">No subject data available yet.</div>';
        } else {
            subjectAnalytics.innerHTML = subjects.map(([subject, count]) => `
                <div class="card">
                    <span class="badge">${escapeHTML(subject)}</span>
                    <div class="stat-number">${count}</div>
                    <p>Doubts raised in this subject.</p>
                </div>
            `).join("");
        }

        // Display up to three unanswered questions
        const pendingDoubts = unanswered.slice(0, 3);

        if (pendingDoubts.length === 0) {
            attentionList.innerHTML = `
                <div class="card">
                    <p>No unanswered questions. Great work!</p>
                </div>
            `;
        } else {
            attentionList.innerHTML = pendingDoubts.map(doubt => `
                <div class="card">
                    <span class="badge">${escapeHTML(doubt.course)}</span>
                    <h3>${escapeHTML(doubt.title)}</h3>
                    <p>
                        Course code: ${escapeHTML(doubt.courseCode)}
                        · No answers yet
                    </p>
                    <a href="facultyDoubts.html" class="btn btn-gold">
                        View class doubts →
                    </a>
                </div>
            `).join("");
        }

    } catch (error) {
        console.error("Faculty analytics error:", error);

        todayCount.textContent = "--";
        unansweredCount.textContent = "--";
        weekCount.textContent = "--";

        subjectAnalytics.textContent = "Unable to load subject analytics.";
        attentionList.textContent = error.message;
    }
}

// Run the function
loadFacultyAnalytics();
