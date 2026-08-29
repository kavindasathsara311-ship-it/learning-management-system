const signUp = document.getElementById('signUp');
const logInPageForm = document.getElementById('logInPageForm');
const signupForm = document.getElementById('signupForm');

const BackToLogIn = document.getElementById('BackToLogIn');

const studentLogIn = document.getElementById('studentLogIn');
const teacherLogIn = document.getElementById('teacherLogIn');
const adminLogIn = document.getElementById('adminLogIn');

const studentLogInForm = document.getElementById('studentLogInForm');
const teacherLogInForm = document.getElementById('teacherLogInForm');
const adminLogInForm = document.getElementById('adminLogInForm');

// login form inputs and button for student
const LogInStudentusername = document.getElementById('LogInStudentusername');
const LogInStudentpassword = document.getElementById('LogInStudentpassword');
const LogInStudentSubmitButton = document.getElementById('LogInStudentSubmitButton');

// login form inputs and button for teacher
const LogInTeacherusername = document.getElementById('LogInTeacherusername');
const LogInTeacherpassword = document.getElementById('LogInTeacherpassword');
const LogInTeacherSubmitButton = document.getElementById('LogInTeacherSubmitButton');

// login form inputs and button for admin
const LogInAdminusername = document.getElementById('LogInAdminusername');
const LogInAdminpassword = document.getElementById('LogInAdminpassword');
const LogInAdminbutton = document.getElementById('LogInAdminbutton');

// sign up form inputs and button for student
const signUpStudentName = document.getElementById('signUpStudentName');
const signUpStudentRegisterNumber = document.getElementById('signUpStudentRegisterNumber');
const signUpStudentEmail = document.getElementById('signUpStudentEmail');
const signUpStudentPhoneNumber = document.getElementById('signUpStudentPhoneNumber');
const signUpStudentGrade = document.getElementById('signUpStudentGrade');
const signUpStudentPassword = document.getElementById('signUpStudentPassword');
const signUpStudentButton = document.getElementById('signUpStudentButton');

// sign up form inputs and button for teacher
const signUpTeacherName = document.getElementById('signUpTeacherName');
const signUpTeacherRegisterNumber = document.getElementById("signUpTeacherRegisterNumber");
const signUpTeacherEmail = document.getElementById('signUpTeacherEmail');
const signUpTeacherTelePhoneNumber = document.getElementById('signUpTeacherTelePhoneNumber');
const signUpTeacherPassword = document.getElementById('signUpTeacherPassword');
const signUpTeacherSubjectCount = document.getElementById('signUpTeacherSubjectCount');
const dynamicSubjectsContainer = document.getElementById('dynamicSubjectsContainer');
const signUpTeacherButton = document.getElementById('signUpTeacherButton');

// sign up form inputs and button for admin
const adminSignUp = document.getElementById('adminSignUp');
const adminSignUpForm = document.getElementById('adminSignUpForm');
const signUpAdminName = document.getElementById('signUpAdminName');
const signUpAdminRegisterNumber = document.getElementById('signUpAdminRegisterNumber');
const signUpAdminEmail = document.getElementById('signUpAdminEmail');
const signUpAdminPhoneNumber = document.getElementById('signUpAdminPhoneNumber');
const signUpAdminPassword = document.getElementById('signUpAdminPassword');
const signUpAdminButton = document.getElementById('signUpAdminButton');
const LogInAdminSubmitButton = document.getElementById('LogInAdminSubmitButton');

// student and teacher sign up 
const studentSignUp = document.getElementById('studentSignUp');
const teacherSignUp = document.getElementById('teacherSignUp');
const studentSignUpForm = document.getElementById('studentSignUpForm');
const teacherSignUpForm = document.getElementById('teacherSignUpForm');
// welcome student name display
const studentName = document.getElementById('studentName');

// OTP Elements
const otpWrapper = document.getElementById('otpWrapper');
const otpDigits = document.querySelectorAll('.otp-digit');
const verifyOtpButton = document.getElementById('verifyOtpButton');

// Teacher In-Charge Elements
const teacherIsInCharge = document.getElementById('teacherIsInCharge');
const inchargeClassContainer = document.getElementById('inchargeClassContainer');
const teacherInchargeGrade = document.getElementById('teacherInchargeGrade');

// Load Grades & Subjects Catalogs
async function loadSignUpCatalogs() {
    try {
        // 1. Load Grades
        const gradesRes = await fetch('/api/grades');
        const grades = await gradesRes.json();
        const gradeOptions = document.getElementById('gradeOptions');
        if (gradeOptions && Array.isArray(grades)) {
            gradeOptions.innerHTML = grades.map(g => `<option value="${g.grade_id}">${g.grade_name}</option>`).join('');
        }
        if (teacherInchargeGrade && Array.isArray(grades)) {
            teacherInchargeGrade.innerHTML = `<option value="">-- Select In-Charge Class / Grade --</option>` +
                grades.map(g => `<option value="${g.grade_id}">${g.grade_name} (${g.grade_id})</option>`).join('');
        }

        // 2. Load Subjects
        const subjRes = await fetch('/api/available-subjects-catalog');
        const subjData = await subjRes.json();
        const teacherSubjectOptions = document.getElementById('teacherSubjectOptions');
        if (teacherSubjectOptions && subjData.success && Array.isArray(subjData.catalog)) {
            teacherSubjectOptions.innerHTML = subjData.catalog.map(s => 
                `<option value="${s.subject_id}">${s.subject_name} - ${s.grade_name || s.grade_id} (${s.subject_id})</option>`
            ).join('');
        }
    } catch (e) {
        console.error("Error loading signup catalogs:", e);
    }
}
document.addEventListener('DOMContentLoaded', loadSignUpCatalogs);

if (teacherIsInCharge) {
    teacherIsInCharge.addEventListener('change', () => {
        if (inchargeClassContainer) {
            inchargeClassContainer.style.display = teacherIsInCharge.checked ? 'block' : 'none';
        }
    });
}
const resendOtpButton = document.getElementById('resendOtpButton');
const cancelOtp = document.getElementById('cancelOtp');

let currentEmailForOtp = "";

// 6-digit Input Logic
otpDigits.forEach((digit, index) => {
    digit.addEventListener('keydown', (e) => {
        if (e.key >= 0 && e.key <= 9) {
            digit.value = ''; // Clear current val if typing new number
            setTimeout(() => {
                if (index < otpDigits.length - 1) otpDigits[index + 1].focus();
            }, 10);
        } else if (e.key === 'Backspace') {
            setTimeout(() => {
                if (index > 0) otpDigits[index - 1].focus();
            }, 10);
        }
    });

    // Also handle input event for copy-paste or other input methods if needed, 
    // but the keydown is often smoother for "1 digit per box" constraints.
    // Let's add simple input handler to ensure focus moves:
    digit.addEventListener('input', () => {
        if (digit.value.length === 1 && index < otpDigits.length - 1) {
            otpDigits[index + 1].focus();
        }
    });

    // Prevent non-numeric (except control keys handled in keydown)
    digit.addEventListener('keypress', (e) => {
        // Allow numbers
        if (e.which < 48 || e.which > 57) {
            e.preventDefault();
        }
    });
});

studentLogIn.addEventListener('click', () => {
    //alert("Student Login Clicked");
    studentLogInForm.style.display = 'block';
    teacherLogInForm.style.display = 'none';
    adminLogInForm.style.display = 'none';

    studentLogIn.style.borderBottom = '4px solid white';
    teacherLogIn.style.border = 'none';
    adminLogIn.style.border = 'none';
});
teacherLogIn.addEventListener('click', () => {
    //alert("Teacher Login Clicked");
    studentLogInForm.style.display = 'none';
    teacherLogInForm.style.display = 'block';
    adminLogInForm.style.display = 'none';

    studentLogIn.style.borderBottom = 'none';
    teacherLogIn.style.borderBottom = '4px solid white';
    adminLogIn.style.border = 'none';
});
adminLogIn.addEventListener('click', () => {
    //alert("Admin Login Clicked");
    studentLogInForm.style.display = 'none';
    teacherLogInForm.style.display = 'none';
    adminLogInForm.style.display = 'block';

    studentLogIn.style.borderBottom = 'none';
    teacherLogIn.style.border = 'none';
    adminLogIn.style.borderBottom = '4px solid white';
});

signUp.addEventListener('click', () => {
    logInPageForm.style.display = 'none';
    signupForm.style.display = 'flex';
})

BackToLogIn.addEventListener('click', () => {
    logInPageForm.style.display = 'flex';
    signupForm.style.display = 'none';
})
studentSignUp.addEventListener('click', () => {
    studentSignUpForm.style.display = 'block';
    teacherSignUpForm.style.display = 'none';
    if (adminSignUpForm) adminSignUpForm.style.display = 'none';

    studentSignUp.style.borderBottom = '4px solid white';
    teacherSignUp.style.border = 'none';
    if (adminSignUp) adminSignUp.style.border = 'none';
});
teacherSignUp.addEventListener('click', () => {
    teacherSignUpForm.style.display = 'block';
    studentSignUpForm.style.display = 'none';
    if (adminSignUpForm) adminSignUpForm.style.display = 'none';

    studentSignUp.style.borderBottom = 'none';
    teacherSignUp.style.borderBottom = '4px solid white';
    if (adminSignUp) adminSignUp.style.border = 'none';
});
if (adminSignUp) {
    adminSignUp.addEventListener('click', () => {
        studentSignUpForm.style.display = 'none';
        teacherSignUpForm.style.display = 'none';
        if (adminSignUpForm) adminSignUpForm.style.display = 'block';

        studentSignUp.style.borderBottom = 'none';
        teacherSignUp.style.borderBottom = 'none';
        adminSignUp.style.borderBottom = '4px solid white';
    });
}

signUpTeacherSubjectCount.addEventListener('input', () => {
    let count = parseInt(signUpTeacherSubjectCount.value);
    if (isNaN(count) || count < 1) {
        dynamicSubjectsContainer.innerHTML = '';
        return;
    }
    if (count > 20) count = 20;

    dynamicSubjectsContainer.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'dynamic-subject-input';
        input.setAttribute('list', 'teacherSubjectOptions');
        // Applying the same styles as other inputs logically
        input.style.width = '25vw';
        input.style.height = '5vh';
        input.style.display = 'block';
        input.style.border = 'none';
        input.style.background = 'transparent';
        input.style.borderBottom = '2px solid white';
        input.style.marginTop = '2vh';
        input.style.color = 'white';
        input.style.fontSize = '13px';
        input.placeholder = `Select Teaching Subject ${i + 1} (e.g. s1001A)`;
        input.required = true;
        dynamicSubjectsContainer.appendChild(input);
    }
});

signUpStudentButton.addEventListener('click', (e) => {
    e.preventDefault();

    if (!signUpStudentName.value.trim() || !signUpStudentName.value.trim().match(/^[A-Za-z]{2,20} [A-Za-z]{2,20}$/)) {
        alert("Please enter a valid username.");
        signUpStudentName.focus();
        return;
    }
    if (!signUpStudentRegisterNumber.value.trim() || isNaN(signUpStudentRegisterNumber.value.trim())) {
        alert("Please enter a valid user Register number.");
        signUpStudentRegisterNumber.focus();
        return;
    }
    if (!signUpStudentEmail.value.trim() || !signUpStudentEmail.value.trim().match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
        alert("Please enter a valid email address.");
        signUpStudentEmail.focus();
        return;
    }
    if (!signUpStudentPhoneNumber.value.trim() || !signUpStudentPhoneNumber.value.trim().match(/^[0-9]{10}$/)) {
        alert("Please enter a valid phone number.");
        signUpStudentPhoneNumber.focus();
        return;
    }
    if (!signUpStudentGrade.value.trim()) {
        alert("Please enter a valid grade between 1 and 12.");
        signUpStudentGrade.focus();
        return;
    }
    if (!signUpStudentPassword.value.trim()) {
        alert("Please enter a valid password.")
        signUpStudentPassword.focus();
        return;
    }

    addStudent();

})

signUpTeacherButton.addEventListener('click', (e) => {
    e.preventDefault();

    if (!signUpTeacherName.value.trim()) {
        alert("Please enter a valid teacher name.");
        signUpTeacherName.focus();
        return;
    }
    if (!signUpTeacherRegisterNumber.value.trim() || isNaN(signUpTeacherRegisterNumber.value.trim()) || signUpTeacherRegisterNumber.value.length > 8) {
        alert("Please enter a valid teacher register number (up to 8 digits).");
        signUpTeacherRegisterNumber.focus();
        return;
    }
    if (!signUpTeacherEmail.value.trim() || !signUpTeacherEmail.value.trim().match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/) || signUpTeacherEmail.value.length > 30) {
        alert("Please enter a valid email address (up to 30 characters).");
        signUpTeacherEmail.focus();
        return;
    }
    if (!signUpTeacherTelePhoneNumber.value.trim() || !signUpTeacherTelePhoneNumber.value.trim().match(/^[0-9]{10}$/)) {
        alert("Please enter a valid 10-digit phone number.");
        signUpTeacherTelePhoneNumber.focus();
        return;
    }
    const count = parseInt(signUpTeacherSubjectCount.value);
    if (!count || count < 1) {
        alert("Please enter a valid count for teaching subjects.");
        signUpTeacherSubjectCount.focus();
        return;
    }
    const subjectInputs = dynamicSubjectsContainer.querySelectorAll('.dynamic-subject-input');
    if (subjectInputs.length === 0) return;
    
    for (let i = 0; i < subjectInputs.length; i++) {
        const val = subjectInputs[i].value.trim();
        if (!val) {
            alert(`Please enter a valid teaching subject for input #${i+1}.`);
            subjectInputs[i].focus();
            return;
        }
    }
    if (!signUpTeacherPassword.value.trim()) {
        alert("Please enter a valid password.");
        signUpTeacherPassword.focus();
        return;
    }

    addTeacher();
});

// ***** Function to add student and teacher (Backend API calls) **************#######

// ***** Function to add student and teacher (Backend API calls) **************#######

function addStudent() {
    const userData = {
        name: document.getElementById("signUpStudentName").value,
        id: document.getElementById("signUpStudentRegisterNumber").value,
        email: document.getElementById("signUpStudentEmail").value,
        phone: document.getElementById("signUpStudentPhoneNumber").value,
        address: document.getElementById("signUpStudentAddress").value,
        password: document.getElementById("signUpStudentPassword").value,
        grade_id: document.getElementById("signUpStudentGrade").value,
        role: 'student'
    };

    initiateRegistration(userData);
}


function addTeacher() {
    const subjectInputs = dynamicSubjectsContainer.querySelectorAll('.dynamic-subject-input');
    const teachingSubjectsArray = Array.from(subjectInputs).map(inp => inp.value.trim());

    const userData = {
        name: signUpTeacherName.value,
        id: signUpTeacherRegisterNumber.value,
        email: signUpTeacherEmail.value,
        phone: signUpTeacherTelePhoneNumber.value,
        password: signUpTeacherPassword.value,
        teachingSubjects: teachingSubjectsArray,
        role: 'teacher'
    };
    initiateRegistration(userData);
}

function initiateRegistration(data) {
    fetch("/register-init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
        .then(async res => {
            const text = await res.text();
            if (res.ok) {
                alert(text);
                currentEmailForOtp = data.email;

                // Reset inputs
                otpDigits.forEach(input => input.value = '');

                otpWrapper.style.display = 'block';
                signupForm.style.display = 'none';

                // Focus first digit
                otpDigits[0].focus();

            } else {
                alert("Error: " + text);
            }
        })
        .catch(err => console.error(err));
}

// OTP Logic inside the file end or here
verifyOtpButton.addEventListener('click', () => {
    let otp = "";
    otpDigits.forEach(digit => otp += digit.value);

    if (otp.length < 6) return alert("Please enter complete 6-digit OTP");

    fetch("/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentEmailForOtp, otp })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                localStorage.setItem("token", data.token);

                // Direct to appropriate dashboard
                if (data.message.toLowerCase().includes("student")) {
                    window.location.href = "Student_Dashboard.html";
                } else if (data.message.toLowerCase().includes("teacher")) {
                    window.location.href = "Teacher_Dashboard.html";
                } else {
                    window.location.href = "LoginPage.html";
                }
            } else {
                alert(data.message || "Verification failed");
            }
        })
        .catch(err => {
            console.error(err);
            alert("Error verifying OTP");
        });
});

resendOtpButton.addEventListener('click', () => {
    fetch("/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentEmailForOtp })
    }).then(async res => {
        alert(await res.text());
    }).catch(err => console.error(err));
});

signUpStudentButton.addEventListener('click', (e) => {
    e.preventDefault();

    if (!signUpStudentName.value.trim() || !signUpStudentName.value.trim().match(/^[A-Za-z]{2,20} [A-Za-z]{2,20}$/)) {
        alert("Please enter a valid username.");
        signUpStudentName.focus();
        return;
    }
    if (!signUpStudentRegisterNumber.value.trim() || isNaN(signUpStudentRegisterNumber.value.trim())) {
        alert("Please enter a valid user Register number.");
        signUpStudentRegisterNumber.focus();
        return;
    }
    if (!signUpStudentEmail.value.trim() || !signUpStudentEmail.value.trim().match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
        alert("Please enter a valid email address.");
        signUpStudentEmail.focus();
        return;
    }
    if (!signUpStudentPhoneNumber.value.trim() || !signUpStudentPhoneNumber.value.trim().match(/^[0-9]{10}$/)) {
        alert("Please enter a valid phone number.");
        signUpStudentPhoneNumber.focus();
        return;
    }
    if (!signUpStudentGrade.value.trim()) {
        alert("Please enter a valid grade between 1 and 12.");
        signUpStudentGrade.focus();
        return;
    }
    if (!signUpStudentPassword.value.trim()) {
        alert("Please enter a valid password.")
        signUpStudentPassword.focus();
        return;
    }

    addStudent();
});

signUpTeacherButton.addEventListener('click', (e) => {
    e.preventDefault();

    if (!signUpTeacherName.value.trim()) {
        alert("Please enter a valid teacher name.");
        signUpTeacherName.focus();
        return;
    }
    if (!signUpTeacherRegisterNumber.value.trim() || isNaN(signUpTeacherRegisterNumber.value.trim()) || signUpTeacherRegisterNumber.value.length > 8) {
        alert("Please enter a valid teacher register number (up to 8 digits).");
        signUpTeacherRegisterNumber.focus();
        return;
    }
    if (!signUpTeacherEmail.value.trim() || !signUpTeacherEmail.value.trim().match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/) || signUpTeacherEmail.value.length > 30) {
        alert("Please enter a valid email address (up to 30 characters).");
        signUpTeacherEmail.focus();
        return;
    }
    if (!signUpTeacherTelePhoneNumber.value.trim() || !signUpTeacherTelePhoneNumber.value.trim().match(/^[0-9]{10}$/)) {
        alert("Please enter a valid 10-digit phone number.");
        signUpTeacherTelePhoneNumber.focus();
        return;
    }
    const count = parseInt(signUpTeacherSubjectCount.value);
    if (!count || count < 1) {
        alert("Please enter a valid count for teaching subjects.");
        signUpTeacherSubjectCount.focus();
        return;
    }
    const subjectInputs = dynamicSubjectsContainer.querySelectorAll('.dynamic-subject-input');
    if (subjectInputs.length === 0) return;
    
    for (let i = 0; i < subjectInputs.length; i++) {
        const val = subjectInputs[i].value.trim();
        if (!val) {
            alert(`Please enter a valid teaching subject for input #${i+1}.`);
            subjectInputs[i].focus();
            return;
        }
    }
    if (!signUpTeacherPassword.value.trim()) {
        alert("Please enter a valid password.");
        signUpTeacherPassword.focus();
        return;
    }

    if (teacherIsInCharge && teacherIsInCharge.checked) {
        if (!teacherInchargeGrade.value) {
            alert("Please select the class / grade you are in charge of.");
            teacherInchargeGrade.focus();
            return;
        }
    }

    addTeacher();
});

if (signUpAdminButton) {
    signUpAdminButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (!signUpAdminName.value.trim()) {
            alert("Please enter Admin full name.");
            signUpAdminName.focus();
            return;
        }
        if (!signUpAdminEmail.value.trim() || !signUpAdminEmail.value.trim().match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
            alert("Please enter a valid official email address.");
            signUpAdminEmail.focus();
            return;
        }
        if (!signUpAdminPassword.value.trim() || signUpAdminPassword.value.length < 6) {
            alert("Please enter a valid password (at least 6 characters).");
            signUpAdminPassword.focus();
            return;
        }
        addAdmin();
    });
}

function addAdmin() {
    const userData = {
        name: signUpAdminName.value.trim(),
        id: signUpAdminRegisterNumber.value.trim() || "ADM" + Math.floor(100 + Math.random() * 900),
        email: signUpAdminEmail.value.trim(),
        phone: signUpAdminPhoneNumber.value.trim() || "",
        password: signUpAdminPassword.value,
        role: 'admin'
    };
    initiateRegistration(userData);
}

// ***** Function to add student and teacher (Backend API calls) **************#######

function addStudent() {
    const userData = {
        name: document.getElementById("signUpStudentName").value,
        id: document.getElementById("signUpStudentRegisterNumber").value,
        email: document.getElementById("signUpStudentEmail").value,
        phone: document.getElementById("signUpStudentPhoneNumber").value,
        address: document.getElementById("signUpStudentAddress").value,
        password: document.getElementById("signUpStudentPassword").value,
        grade_id: document.getElementById("signUpStudentGrade").value,
        role: 'student'
    };

    initiateRegistration(userData);
}

function addTeacher() {
    const subjectInputs = dynamicSubjectsContainer.querySelectorAll('.dynamic-subject-input');
    const teachingSubjectsArray = Array.from(subjectInputs).map(inp => inp.value.trim());

    const isChecked = teacherIsInCharge ? teacherIsInCharge.checked : false;
    const inchargeGradeVal = isChecked && teacherInchargeGrade ? teacherInchargeGrade.value : null;

    const userData = {
        name: signUpTeacherName.value,
        id: signUpTeacherRegisterNumber.value,
        email: signUpTeacherEmail.value,
        phone: signUpTeacherTelePhoneNumber.value,
        password: signUpTeacherPassword.value,
        teachingSubjects: teachingSubjectsArray,
        is_incharge: isChecked,
        incharge_grade_id: inchargeGradeVal,
        role: 'teacher'
    };
    initiateRegistration(userData);
}

function initiateRegistration(data) {
    fetch("/register-init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
        .then(async res => {
            const text = await res.text();
            if (res.ok) {
                alert(text);
                currentEmailForOtp = data.email;

                // Reset inputs
                otpDigits.forEach(input => input.value = '');

                otpWrapper.style.display = 'block';
                signupForm.style.display = 'none';

                // Focus first digit
                otpDigits[0].focus();

            } else {
                alert("Error: " + text);
            }
        })
        .catch(err => console.error(err));
}

// OTP Logic inside the file end or here
verifyOtpButton.addEventListener('click', () => {
    let otp = "";
    otpDigits.forEach(digit => otp += digit.value);

    if (otp.length < 6) return alert("Please enter complete 6-digit OTP");

    fetch("/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentEmailForOtp, otp })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                localStorage.setItem("token", data.token);

                // Direct to appropriate dashboard
                if (data.message.toLowerCase().includes("student")) {
                    window.location.href = "Student_Dashboard.html";
                } else if (data.message.toLowerCase().includes("teacher")) {
                    window.location.href = "Teacher_Dashboard.html";
                } else if (data.message.toLowerCase().includes("admin")) {
                    window.location.href = "Admin_Dashboard.html";
                } else {
                    window.location.href = "LoginPage.html";
                }
            } else {
                alert(data.message || "Verification failed");
            }
        })
        .catch(err => {
            console.error(err);
            alert("Error verifying OTP");
        });
});

resendOtpButton.addEventListener('click', () => {
    fetch("/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentEmailForOtp })
    }).then(async res => {
        alert(await res.text());
    }).catch(err => console.error(err));
});

cancelOtp.addEventListener('click', () => {
    otpWrapper.style.display = 'none';
    signupForm.style.display = 'flex'; // Show the signup form again
});

LogInStudentSubmitButton.addEventListener('click', (e) => {
    e.preventDefault();

    fetch("/student-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: LogInStudentusername.value,
            password: LogInStudentpassword.value
        })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                localStorage.setItem('token', data.token);
                window.location.href = "Student_Dashboard.html";
            } else {
                alert(data.message || "Invalid credentials");
            }
        })
        .catch(err => {
            console.error(err);
            alert("Student login failed");
        });
});

LogInTeacherSubmitButton.addEventListener('click', (e) => {
    e.preventDefault();
    fetch("/teacher-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: LogInTeacherusername.value,
            password: LogInTeacherpassword.value
        })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                localStorage.setItem('token', data.token);
                window.location.href = "Teacher_Dashboard.html";
            } else {
                alert(data.message || "Invalid credentials");
            }
        })
        .catch(err => {
            console.error(err);
            alert("Teacher login failed");
        });
});

if (LogInAdminSubmitButton) {
    LogInAdminSubmitButton.addEventListener('click', (e) => {
        e.preventDefault();
        fetch("/admin-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: LogInAdminusername.value,
                password: LogInAdminpassword.value
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    localStorage.setItem('token', data.token);
                    window.location.href = "Admin_Dashboard.html";
                } else {
                    alert(data.message || "Invalid credentials");
                }
            })
            .catch(err => {
                console.error(err);
                alert("Admin login failed");
            });
    });
}

// Load available grade options from server
fetch("/api/grades")
    .then(res => res.json())
    .then(grades => {
        const datalist = document.getElementById("gradeOptions");
        if (datalist && Array.isArray(grades)) {
            datalist.innerHTML = grades.map(g => `<option value="${g.grade_id}">${g.grade_name}</option>`).join("");
        }
    })
    .catch(err => console.error("Could not load grade list:", err));
