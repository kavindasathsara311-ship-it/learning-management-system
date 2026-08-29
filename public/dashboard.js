const API_BASE = "http://localhost:3000";

function getTokenPayload() {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Error decoding token:", e);
        return null;
    }
}

function renderSidebar(activePage, role) {
    const sidebarTarget = document.getElementById("sidebar") || document.querySelector(".topNavBar");
    if (!sidebarTarget) return;

    const payload = getTokenPayload();
    const effectiveRole = role || (payload ? payload.role : "student");

    if (!activePage) {
        const path = window.location.pathname.toLowerCase();
        if (path.includes("student_dashboard.html") || path.includes("teacher_dashboard.html") || path.includes("admin_dashboard.html")) activePage = "dashboard";
        else if (path.includes("admin_students.html")) activePage = "students";
        else if (path.includes("admin_teachers.html")) activePage = "teachers";
        else if (path.includes("admin_subjects.html")) activePage = "subjects";
        else if (path.includes("admin_reports.html")) activePage = "reports";
        else if (path.includes("admin_settings.html")) activePage = "system_settings";
        else if (path.includes("student_subject.html") || path.includes("teacher_class.html")) activePage = effectiveRole === "teacher" ? "classes" : "subjects";
        else if (path.includes("student_assignments.html") || path.includes("teacher_assignment.html")) activePage = "assignments";
        else if (path.includes("student_exam_results.html")) activePage = "results";
        else if (path.includes("student_exam.html") || path.includes("teacher_exam.html")) activePage = "exams";
        else if (path.includes("student_timetable.html") || path.includes("teacher_timetable.html")) activePage = "timetable";
        else if (path.includes("student_attendence.html") || path.includes("teacher_attendence.html")) activePage = "attendance";
        else if (path.includes("student_notification.html") || path.includes("teacher_notification.html")) activePage = "notifications";
        else if (path.includes("student_contact_instructor.html")) activePage = "instructors";
        else if (path.includes("settings.html")) activePage = "settings";
        else if (path.includes("profile.html")) activePage = "profile";
    }

    let mainNavLinks = [];
    if (effectiveRole === "admin") {
        mainNavLinks = [
            { id: "dashboard", text: "Dashboard", href: "Admin_Dashboard.html", icon: "fa-chart-line" },
            { id: "students", text: "Students", href: "admin_students.html", icon: "fa-user-graduate" },
            { id: "teachers", text: "Teachers", href: "admin_teachers.html", icon: "fa-chalkboard-teacher" },
            { id: "subjects", text: "Subjects / Classes", href: "admin_subjects.html", icon: "fa-book-open" },
            { id: "reports", text: "Reports & Analytics", href: "admin_reports.html", icon: "fa-chart-pie" },
            { id: "system_settings", text: "System Settings", href: "admin_settings.html", icon: "fa-sliders" }
        ];
    } else if (effectiveRole === "teacher") {
        mainNavLinks = [
            { id: "dashboard", text: "Dashboard", href: "Teacher_Dashboard.html", icon: "fa-newspaper" },
            { id: "classes", text: "Classes", href: "teacher_Class.html", icon: "fa-chalkboard-user" },
            { id: "exams", text: "Exams", href: "teacher_Exam.html", icon: "fa-calendar" },
            { id: "assignments", text: "Assignments", href: "teacher_Assignment.html", icon: "fa-tasks" },
            { id: "timetable", text: "TimeTable", href: "teacher_Timetable.html", icon: "fa-clock" },
            { id: "attendance", text: "Attendance", href: "teacher_attendence.html", icon: "fa-calendar-check" },
            { id: "notifications", text: "Notifications", href: "teacher_Notification.html", icon: "fa-bell" }
        ];
    } else {
        mainNavLinks = [
            { id: "dashboard", text: "Dashboard", href: "Student_Dashboard.html", icon: "fa-newspaper" },
            { id: "subjects", text: "Subjects", href: "student_subject.html", icon: "fa-book" },
            { id: "assignments", text: "Assignments", href: "student_assignments.html", icon: "fa-tasks" },
            { id: "exams", text: "Exams", href: "student_exam.html", icon: "fa-calendar" },
            { id: "results", text: "Results", href: "student_exam_results.html", icon: "fa-square-poll-vertical" },
            { id: "timetable", text: "TimeTable", href: "student_timetable.html", icon: "fa-clock" },
            { id: "attendance", text: "Attendance", href: "student_Attendence.html", icon: "fa-calendar-check" },
            { id: "notifications", text: "Notifications", href: "student_notification.html", icon: "fa-bell" },
            { id: "instructors", text: "Instructors", href: "student_contact_instructor.html", icon: "fa-address-book" }
        ];
    }

    const footerNavLinks = [
        { id: "settings", text: "Account Settings", href: "settings.html", icon: "fa-cog" },
        { id: "profile", text: "Profile", href: "profile.html", icon: "fa-user" }
    ];

    const mainNavHtml = mainNavLinks.map(l => {
        const isActive = activePage === l.id;
        return `<a class="navLink middleLinks ${isActive ? 'active' : ''}" data-page="${l.id}" href="${l.href}"><i class="fa ${l.icon}"></i><span>${l.text}</span></a>`;
    }).join("");

    const footerNavHtml = footerNavLinks.map(l => {
        const isActive = activePage === l.id;
        return `<a class="navLink footerNavLink ${isActive ? 'active' : ''}" data-page="${l.id}" href="${l.href}"><i class="fa ${l.icon}"></i><span>${l.text}</span></a>`;
    }).join("") + `
        <a class="navLink logOutButton footerNavLink" data-page="logout" style="cursor: pointer;"><i class="fa fa-sign-out"></i><span>Log Out</span></a>
    `;

    const portalTitle = effectiveRole === "admin" ? "Admin Portal" : (effectiveRole === "teacher" ? "Teacher Portal" : "School Name");

    const fullSidebarHtml = `
        <nav class="topNavBar DashboardPart" id="topNavBar">
            <h1 class="dashboardMainText">${portalTitle}</h1>
            <div class="navBarMiddle">
                ${mainNavHtml}
            </div>
            <div class="NavBarFooter">
                ${footerNavHtml}
            </div>
        </nav>
    `;

    if (sidebarTarget.id === "sidebar") {
        sidebarTarget.innerHTML = fullSidebarHtml;
    } else {
        sidebarTarget.outerHTML = fullSidebarHtml;
    }

    // Attach Logout handler
    const logOutButtons = document.querySelectorAll(".logOutButton");
    logOutButtons.forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            localStorage.removeItem("token");
            window.location.href = "LoginPage.html";
        };
    });
}

function renderNavbar(activePage, role) {
    renderSidebar(activePage, role);
}

const timeIcon = document.getElementById("timeIcon");
const dashboardContainer = document.getElementById("dashboardContainer");
const topNavBar = document.getElementById("topNavBar");
const body = document.getElementById("body");

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const payload = getTokenPayload();

    if (!payload && !window.location.pathname.includes("LoginPage.html")) {
        window.location.href = "LoginPage.html";
        return;
    }

    if (payload) {
        // Auto render navbar if not already triggered by individual page script
        if (window.location.pathname.includes("profile.html")) renderNavbar("profile");
        else if (window.location.pathname.includes("settings.html")) renderNavbar("settings");
        else renderNavbar();

        // Display name based on the page
        const studentNameSpan = document.getElementById("studentName");
        const teacherNameSpan = document.getElementById("teacherName");

        if (studentNameSpan && payload.role === "student") {
            studentNameSpan.textContent = payload.name;
        } else if (teacherNameSpan && payload.role === "teacher") {
            teacherNameSpan.textContent = payload.name;
        }

        if (payload.role === "teacher") {
            const navMiddle = document.querySelector(".navBarMiddle");
            if (navMiddle && (window.location.pathname.includes("profile.html") || window.location.pathname.includes("settings.html"))) {
                navMiddle.innerHTML = `
                    <a class="navLink middleLinks" href="Teacher_Dashboard.html"><i class="fas fa-chalkboard-teacher"></i>Dashboard</a>
                    <a class="navLink middleLinks" href="teacher_Class.html"><i class="fas fa-chalkboard-teacher"></i>Classes</a>
                    <a class="navLink middleLinks" href="teacher_Exam.html"><i class="fas fa-file-alt"></i>Exams</a>
                    <a class="navLink middleLinks" href="teacher_Timetable.html"><i class="fas fa-calendar-alt"></i>TimeTable</a>
                    <a class="navLink middleLinks" href="teacher_attendence.html"><i class="fas fa-user-check"></i>Attendance</a>
                    <a class="navLink middleLinks" href="teacher_Assignment.html"><i class="fas fa-tasks"></i>Assignments</a>
                    <a class="navLink middleLinks" href="teacher_Notification.html"><i class="fas fa-bell"></i>Notifications</a>
                `;
            }
        } else if (payload.role === "admin") {
            const navMiddle = document.querySelector(".navBarMiddle");
            if (navMiddle && (window.location.pathname.includes("profile.html") || window.location.pathname.includes("settings.html"))) {
                navMiddle.innerHTML = `
                    <a class="navLink middleLinks" href="Admin_Dashboard.html"><i class="fas fa-chart-line"></i>Dashboard</a>
                `;
            }
        }

        // Handle Log Out
        const logOutButtons = document.querySelectorAll(".logOutButton");
        logOutButtons.forEach(link => {
            link.addEventListener("click", () => {
                localStorage.removeItem("token");
                window.location.href = "LoginPage.html";
            });
            link.style.cursor = "pointer";
        });

        // Handle Profile and Settings navigation globally
        document.querySelectorAll("a").forEach(link => {
            const text = link.textContent.trim().toLowerCase();
            if (text.includes("profile")) {
                link.style.cursor = "pointer";
                link.addEventListener("click", (e) => {
                    e.preventDefault();
                    window.location.href = "profile.html";
                });
            } else if (text.includes("settings")) {
                link.style.cursor = "pointer";
                link.addEventListener("click", (e) => {
                    e.preventDefault();
                    window.location.href = "settings.html";
                });
            }
        });
    }
});

const currentHours = new Date().getHours();
const greetingElement = document.getElementById("greeting");
const teacherGreetingElement = document.getElementById("teacherGreeting");

if (greetingElement) {
    let greetingText = "Hello";
    if (currentHours < 12) {
        greetingText = "Good Morning";
        timeIcon.classList.remove("fa-moon");
        timeIcon.classList.add("fa-sun");
        timeIcon.classList.remove("fa-cloud-moon");
        timeIcon.style.color = "gold";

    } else if (currentHours < 15) {
        greetingText = "Good Afternoon";
        timeIcon.classList.remove("fa-moon");
        timeIcon.classList.add("fa-sun");
        timeIcon.classList.remove("fa-cloud-moon");
        timeIcon.style.color = "orange";
        
    } else if (currentHours >= 15) {
        greetingText = "Good Evening";
        timeIcon.classList.remove("fa-sun");
        timeIcon.classList.remove("fa-moon");
        timeIcon.classList.add("fa-cloud-moon");
        timeIcon.style.color = "rgb(252, 223, 6)";

    }
    greetingElement.textContent = greetingText;
} else if (teacherGreetingElement) {
    let greetingText = "Hello";   
    if (currentHours < 12) {
        greetingText = "Good Morning";
        timeIcon.classList.remove("fa-moon");
        timeIcon.classList.add("fa-sun");
        timeIcon.classList.remove("fa-cloud-moon");
        timeIcon.style.color = "gold";
        
    } else if (currentHours < 18) {
        greetingText = "Good Afternoon";
        timeIcon.classList.remove("fa-moon");
        timeIcon.classList.add("fa-sun");
        timeIcon.classList.remove("fa-cloud-moon");
        timeIcon.style.color = "orange";
    } else if (currentHours >= 18) {
        greetingText = "Good Evening";
        timeIcon.classList.remove("fa-sun");
        timeIcon.classList.remove("fa-moon");
        timeIcon.classList.add("fa-cloud-moon");
        timeIcon.style.color = "yellow";
        
    }
    teacherGreetingElement.textContent = greetingText;
}

function renderCard(container, title, value, iconClass, onClickUrl) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) return;
    const card = document.createElement("div");
    card.className = "card";
    if (onClickUrl) {
        card.onclick = () => window.location.href = onClickUrl;
    }
    card.innerHTML = `
        <h4 class="cardTitle"><i class="fa ${iconClass || 'fa-info-circle'}"></i> ${title}</h4>
        <div class="cardValue">${value}</div>
    `;
    target.appendChild(card);
}
