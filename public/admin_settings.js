// admin_settings.js - System Settings Controller

document.addEventListener("DOMContentLoaded", () => {
    renderSidebar("system_settings", "admin");
    loadSystemSettings();
});

async function loadSystemSettings() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch("/api/admin/settings", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        if (!data.success || !data.settings) return;

        const s = data.settings;
        if (s.school_name) document.getElementById("settingSchoolName").value = s.school_name;
        if (s.academic_year) document.getElementById("settingAcademicYear").value = s.academic_year;
        if (s.current_term) document.getElementById("settingCurrentTerm").value = s.current_term;
        if (s.term_start_date) document.getElementById("settingTermStartDate").value = s.term_start_date;
        if (s.term_end_date) document.getElementById("settingTermEndDate").value = s.term_end_date;
        if (s.school_email) document.getElementById("settingSchoolEmail").value = s.school_email;
        if (s.school_phone) document.getElementById("settingSchoolPhone").value = s.school_phone;
        if (s.school_address) document.getElementById("settingSchoolAddress").value = s.school_address;

    } catch (err) {
        console.error("Error loading system settings:", err);
    }
}

async function handleSaveSettings(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    const settingsObj = {
        school_name: document.getElementById("settingSchoolName").value.trim(),
        academic_year: document.getElementById("settingAcademicYear").value.trim(),
        current_term: document.getElementById("settingCurrentTerm").value.trim(),
        term_start_date: document.getElementById("settingTermStartDate").value,
        term_end_date: document.getElementById("settingTermEndDate").value,
        school_email: document.getElementById("settingSchoolEmail").value.trim(),
        school_phone: document.getElementById("settingSchoolPhone").value.trim(),
        school_address: document.getElementById("settingSchoolAddress").value.trim()
    };

    try {
        const response = await fetch("/api/admin/settings", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ settings: settingsObj })
        });
        const data = await response.json();
        alert(data.message || "Settings updated successfully");
    } catch (err) {
        console.error("Error saving system settings:", err);
        alert("Failed to save settings.");
    }
}
