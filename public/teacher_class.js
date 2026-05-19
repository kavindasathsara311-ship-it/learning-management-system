const classCardContainer = document.getElementById('classCardContainer');   
const viewClassesCard = document.getElementById('viewClasses');
const createClassCard = document.getElementById('createClass');
const manageClassCard = document.getElementById('manageClass');

manageClassCard?.addEventListener('click', async () => {

    viewClassesCard.style.display = "none";
    createClassCard.style.display = "none";
    manageClassCard.style.display = "none";
    try{
        const token = localStorage.getItem("token");
        if (!token) {
            alert("No token found. Please login again.");
            window.location.href = "LoginPage.html";
            return;
        }
        const response = await fetch("http://localhost:3000/api/view-classes", { 
            method: "POST", // Must match your app.post in backend
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            if (response.status === 403) alert("Access Denied: Teachers only.");
            throw new Error("Failed to fetch classes");
        }
        const data = await response.json();

        data.classes.forEach(cls => {
            const div = document.createElement("div");
            div.className = "class_card";

            const h3 = document.createElement("h3");
            h3.className = "class-name";
            h3.textContent = cls.subject_name;
            const h2 = document.createElement("h2");
            h2.className = "class-info";
            h2.textContent = cls.grade_name;

            div.appendChild(h3);
            div.appendChild(h2);

            classCardContainer.appendChild(div);
            div.addEventListener('click', () => {
                alert("This feature is under development. Please check back later."+cls.subject_name+cls.grade_name);
                classCardContainer.innerHTML = "";
                const teacherSelectedClass = document.createElement("div");
                teacherSelectedClass.className = "teacherSelectedClass"; 
                const teacherClassHeader = document.createElement("h2");
                teacherClassHeader.className = "teacherClassHeader";
                teacherClassHeader.textContent = `Class: ${cls.subject_name} - ${cls.grade_name}`;

                const teacherClassContent = document.createElement("div");
                teacherClassContent.className = "teacherClassContent";

                const addLessonMetirials = document.createElement("button");
                addLessonMetirials.className = "addLessonMetirials";
                addLessonMetirials.textContent = "Add Lesson Materials";

                const addAssignmentButton = document.createElement("button");
                addAssignmentButton.className = "addAssignmentButton";
                addAssignmentButton.textContent = "Add Assignment";

                const addSubmitionLinkButton = document.createElement("button");    
                addSubmitionLinkButton.className = "addSubmitionLinkButton";
                addSubmitionLinkButton.textContent = "Add Submition Link";

                function renderMenu() {
                    teacherClassContent.innerHTML = "";
                    teacherClassContent.appendChild(addLessonMetirials);
                    teacherClassContent.appendChild(addAssignmentButton);
                    teacherClassContent.appendChild(addSubmitionLinkButton);
                    
                }

                addLessonMetirials.addEventListener('click', () => {
                    teacherClassContent.innerHTML = "";

                    const lessonMaterialHeader = document.createElement("h3");
                    lessonMaterialHeader.className = "lessonMaterialHeader";
                    lessonMaterialHeader.textContent = "Upload Lesson Materials";
                    teacherClassContent.appendChild(lessonMaterialHeader);

                    const lessonNameInput = document.createElement("input");
                    lessonNameInput.className = "fileNameInput";
                    lessonNameInput.type = "text";
                    lessonNameInput.placeholder = "Enter lesson name";
                    teacherClassContent.appendChild(lessonNameInput);

                    const fileNameInput = document.createElement("input");
                    fileNameInput.className = "fileNameInput";
                    fileNameInput.type = "text";
                    fileNameInput.placeholder = "Enter file name";
                    teacherClassContent.appendChild(fileNameInput);

                    const fileInput = document.createElement("input");
                    fileInput.className = "fileInput";
                    fileInput.type = "file";
                    fileInput.accept = ".pdf,.doc,.docx,.ppt,.pptx";
                    teacherClassContent.appendChild(fileInput);

                    const uploadButton = document.createElement("button");
                    uploadButton.className = "uploadLessonButton";
                    uploadButton.textContent = "Upload";
                    teacherClassContent.appendChild(uploadButton);

                    const backButton = document.createElement("button");
                    backButton.className = "cancelLessonButton";
                    backButton.textContent = "Back";
                    teacherClassContent.appendChild(backButton);

                    backButton.addEventListener('click', () => {
                        renderMenu();
                    });

                    uploadButton.addEventListener('click', async () => {
                        const lessonName = lessonNameInput.value.trim();
                        const file = fileInput.files[0];
                        const fileName = fileNameInput.value.trim();

                        if (!file) return alert("Please select a file");

                        const formData = new FormData();
                        formData.append("lesson_name", lessonName);
                        formData.append("lessonFile", file);
                        formData.append("display_name", fileName);
                        formData.append("subject_id", cls.subject_id);

                        try {
                            const response = await fetch("http://localhost:3000/api/upload-lesson-material", {
                                method: "POST",
                                headers: {
                                    "Authorization": "Bearer " + token
                                },
                                body: formData 
                            });

                            if (!response.ok) throw new Error("Failed to upload");

                            const result = await response.json();
                            
                            alert("Lesson material uploaded successfully!");
                            lessonNameInput.value = "";
                            fileNameInput.value = "";
                            fileInput.value = "";
                        } catch (error) {
                            console.error("Error uploading:", error);
                        }
                    });
                });

                addAssignmentButton.addEventListener('click', () => {
                    teacherClassContent.innerHTML = "";
                    
                    const assignmentHeader = document.createElement("h3");
                    assignmentHeader.className = "assignmentHeader";
                    assignmentHeader.textContent = "Create Assignment";
                    teacherClassContent.appendChild(assignmentHeader);

                    const assignmentTitleInput = document.createElement("input");
                    assignmentTitleInput.className = "assignmentTitleInput";
                    assignmentTitleInput.type = "text";
                    assignmentTitleInput.placeholder = "Enter assignment title";
                    teacherClassContent.appendChild(assignmentTitleInput);

                    const assignmentDescriptionInput = document.createElement("textarea");
                    assignmentDescriptionInput.className = "assignmentDescriptionInput";
                    assignmentDescriptionInput.placeholder = "Enter assignment description";
                    teacherClassContent.appendChild(assignmentDescriptionInput);

                    const assinmentFileInput = document.createElement("input");
                    assinmentFileInput.className = "assignmentFileInput";
                    assinmentFileInput.type = "file";
                    assinmentFileInput.accept = ".pdf,.doc,.docx,.ppt,.pptx";
                    teacherClassContent.appendChild(assinmentFileInput);

                    const createAssignmentButton = document.createElement("button");
                    createAssignmentButton.className = "createAssignmentButton";
                    createAssignmentButton.textContent = "Create Assignment";
                    teacherClassContent.appendChild(createAssignmentButton);

                    const backButton = document.createElement("button");
                    backButton.className = "cancelAssignmentButton";
                    backButton.textContent = "Back";
                    teacherClassContent.appendChild(backButton);

                    backButton.addEventListener('click', () => {
                        renderMenu();
                    });
                });

                addSubmitionLinkButton.addEventListener('click', () => {
                    teacherClassContent.innerHTML = "";
                    const submitionLinkHeader = document.createElement("h3");
                    submitionLinkHeader.className = "submitionLinkHeader";
                    submitionLinkHeader.textContent = "Add Submition Link";
                    teacherClassContent.appendChild(submitionLinkHeader);

                    const submitionLinkInput = document.createElement("input");
                    submitionLinkInput.className = "submitionLinkInput";
                    submitionLinkInput.type = "text";
                    submitionLinkInput.placeholder = "Enter submition link (e.g., Google Form URL)";
                    teacherClassContent.appendChild(submitionLinkInput);

                    const addLinkButton = document.createElement("button");
                    addLinkButton.className = "addLinkButton";
                    addLinkButton.textContent = "Add Link";
                    teacherClassContent.appendChild(addLinkButton);

                    const backButton = document.createElement("button");
                    backButton.className = "cancelLinkButton";
                    backButton.textContent = "Back";
                    teacherClassContent.appendChild(backButton);

                    backButton.addEventListener('click', () => {
                        renderMenu();
                    });
                });
                renderMenu();

                teacherSelectedClass.appendChild(teacherClassHeader);
                teacherSelectedClass.appendChild(teacherClassContent);
                classCardContainer.appendChild(teacherSelectedClass);
            });
        });

    }
    catch(e){
        console.error("Error retrieving token:", e);
    }
});

createClassCard?.addEventListener('click', () => {
    alert("This feature is under development. Please check back later.");
    // Logic to create class will go here

    viewClassesCard.style.display = "none";
    createClassCard.style.display = "none";
    manageClassCard.style.display = "none";

    const createClassContent = document.createElement("div");
    createClassContent.className = "teacherSelectedClass";

    const createClassHeader = document.createElement("h2");
    createClassHeader.className = "teacherClassHeader";
    createClassHeader.textContent = "Add New Class";
    createClassContent.appendChild(createClassHeader);

    const subjects = [
        "Accounting", "Agriculture", "Arts", "Bio Tech", "Biology", 
        "Buddhism", "Business Studies", "Chemistry", "Christian", 
        "Civil Edu", "Combined Maths", "Drama", "Economics", 
        "Eng Tech", "English", "Geography", "Health Edu", 
        "History", "ICT", "Maths", "Music", "Physics", 
        "Practical", "SFT", "Science", "Sinhala", "Tamil"
    ];

    const subjectNameInput = document.createElement("select");
    subjectNameInput.className = "assignmentTitleInput";

    const defaultOption = document.createElement("option");
    defaultOption.text = "Select a subject";
    defaultOption.value = "";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    subjectNameInput.appendChild(defaultOption);

    subjects.forEach(subject => {
        const option = document.createElement("option");
        option.value = subject;
        option.text = subject;
        subjectNameInput.appendChild(option);
    });

    createClassContent.appendChild(subjectNameInput);

    const gradeNameInput = document.createElement("select");
    gradeNameInput.className = "gradeNameInput";
    gradeNameInput.innerHTML = `
        <option value="">Select Grade</option>
        <option value="Grade 6 class A">Grade 6 class A</option>
        <option value="Grade 6 class B">Grade 6 class B</option>
        <option value="Grade 6 class C">Grade 6 class C</option>
        <option value="Grade 7 class A">Grade 7 class A</option>
        <option value="Grade 7 class B">Grade 7 class B</option>
        <option value="Grade 7 class C">Grade 7 class C</option>
        <option value="Grade 8 class A">Grade 8 class A</option>
        <option value="Grade 8 class B">Grade 8 class B</option>
        <option value="Grade 8 class C">Grade 8 class C</option>
        <option value="Grade 9 class A">Grade 9 class A</option>
        <option value="Grade 9 class B">Grade 9 class B</option>
        <option value="Grade 9 class C">Grade 9 class C</option>
        <option value="Grade 10 class A">Grade 10 class A</option>
        <option value="Grade 10 class B">Grade 10 class B</option>
        <option value="Grade 10 class C">Grade 10 class C</option>
        <option value="Grade 11 class A">Grade 11 class A</option>
        <option value="Grade 11 class B">Grade 11 class B</option>
        <option value="Grade 11 class C">Grade 11 class C</option>
        <option value="Grade 12 class A">Grade 12 class A</option>
        <option value="Grade 12 class B">Grade 12 class B</option>
        <option value="Grade 12 class C">Grade 12 class C</option>
        <option value="Grade 13 class A">Grade 13 class A</option>
        <option value="Grade 13 class B">Grade 13 class B</option>
        <option value="Grade 13 class C">Grade 13 class C</option>

    `;
    createClassContent.appendChild(gradeNameInput);

    const addButton = document.createElement("button");
    addButton.className = "createAssignmentButton";
    addButton.textContent = "Add Class";
    createClassContent.appendChild(addButton);
    const backButton = document.createElement("button");
    backButton.className = "cancelAssignmentButton";
    backButton.textContent = "Back";
    createClassContent.appendChild(backButton);

    classCardContainer.appendChild(createClassContent);

    backButton.addEventListener('click', () => {
        createClassContent.remove();
        viewClassesCard.style.display = "block";
        createClassCard.style.display = "block";
        manageClassCard.style.display = "block";
    });

    addButton.addEventListener('click', async () => {
        try{
            const token = localStorage.getItem("token");
            if (!token) {
                alert("No token found. Please login again.");
                window.location.href = "LoginPage.html";
                return;
            }

            const response = await fetch("http://localhost:3000/api/create-class", {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    subject_name: subjectNameInput.value,
                    grade_name: gradeNameInput.value
                }),
            });

            if (!response.ok) throw new Error("Failed to upload");

            const result = await response.json(); 
            console.log("Success:", result);
            alert("Class added successfully!");
            subjectNameInput.value = "";
            gradeNameInput.value = "";               

        }catch (e){
            console.log(e);
        }
    });
});

viewClassesCard?.addEventListener('click', async () => {

    classCardContainer.innerHTML = "";
    try{
        const token = localStorage.getItem("token");
        if (!token) {
            alert("No token found. Please login again.");
            window.location.href = "LoginPage.html";
            return;
        }
        const response = await fetch("http://localhost:3000/api/view-classes", { 
            method: "POST", // Must match your app.post in backend
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },

        });

        if (!response.ok) {
            if (response.status === 403) alert("Access Denied: Teachers only.");
            throw new Error("Failed to fetch classes");
        }
        const data = await response.json();

        const backBtn = document.createElement("button");
        backBtn.textContent = "← Back to Classes";
        backBtn.className = "backfromClassButton";
        dashboardContainer.appendChild(backBtn);

        backBtn.addEventListener('click', () => {
            window.open('teacher_class.html', '_self'); 
        });

        data.classes.forEach(cls => {

            const div = document.createElement("div");
            div.className = "class_card";


            const h3 = document.createElement("h3");
            h3.className = "class-name";
            h3.textContent = cls.subject_name;
            const h2 = document.createElement("h2");
            h2.className = "class-info";
            h2.textContent = cls.grade_name;

            div.appendChild(h3);
            div.appendChild(h2);

            classCardContainer.appendChild(div);

            div.addEventListener('click', async() => {

                classCardContainer.innerHTML = "";

                const teacherSelectedClass = document.createElement("div");
                teacherSelectedClass.className = "teacherSelectedClass";

                const backBtn = document.createElement("button");
                backBtn.textContent = "← Back to Classes";
                backBtn.className = "cancelAssignmentButton";

                 backBtn.addEventListener('click', () => {
                    viewClassesCard.click(); 
                });
                alert("This feature is under development. Please check back later."+cls.subject_name+cls.grade_name); 

                const teacherClassHeader = document.createElement("h2");
                teacherClassHeader.className = "teacherClassHeader";
                teacherClassHeader.textContent = `Class: ${cls.subject_name} - ${cls.grade_name}`;

                const teacherClassContent = document.createElement("div");
                teacherClassContent.className = "teacherClassContent";

                const teacherClassContentHeader = document.createElement("h3");
                teacherClassContentHeader.className = "teacherClassContentHeader";
                teacherClassContentHeader.textContent = "Select an option to view course materials.";
                teacherClassContent.appendChild(teacherClassContentHeader);
        
                teacherSelectedClass.appendChild(teacherClassHeader);
                teacherSelectedClass.appendChild(teacherClassContent);
                teacherSelectedClass.appendChild(backBtn);
                classCardContainer.appendChild(teacherSelectedClass);

                try{
                    // 1. Prepare the data object
                    const requestData = { 
                        subject_id: cls.subject_id 
                    };

                    const response = await fetch("http://localhost:3000/api/view-course-materials", {
                        method: "POST", 
                        headers: {
                            "Authorization": "Bearer " + token,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(requestData)
                    });

                    if (!response.ok) {
                        if (response.status === 403) alert("Access Denied: Teachers only.");
                        throw new Error("Failed to fetch classes");
                    }
                    const data = await response.json();

                    const materialContainer = document.createElement("div");
                    materialContainer.className = "materialContainer";
                    teacherClassContent.appendChild(materialContainer);

                    data.courseMaterials.forEach(async material => {

                        const materialDiv = document.createElement("div");
                        materialDiv.className = "course_material_card";
                        const lessonName = document.createElement("h4");
                        lessonName.textContent = material.lesson_name;
                        
                        materialDiv.appendChild(lessonName);
                        materialContainer.appendChild(materialDiv);

                        lessonName.addEventListener('click', async() => {

                            teacherClassContent.innerHTML = "";

                            const backBtn = document.createElement("button");
                            backBtn.textContent = "← Back to Lessons";
                            backBtn.className = "cancelAssignmentButton"; // Style this in your CSS
                            teacherClassContent.appendChild(backBtn);

                            // 2. BACK BUTTON CLICK LOGIC (Re-triggers the parent view)
                            backBtn.addEventListener('click', () => {
                                // This clears the detail view and clicks the parent class card 
                                // to force a refresh of the materials list
                                div.click(); 
                            });


                            try{
                                 const response = await fetch("http://localhost:3000/api/get-lesson-material-file", {
                                    method: "POST",
                                    headers: {
                                        "Authorization": "Bearer " + token,
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify({ lesson_id: material.lesson_id, subject_id: cls.subject_id })
                                });

                                if (!response.ok) {
                                    if (response.status === 403) alert("Access Denied: Teachers only.");
                                    throw new Error("Failed to fetch file URL");
                                }
                                
                                const data = await response.json()
                                console.log("File URL Received:", data);

                                data.getLessonMaterialFile.forEach(file => {

                                    const updatedDate = new Date(file.updated_at).toLocaleDateString();
                                    const uploadInfo = document.createElement("p");
                                    uploadInfo.className = "uploadInfo";
                                    uploadInfo.textContent = `Uploaded on: ${updatedDate}`;
                                    teacherClassContent.appendChild(uploadInfo);

                                    const fileName = document.createElement("p");
                                    fileName.className = "fileName";
                                    fileName.textContent = file.display_name;
                                    teacherClassContent.appendChild(fileName);

                                    const fileLink = document.createElement("a");
                                    fileLink.href = file.file_url;
                                    fileLink.textContent = "Download";
                                    fileLink.className = "fileLink";
                                    fileLink.target = "_blank"; 
                                    teacherClassContent.appendChild(fileLink);

                                });
                            }catch(e){
                                console.error("Error retrieving file URL:", e);
                            }
                            
                        });
                    });


                }
                catch(e){   
                    console.error("Error retrieving token:", e);
                }

            });

        });


    }
    catch(e){
        console.error("Error retrieving token:", e);
    }
});