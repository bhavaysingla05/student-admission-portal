import React, { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import toast from "react-hot-toast";

interface Props {
    student: any;
}

const ApplicationFormCard = ({ student }: Props) => {
    const [generating, setGenerating] = useState(false);

    const loadImage = (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                if (!ctx) return resolve("");

                ctx.drawImage(img, 0, 0);

                // Process pixels to make background white
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    // If pixel is near-black (background), make it white
                    if (r < 40 && g < 40 && b < 40) {
                        data[i] = 255;   // Red
                        data[i + 1] = 255; // Green
                        data[i + 2] = 255; // Blue
                    }
                }

                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL("image/jpeg", 0.9));
            };
            img.onerror = reject;
            img.src = url;
        });
    };

    const generatePDF = async () => {
        try {
            setGenerating(true);
            const logoData = await loadImage("/logowithbg.png").catch(() => null);
            const doc = new jsPDF("p", "mm", "a4");

            const drawChecklistPage = () => {
                // Outer border
                doc.setLineWidth(0.8);
                doc.rect(5, 5, 200, 287);

                // Inner border
                doc.setLineWidth(0.2);
                doc.rect(7, 7, 196, 283);

                let cy = 15;

                // Header
                doc.setFont("times", "italic");
                doc.setFontSize(22);
                const titleStr = "Lingaya's Vidyapeeth, Faridabad-121002";
                doc.text(titleStr, 15, cy);
                // Underline
                doc.setLineWidth(0.2);
                doc.line(15, cy + 1, 15 + doc.getTextWidth(titleStr), cy + 1);

                cy += 4;
                doc.setFontSize(10);
                doc.text("(Deemed to-be-University u/s - 3 of UGC Act-1956)", 15, cy);
                cy += 4;
                doc.text("Nachauli, Old Faridabad - Jasana Road, Faridabad - 121002, Ph. 0129-2598200 -205", 15, cy);

                cy += 3;
                doc.setLineWidth(0.5); doc.line(15, cy, 195, cy);
                cy += 1;
                doc.setLineWidth(0.2); doc.line(15, cy, 195, cy);

                cy += 8;
                doc.setFont("helvetica", "bold");
                doc.setFontSize(11);
                doc.text("CHECK-LIST FOR ADMISSION", 15, cy);
                doc.setFont("helvetica", "normal");
                const mainDescStr = "(To be submitted along with application/admission form)";
                doc.text(mainDescStr, 15 + doc.getTextWidth("CHECK-LIST FOR ADMISSION") + 2, cy);

                cy += 10;
                doc.setFont("times", "normal");
                doc.setFontSize(11);
                doc.text("Full Name: _________________________________", 15, cy);
                if (student?.name) {
                    doc.setFont("times", "bold");
                    doc.text(student.name.toUpperCase(), 35, cy - 1);
                    doc.setFont("times", "normal");
                }

                doc.text("Programme:-", 100, cy);
                if (student?.course) {
                    doc.setFont("times", "bold");
                    const courseLines = doc.splitTextToSize(student.course.toUpperCase(), 75);
                    doc.text(courseLines, 125, cy - 1);
                    doc.setFont("times", "normal");

                    doc.setLineWidth(0.2);
                    doc.line(122, cy, 195, cy);
                    if (courseLines.length > 1) {
                        doc.line(122, cy + 5, 195, cy + 5);
                        cy += (courseLines.length - 1) * 5;
                    }
                } else {
                    doc.text("__________________________________________________", 122, cy);
                }

                cy += 10;
                doc.text("Lingaya's Vidyapeeth ", 15, cy);
                const twL = doc.getTextWidth("Lingaya's Vidyapeeth ");
                doc.setFont("times", "italic");
                doc.text("(Deemed to-be-University)", 15 + twL, cy);
                const twD = doc.getTextWidth("(Deemed to-be-University)");
                doc.setFont("times", "normal");
                doc.text("Admission / Application form (Duly filled) Form Sl. No. ...", 15 + twL + twD, cy);

                cy += 2;
                // Item 1
                doc.setFont("times", "normal"); doc.setFontSize(11);
                cy += 6;
                doc.text("1.", 15, cy);
                doc.setFont("times", "bolditalic");
                doc.text("Original Migration Certificate", 25, cy);
                const tw1 = doc.getTextWidth("Original Migration Certificate");
                doc.setLineWidth(0.2); doc.line(25, cy + 1, 25 + tw1, cy + 1);

                cy += 5;
                doc.setFont("times", "normal"); doc.setFontSize(9);
                const mText = "Migration Certificate & Copies of all eligibility documents i.e Mark sheet of qualifying Examination, must reach by 30th Sept. (every Session) in Academic Section, Late fee of Rs. 500/-  Will be charged after 30th September (Every Academic Year), No separate information will be issued";
                const mLines = doc.splitTextToSize(mText, 140);
                doc.text(mLines, 25, cy);

                let boxY = cy + (mLines.length - 1) * 4;
                doc.setFontSize(10);

                const addCheckboxes = (itemNum: number, yPos: number) => {
                    doc.text("Yes", 168, yPos);
                    const cbYes = new (doc as any).AcroFormCheckBox();
                    cbYes.fieldName = `Item${itemNum}_Yes`;
                    cbYes.Rect = [175, yPos - 3, 3, 3];
                    cbYes.appearanceState = "Off";
                    doc.addField(cbYes);
                    doc.rect(175, yPos - 3, 3, 3);

                    doc.text("/ No", 181, yPos);
                    const cbNo = new (doc as any).AcroFormCheckBox();
                    cbNo.fieldName = `Item${itemNum}_No`;
                    cbNo.Rect = [189, yPos - 3, 3, 3];
                    cbNo.appearanceState = "Off";
                    doc.addField(cbNo);
                    doc.rect(189, yPos - 3, 3, 3);
                };

                addCheckboxes(1, boxY);
                cy = boxY + 7;

                // Item 2
                doc.setFont("times", "normal"); doc.setFontSize(10);
                doc.text("2.", 15, cy);
                doc.text("Photographs", 25, cy);
                doc.text("8 Passport Size", 80, cy);
                addCheckboxes(2, cy);
                cy += 7;

                // Item 3
                doc.text("3.", 15, cy);
                doc.text("Class 10th Mark- Sheet, with", 25, cy);
                doc.setFont("times", "italic");
                doc.text("02 Photocopies", 80, cy);
                const tw3 = doc.getTextWidth("02 Photocopies"); doc.line(80, cy + 1, 80 + tw3, cy + 1);
                doc.setFont("times", "normal");
                addCheckboxes(3, cy);
                cy += 7;

                // Item 4
                doc.text("4.", 15, cy);
                doc.text("Class 12th / Diploma", 25, cy);
                addCheckboxes(4, cy);
                cy += 7;

                // Item 5
                doc.text("5.", 15, cy);
                doc.text("UG / PG / other qualifying Mark Sheet (With Grand Total) with", 25, cy);
                const tw5_1 = doc.getTextWidth("UG / PG / other qualifying Mark Sheet (With Grand Total) with");
                doc.setFont("times", "italic");
                doc.text("02 Photocopies", 25 + tw5_1 + 2, cy);
                const tw5 = doc.getTextWidth("02 Photocopies"); doc.line(25 + tw5_1 + 2, cy + 1, 25 + tw5_1 + 2 + tw5, cy + 1);
                doc.setFont("times", "normal");
                addCheckboxes(5, cy);
                cy += 7;

                // Item 6
                doc.text("6.", 15, cy);
                doc.text("Character Certificate from the previous School / College / University", 25, cy);
                addCheckboxes(6, cy);
                cy += 7;

                // Item 7
                doc.text("7.", 15, cy);
                doc.text("Copy of Aadhar Card", 25, cy);
                addCheckboxes(7, cy);
                cy += 7;

                // Item 8
                doc.text("8.", 15, cy);
                doc.text("Copy of Caste certificate", 25, cy);
                doc.text("(if applicable)", 130, cy);
                addCheckboxes(8, cy);
                cy += 7;

                // Item 9
                doc.text("9.", 15, cy);
                doc.text("Copy of medical certificate", 25, cy);
                addCheckboxes(9, cy);
                cy += 7;

                // Item 10
                doc.text("10.", 15, cy);
                doc.text("Copy of Justification of gap year / Affidavit", 25, cy);
                doc.text("(if any)", 130, cy);
                addCheckboxes(10, cy);
                cy += 7;

                // Item 11
                doc.text("11.", 15, cy);
                doc.text("Duly filled Temporary & Permanent identity card along with photos", 25, cy);
                addCheckboxes(11, cy);
                cy += 7;

                // Item 12
                doc.text("12.", 15, cy);
                doc.text("JEE / NATA / CAT / MAT / CLAT / LET / any other State / National level", 25, cy);
                cy += 5;
                doc.text("Entrance exam Rank No. (If any)", 25, cy);
                addCheckboxes(12, cy);
                cy += 12;

                // Notes
                doc.setFont("times", "normal");
                doc.text("Note", 15, cy);
                doc.line(15, cy + 1, 22, cy + 1);

                doc.text("1)", 25, cy);
                const note1Pt1 = "If any student withdraws his/her admission from the Lingaya's Vidyapeeth (Deemed to-be-";
                doc.text(note1Pt1, 35, cy); cy += 5;

                const note1Pt2 = "University), after the final cut-off date of admissions ";
                doc.text(note1Pt2, 35, cy);
                const twN1 = doc.getTextWidth(note1Pt2);

                doc.setFont("times", "bold");
                const note1Pt3 = "prescribed in the information";
                doc.text(note1Pt3, 35 + twN1, cy);
                const twN2 = doc.getTextWidth(note1Pt3);
                doc.setLineWidth(0.5); doc.line(35 + twN1, cy + 1, 35 + twN1 + twN2, cy + 1); doc.setLineWidth(0.2);

                cy += 5;
                const note1Pt4 = "brochure / web-site";
                doc.text(note1Pt4, 35, cy);
                const twN3 = doc.getTextWidth(note1Pt4);
                doc.setLineWidth(0.5); doc.line(35, cy + 1, 35 + twN3, cy + 1); doc.setLineWidth(0.2);

                doc.setFont("times", "normal");
                doc.text(", the fee paid by the candidate, is not refundable", 35 + twN3, cy);

                cy += 8;
                doc.text("2)", 25, cy);
                const note2Lines = doc.splitTextToSize("Lingaya's Vidyapeeth fee submission cycle is/are 2nd week of November & 2nd week of April month's (every academic year / session) for next semester Registration / Appearing", 155);
                doc.text(note2Lines, 35, cy);
                cy += note2Lines.length * 5 + 3;

                doc.text("3)", 25, cy);
                const note3Lines = doc.splitTextToSize("Provisional Admission is allowed till 30th September of the current Academic Session only. All students are required to submit his/her mark-sheet of qualifying examination (i.e 10th/12th/Diploma/UG/PG course) for Registration Verification to Academic Section, Positively. Late fee on late submission of documents will be applicable after 30th September. The Lingaya's Vidyapeeth (Deemed to-be-University) is authorized to cancel provisional admission after 30th November.", 155);
                doc.text(note3Lines, 35, cy);

                // Signatures
                cy = 270;
                doc.text("Signature of Student:.......................................", 15, cy);
                doc.text("(Please read all instructions carefully)", 15, cy + 4);

                doc.text("Father / Mother / Guardian Signature .......................", 110, cy);
                doc.text("(Please read all instructions carefully)", 110, cy + 4);
            };

            const drawSection = (startY: number, isTemporary: boolean) => {
                // --- Header ---
                doc.setFont("times", "italic");
                doc.setFontSize(16);
                doc.text("Lingaya's Vidyapeeth, Faridabad-121002", 15, startY);

                doc.setFontSize(9);
                doc.setFont("times", "normal");
                if (isTemporary) {
                    doc.text("(Deemed to - be - University)", 92, startY);
                } else {
                    doc.text("(Deemed to - be - University, Under Section-3 of UGC Act-1956)", 15, startY + 4);
                    doc.text("Ph. 01292598200-205", 115, startY + 4);
                }

                doc.setFontSize(13);
                doc.setFont("times", "bold");
                if (isTemporary) {
                    doc.text("TEMPORARY STUDENT IDENTITY CARD", 15, startY + 5);
                    doc.setFontSize(8);
                    doc.setFont("times", "normal");
                    doc.text("(Ph. No. 0129-2598200 - 205)", 93, startY + 5);
                } else {
                    doc.text("Form for Permanent Student Identity card", 15, startY + 9);
                }

                // --- Photo Box ---
                const photoY = isTemporary ? startY - 2 : startY + 10;
                doc.rect(160, photoY, 35, 42);
                doc.setFontSize(9);
                doc.setFont("times", "normal");
                doc.text("PAST PHOTO", 166, photoY + 22);

                doc.setFontSize(10);
                let y = isTemporary ? startY + 12 : startY + 18;

                if (!isTemporary) {
                    doc.text("(Fill in Capital letter's only)", 15, y);
                    doc.setFontSize(9);
                    doc.text("Card No- .....................................", 120, y);
                    doc.text("(To be filled by the Office)", 120, y + 4);
                    doc.setFontSize(10);
                    y += 10;

                    doc.setFont("times", "bold");
                    doc.text("Course Name: - .......................................................................", 15, y);
                    doc.text(student?.course || "", 45, y - 1); // fill course
                    doc.setFont("times", "normal");
                    y += 8;
                }

                const addRow = (label: string, value: string, yPos: number, isHalf: boolean = false) => {
                    doc.text(`${label}`, 15, yPos);
                    doc.text(`:-`, 35, yPos);

                    const lineStartX = 40;
                    const lineEndX = isHalf ? 95 : 150;

                    doc.setDrawColor(180, 180, 180);
                    doc.line(lineStartX, yPos + 1, lineEndX, yPos + 1);
                    doc.setDrawColor(0, 0, 0);

                    if (value) {
                        doc.setFont("helvetica", "bold");
                        doc.text(value.toUpperCase(), lineStartX + 2, yPos - 1);
                        doc.setFont("times", "normal");
                    }
                };

                addRow("Name", student?.name || "", y); y += 8;
                addRow("Father Name", student?.fatherName || "", y); y += 8;
                addRow("Address", student?.address || "", y); y += 8;

                // Two columns row (Mobile & Course/DOB)
                doc.text("Mobile No", 15, y); doc.text(":-", 35, y);
                doc.setDrawColor(180, 180, 180); doc.line(40, y + 1, 75, y + 1); doc.setDrawColor(0, 0, 0);
                if (student?.phone) { doc.setFont("helvetica", "bold"); doc.text(student.phone, 42, y - 1); doc.setFont("times", "normal"); }

                doc.text("Date of Birth:-", 80, y);
                doc.setDrawColor(180, 180, 180); doc.line(105, y + 1, 130, y + 1); doc.setDrawColor(0, 0, 0);
                if (student?.dob) {
                    doc.setFont("helvetica", "bold");
                    const rawDob = student.dob.toString();
                    const dobOnly = rawDob.split("T")[0]; // removes "T00:00:00.000Z"
                    doc.text(dobOnly, 107, y - 1);
                    doc.setFont("times", "normal");
                }

                doc.text("Course Name:-", 135, y);
                if (student?.course) {
                    doc.setFont("helvetica", "bold");
                    const courseLines = doc.splitTextToSize(student.course.toUpperCase(), 35);
                    doc.text(courseLines, 162, y - 1);
                    doc.setFont("times", "normal");

                    doc.setDrawColor(180, 180, 180);
                    doc.line(160, y + 1, 195, y + 1);
                    if (courseLines.length > 1) {
                        doc.line(160, y + 1 + 5, 195, y + 1 + 5);
                        y += (courseLines.length - 1) * 5;
                    }
                    doc.setDrawColor(0, 0, 0);
                } else {
                    doc.setDrawColor(180, 180, 180); doc.line(160, y + 1, 195, y + 1); doc.setDrawColor(0, 0, 0);
                }
                y += 8;


                // Issue & Valid up to row
                doc.text("Date of issue", 15, y); doc.text(":-", 35, y);
                doc.setDrawColor(180, 180, 180); doc.line(40, y + 1, 75, y + 1); doc.setDrawColor(0, 0, 0);

                if (isTemporary) {
                    doc.text("Date of Expiry: - 30th Sept.", 80, y);
                    doc.text("Temp. Roll / Reg. No", 135, y);
                    doc.setDrawColor(180, 180, 180); doc.line(170, y + 1, 195, y + 1); doc.setDrawColor(0, 0, 0);
                } else {
                    doc.text("Valid up to: - June ______", 80, y);
                    doc.setFontSize(8); doc.text("(End of Course)", 121, y); doc.setFontSize(10);
                    doc.text("Blood group ______", 150, y);
                }
                y += 8;

                // Helper to find Aadhar dynamically
                const getAadhar = () => {
                    if (!student) return "";
                    const key = Object.keys(student).find(k => k.toLowerCase().includes("aadhar") || k.toLowerCase().includes("adhar") || k.toLowerCase().includes("aadhaar"));
                    return key ? student[key] : "";
                };
                const aadharVal = student?.uid || student?.['Aadhaar No.'] || student?.['Aadhar No.'] || student?.aadhaar || student?.aadhar || getAadhar();

                // Email / Roll No
                if (isTemporary) {
                    doc.text("Email id.:- ......................................................... Aadhar No.:- ........................................", 15, y);
                    if (student?.email) { doc.setFont("helvetica", "bold"); doc.text(student.email, 35, y - 1); doc.setFont("times", "normal"); }
                    if (aadharVal) {
                        doc.setFont("helvetica", "bold");
                        doc.text(aadharVal.toString(), 125, y - 1);
                        doc.setFont("times", "normal");
                    }
                } else {
                    doc.text("Email id.:- .....................................................................", 15, y);
                    if (student?.email) { doc.setFont("helvetica", "bold"); doc.text(student.email, 35, y - 1); doc.setFont("times", "normal"); }

                    doc.text("Roll / Reg. No", 100, y);
                    doc.setDrawColor(180, 180, 180); doc.line(125, y + 1, 195, y + 1); doc.setDrawColor(0, 0, 0);
                    doc.setFontSize(9); doc.text("(To be filled by the Office)", 100, y + 4); doc.setFontSize(10);
                    y += 8;

                    doc.text("Aadhar No.:- ...........................................", 15, y);
                    if (aadharVal) {
                        doc.setFont("helvetica", "bold");
                        doc.text(aadharVal.toString(), 40, y - 1);
                        doc.setFont("times", "normal");
                    }
                    doc.text("(Copy of Aadhar card is enclosed)", 90, y);
                }


                y += 20;

                // Signatures
                doc.text("..............................", 15, y);
                doc.text("Signature of Student", 15, y + 5);

                doc.text("..............................", 150, y);
                doc.text("Dy. Registrar (Acad)", 150, y + 5);

                if (isTemporary) {
                    y += 15;
                    doc.setFontSize(8);
                    doc.setFont("times", "bold");
                    const noteText = "Note: - Student must submit his / her Original Migration Certificate & other eligibility / pending document (if any) by 30th September of current academic session otherwise late fee of Rs. 500/- will be charged, (as per rule) and Collect his / her Permanent I-Card from Academic Section of the University / Vidyapeeth";
                    const splitText = doc.splitTextToSize(noteText, 180);
                    doc.text(splitText, 15, y);
                }
            };

            const drawRulesPage = () => {
                doc.addPage();

                let y = 20;

                // Important Rules Section
                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                doc.text("Important Rules", 15, y);
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.5);
                doc.line(15, y + 1, 48, y + 1);
                y += 8;

                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");

                const rule1 = "1. All disputes are subject to Faridabad jurisdictions only";
                doc.text(rule1, 15, y);
                y += 8;

                const rule2 = "2. In case any student is detained in any semester, due to shortage of attendance / lower semester not cleared, will have to register himself as a regular student of the Lingaya's Vidyapeeth in the next session in the same semester, He / She shall have to pay the semester fee and other dues as applicable to regular students, under University rules.";
                const linesR2 = doc.splitTextToSize(rule2, 180);
                doc.text(linesR2, 15, y);
                y += linesR2.length * 5 + 3;

                const rule3Part1 = "3. In case, any student gets F (Fail) in any subject of 10+2 exam or other Exam and passes the subject separately, it will be the responsibility of the candidate to submit, separate mark sheet at the time of Admission / Registration by the Lingaya's Vidyapeeth (Deemed to-be-University) with fee (as prescribed by the University) ";
                const linesR3P1 = doc.splitTextToSize(rule3Part1, 180);
                doc.text(linesR3P1, 15, y);
                y += linesR3P1.length * 5;

                doc.setFont("helvetica", "bold");
                const rule3Part2 = "His / her admission will be provisional, till Lingaya's Vidyapeeth (Deemed to-be-University) Registers the candidate";
                const linesR3P2 = doc.splitTextToSize(rule3Part2, 180);
                doc.text(linesR3P2, 15, y);
                y += linesR3P2.length * 5 + 5;

                // Undertaking Section
                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                doc.text("Undertaking", 15, y);
                doc.line(15, y + 1, 40, y + 1);
                y += 8;

                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                const courseName = student?.course || student?.program || "...............................................................";

                const u1_1 = `•     I undertake that University allowed me provisional admission in the Programme of ${courseName}, Final admission confirmed only, subjected to clearing all the papers of my lower qualifying examinations, successfully. Before / `;
                const linesU1_1 = doc.splitTextToSize(u1_1, 180);
                doc.text(linesU1_1, 15, y);
                y += linesU1_1.length * 5;
                doc.setFont("helvetica", "bold");
                doc.text("By 30th September, of current Academic Session.", 15, y);
                y += 8;

                doc.setFont("helvetica", "normal");
                const u2 = `•     That my result of previous qualifying examination is awaited from the Board / University .............................................................. (Board / Univ. name), after declaration of my result by the Board / University, if I got Re-Appear / Compartment in any Subject. The University / Vidyapeeth is authorized to cancel my admission.`;
                const linesU2 = doc.splitTextToSize(u2, 180);
                doc.text(linesU2, 15, y);
                y += linesU2.length * 5 + 3;

                const u3_1 = `•     That I will abide by the Lingaya's Vidyapeeth (Deemed to-be-University) norms after the declaration of result. i.e. my provisional admission will stand cancelled, if my result is declared "negative" or university not register me due to declare as fake Board / University of my qualifying examination / `;
                const linesU3_1 = doc.splitTextToSize(u3_1, 180);
                doc.text(linesU3_1, 15, y);
                y += linesU3_1.length * 5;
                doc.setFont("helvetica", "bold");
                const u3_2 = `Re-appear in any subject or less than % of marks in grand total / aggregate / PCM, prescribed in the information brochure`;
                const linesU3_2 = doc.splitTextToSize(u3_2, 180);
                doc.text(linesU3_2, 15, y);
                y += linesU3_2.length * 5;
                doc.setFont("helvetica", "normal");
                doc.text("and I have no right to claim for the return of fee,", 15, y);
                y += 8;

                const u4 = `•     I understand that, I have no right to claim for the admission in the Lingaya's Vidyapeeth (Deemed to-be-University) after cut-off date (already announced in the information Broacher) if negative results forth comes and I have no right to claim for the return of fee,`;
                const linesU4 = doc.splitTextToSize(u4, 180);
                doc.text(linesU4, 15, y);
                y += linesU4.length * 5 + 8;

                doc.setFont("helvetica", "bold");
                doc.text("% of Marks of Qualifying Examinations is:-", 105, y, { align: "center" });
                y += 10;

                const m10 = student?.educationDetails1Percentage || "";
                const m12 = student?.educationDetails2Percentage || "";
                let mPCM = "";
                let mDip = "";

                if (student?.educationDetails2SchoolState === "Medical" || student?.educationDetails2SchoolState === "Non-Medical") {
                    mPCM = student?.educationDetails2Percentage || "";
                }

                doc.setFont("helvetica", "bolditalic");
                doc.text("a) % of marks of 10th Class:", 40, y);
                doc.text(m10 ? m10.toString() : "..................", 115, y);
                doc.text("%.)", 145, y);
                y += 8;

                doc.text("b) % of marks of 12th Class:", 40, y);
                doc.text(m12 ? m12.toString() : "..................", 115, y);
                doc.text("%.", 145, y);
                y += 8;

                doc.text("c) % of marks of 12th Class:", 40, y);
                doc.text(mPCM ? mPCM.toString() : "..................", 115, y);
                doc.text("%. (P.C.M. )", 145, y);
                y += 8;

                doc.text("d) % of marks of Diploma / UG / PG", 40, y);
                doc.text(mDip ? mDip.toString() : "..................", 115, y);
                doc.text("% (if any)", 145, y);
                y += 15;

                doc.setFont("helvetica", "normal");
                doc.text("Signature of Student:-..................................", 15, y);
                doc.text("Father / Mother / Guardian Signature ......................", 110, y);
                y += 5;
                doc.text("(Please read all instructions carefully)", 15, y);
                doc.text("(Please read all instructions carefully)", 110, y);
                y += 10;

                doc.text("Sl. No. of documents missing: -     ...................................................................", 15, y);
                y += 12;

                doc.text("Admission Status      Provisional / Final", 15, y);
                doc.text(": - ........................................", 120, y);
                y += 6;
                doc.text("Signature of Verifier : - ________________", 15, y);
                doc.text("Fee Receipt No   : - ........................................", 120, y);
                y += 6;
                doc.text("Name of Verifier : - ________________", 15, y);
                doc.text("Accountant / Cashier  : - ........................................", 120, y);
                y += 6;
                doc.text("Dated:    : - ________________", 15, y);
                doc.text("Dy. Registrar (Acad)   :- ........................................", 120, y);

                doc.setLineWidth(0.8);
                doc.rect(5, 5, 200, 287);
            };

            const drawAnnexurePage = () => {
                doc.addPage();

                let y = 20;

                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.text("ANNEXURE I", 105, y, { align: "center" });
                y += 7;
                doc.text("AFFIDAVIT BY THE STUDENT", 105, y, { align: "center" });
                y += 15;

                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");

                const nameStr = student?.name ? student.name.toUpperCase() : "...............................................................";
                const fatherStr = student?.fatherName ? student.fatherName.toUpperCase() : ".......................................................";

                doc.text("I, ", 15, y);
                doc.setFont("helvetica", "bold");
                doc.text(nameStr, 15 + doc.getTextWidth("I, "), y);
                doc.setFont("helvetica", "normal");

                const pt1 = " (full name of student with Institute Roll Number) s/o d/o Mr./Mrs./Ms. ";
                doc.text(pt1, 15 + doc.getTextWidth("I, ") + doc.getTextWidth(nameStr), y);

                y += 5;
                doc.setFont("helvetica", "bold");
                doc.text(fatherStr, 15, y);
                doc.setFont("helvetica", "normal");

                const pt2 = ", having been admitted to Lingaya's Vidyapeeth (name of the institution), have received";
                doc.text(pt2, 15 + doc.getTextWidth(fatherStr), y);

                y += 5;
                const p1_rest = "or downloaded a copy of the UGC Regulations on Curbing the Menace of Ragging in Higher Educational Institutions, 2009, (hereinafter called the \"Regulations\") carefully read and fully understood the provisions contained in the said Regulations:-";

                const linesP1 = doc.splitTextToSize(p1_rest, 180);
                doc.text(linesP1, 15, y);
                y += linesP1.length * 5 + 3;

                const points = [
                    "1) I have, in particular, perused clause 3 of the Regulations and am aware as to what constitutes ragging.",
                    "2) I have also, in particular, perused clause 7 and clause 9.1 of the Regulations and am fully aware of the penal and administrative action that is liable to be taken against me in case I am found guilty of or abetting ragging, actively or passively, or being part of a conspiracy to promote ragging.",
                    "3) I hereby solemnly aver and undertake that a) I will not indulge in any behaviour or act that may be constituted as ragging under clause 3 of the Regulations. b) I will not participate in or abet or propagate through any act of commission or omission that may be constituted as ragging under clause 3 of the Regulations.",
                    "4) I hereby affirm that, if found guilty of ragging, I am liable for punishment according to clause 9.1 of the Regulations, without prejudice to any other criminal action that may be taken against me under any penal law or any law for the time being in force.",
                    "5) I hereby declare that I have not been expelled or debarred from admission in any institution in the country on account of being found guilty of, abetting or being part of a conspiracy to promote, ragging; and further affirm that, in case the declaration is found to be untrue, I am aware that my admission is liable to be cancelled.",
                    "6) Along with the above mentioned points I do hereby declare that",
                    "      a) I will obey the code of conduct of the institute and do not indulge in any kind of in-disciplined",
                    "          activity while in and off the institution campus.",
                    "      b) I will be solely responsible for any kind of accident/mishap caused on account of the above",
                    "          mentioned clause (6.a)."
                ];

                points.forEach(pt => {
                    const lines = doc.splitTextToSize(pt, 180);

                    // Prevent page overflow
                    if (y + lines.length * 5 > 280) {
                        doc.addPage();
                        y = 20;
                    }

                    doc.text(lines, 15, y);
                    y += lines.length * 5 + 1;
                });

                y += 5;
                doc.text("Declared this _____ day of ______________ month of ________ year ________________", 15, y);

                y += 20;
                doc.text("Signature of Deponent", 195, y, { align: "right" });
                y += 6;
                doc.text(`Name: ${nameStr}`, 195, y, { align: "right" });

                y += 12;
                doc.setFont("helvetica", "bold");
                doc.text("VERIFICATION", 105, y, { align: "center" });
                y += 6;

                doc.setFont("helvetica", "normal");
                const verifText = "Verified that the contents of this affidavit are true to the best of my knowledge and no part of the affidavit is false and nothing has been concealed or misstated therein. Verified at ------------------------(place) on this the --------------(day) of -----------(month) , ----------- (year ) . ________________";
                const linesVerif = doc.splitTextToSize(verifText, 180);
                doc.text(linesVerif, 15, y);
                y += linesVerif.length * 5 + 3;

                doc.text(`Mobile No.: ${student?.phone || "..........................."}         Email id: - ${student?.email || "......................................................"}`, 15, y);

                y += 20;
                doc.text("Signature of Deponent", 195, y, { align: "right" });
                y += 6;
                doc.text(`(Name: - ${nameStr})`, 195, y, { align: "right" });

                y += 15;
                const finalAffirm = "Solemnly affirmed and signed in my presence on this the ---------------(day) of ------------------- (month), ------------- (year ) after reading the contents of this affidavit.";
                const linesFinal = doc.splitTextToSize(finalAffirm, 180);
                doc.text(linesFinal, 15, y);
                y += linesFinal.length * 5 + 15;

                doc.text("OATH COMMISSIONER", 195, y, { align: "right" });

                y += 10;
                doc.setFont("helvetica", "bold");
                doc.text("Note: ", 15, y);
                doc.setFont("helvetica", "normal");
                doc.text("It is mandatory to submit this affidavit in the above format, if you desire to register for the", 27, y);
                y += 5;
                doc.text("forthcoming academic session.", 15, y);

                doc.setLineWidth(0.8);
                doc.rect(5, 5, 200, 287);
            };

            const drawAnnexure2Page = () => {
                doc.addPage();

                let y = 20;

                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.text("ANNEXURE II", 105, y, { align: "center" });
                y += 7;
                doc.text("AFFIDAVIT BY PARENT / GUARDIAN", 105, y, { align: "center" });
                y += 15;

                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");

                const fatherStr = student?.fatherName ? student.fatherName.toUpperCase() : "....................................................................";

                doc.text("I, Mr./Mrs./Ms. ", 15, y);
                doc.setFont("helvetica", "bold");
                doc.text(fatherStr, 15 + doc.getTextWidth("I, Mr./Mrs./Ms. "), y);
                doc.setFont("helvetica", "normal");

                const pt1 = " (full name of parent/guardian) father/mother/guardian of, student),";
                doc.text(pt1, 15 + doc.getTextWidth("I, Mr./Mrs./Ms. ") + doc.getTextWidth(fatherStr), y);

                y += 5;
                const pt2 = "have been admitted to Lingaya's Vidyapeeth (name of the Institution), have received";
                doc.text(pt2, 15, y);

                y += 5;
                const p1_rest = "or downloaded a copy of the UGC Regulations on Curbing the Menace of Ragging in Higher Educational Institutions, 2009, (hereinafter called the \"Regulations\"), carefully read and fully understood the provisions contained in the said Regulations:-";

                const linesP1 = doc.splitTextToSize(p1_rest, 180);
                doc.text(linesP1, 15, y);
                y += linesP1.length * 5 + 3;

                const points = [
                    "1) I have, in particular, perused clause 3 of the Regulations and am aware as to what constitutes ragging.",
                    "2) I have also, in particular, perused clause 7 and clause 9.1 of the Regulations and am fully aware of the penal and administrative action that is liable to be taken against my ward in case he/she is found guilty of or abetting ragging, actively or passively, or being part of a conspiracy to promote ragging.",
                    "3) I hereby solemnly aver and undertake that a) my ward will not indulge in any behaviour or act that may be constituted as ragging under clause 3 of the Regulations. b) My ward will not participate in or abet or propagate through any act of commission or omission that may be constituted as ragging under clause 3 of the Regulations.",
                    "4) I hereby affirm that, if found guilty of ragging, my ward is liable for punishment according to clause 9.1 of the Regulations, without prejudice to any other criminal action that may be taken against my ward under any penal law or any law for the time being in force.",
                    "5) I hereby declare that my ward has not been expelled or debarred from admission in any institution in the country on account of being found guilty of, abetting or being part of a conspiracy to promote, ragging; and further affirm that, in case the declaration is found to be untrue, the admission of my ward is liable to be cancelled.",
                    "6) Along with the above mentioned points I do hereby declare that",
                    "      a) My ward will obey the code of conduct of the institute and do not indulge in any kind of in-",
                    "          disciplined activity while in and off the institution campus.",
                    "      b) My ward will be solely responsible for any kind of accident/mishap caused on account of the above",
                    "          mentioned clause (6.a)."
                ];

                points.forEach(pt => {
                    const lines = doc.splitTextToSize(pt, 180);

                    if (y + lines.length * 5 > 280) {
                        doc.addPage();
                        y = 20;
                    }

                    doc.text(lines, 15, y);
                    y += lines.length * 5 + 1;
                });

                y += 5;
                doc.text("Declared this _______________ day of __________ month of ______ year. _____________", 15, y);

                y += 20;
                doc.text("Signature of deponent", 195, y, { align: "right" });
                y += 6;
                doc.text(`Name: ${fatherStr}`, 195, y, { align: "right" });
                y += 6;
                doc.text(`Address:- ${student?.address || "........................................................................................................"}`, 15, y);
                y += 6;
                doc.text(`Mobile No.: ${student?.phone || "..........................."}         Email id: - ${student?.email || "......................................................"}`, 15, y);

                y += 12;
                doc.setFont("helvetica", "bold");
                doc.text("VERIFICATION", 105, y, { align: "center" });
                y += 6;

                doc.setFont("helvetica", "normal");
                const verifText = "Verified that the contents of this affidavit are true to the best of my knowledge and no part of the affidavit is false and nothing has been concealed or misstated therein. Verified at ---------------(place) on this the -------(day) of -------(month) ……, (year ) …….";
                const linesVerif = doc.splitTextToSize(verifText, 180);
                doc.text(linesVerif, 15, y);
                y += linesVerif.length * 5 + 3;

                const finalAffirm = "Solemnly affirmed and signed in my presence on this the ____________ (day) of ___________ (month) ,________ (year) after reading the contents of this affidavit.";
                const linesFinal = doc.splitTextToSize(finalAffirm, 180);
                doc.text(linesFinal, 15, y);
                y += linesFinal.length * 5 + 15;

                doc.text("Signature of deponent", 15, y);
                doc.text("OATH COMMISSIONER", 195, y, { align: "right" });

                y += 10;
                doc.setFont("helvetica", "bold");
                doc.text("Note: ", 15, y);
                doc.setFont("helvetica", "normal");
                doc.text("It is mandatory to submit this affidavit in the above format, if you desire to register for the", 27, y);
                y += 5;
                doc.text("forthcoming academic session.", 15, y);

                doc.setLineWidth(0.8);
                doc.rect(5, 5, 200, 287);
            };

            const drawLetterPage = () => {
                doc.addPage();

                // Outer border
                doc.setLineWidth(0.8);
                doc.rect(5, 5, 200, 287);

                let cy = 15;

                // Header (Same as Page 1 for consistency)
                if (logoData) {
                    doc.addImage(logoData, "JPEG", 15, cy - 8, 20, 20);
                }

                doc.setFont("times", "italic");
                doc.setFontSize(22);
                const titleStr = "Lingaya's Vidyapeeth, Faridabad-121002";
                const textX = logoData ? 40 : 15;
                doc.text(titleStr, textX, cy);
                doc.setLineWidth(0.2);
                doc.line(textX, cy + 1, textX + doc.getTextWidth(titleStr), cy + 1);

                cy += 4;
                doc.setFontSize(10);
                doc.text("(Deemed to-be-University u/s - 3 of UGC Act-1956)", textX, cy);
                cy += 4;
                doc.text("Nachauli, Old Faridabad - Jasana Road, Faridabad - 121002, Ph. 0129-2598200 -205", textX, cy);

                cy += 3;
                doc.setLineWidth(0.5); doc.line(15, cy, 195, cy);
                cy += 1;
                doc.setLineWidth(0.2); doc.line(15, cy, 195, cy);

                cy += 10;
                doc.setFont("times", "normal");
                doc.setFontSize(12);
                doc.text(`Date: ________________`, 140, cy);

                cy += 15;
                doc.text("To", 15, cy);
                cy += 6;
                doc.text("The Director", 15, cy);
                cy += 6;
                doc.text("Admissions", 15, cy);
                cy += 6;
                doc.text("Lingaya’s Vidyapeeth", 15, cy);
                cy += 6;
                doc.text("Nachauli, Faridabad.", 15, cy);

                cy += 15;
                doc.text("Respected Sir,", 15, cy);

                cy += 10;
                const nameStr = student?.name ? ` ${student.name.toUpperCase()} ` : " _______________________ ";
                const fatherStr = student?.fatherName ? ` MR. ${student.fatherName.toUpperCase()} ` : " MR. _________________ ";
                const courseStr = student?.course ? ` ${student.course.toUpperCase()} ` : " _______________ ";
                const sessionStr = student?.session ? ` ${student.session} ` : " 20__20__ ";

                doc.text("I", 15, cy);
                doc.setFont("times", "bold");
                doc.text(nameStr, 15 + doc.getTextWidth("I"), cy);
                const nameW = doc.getTextWidth(nameStr);
                doc.setFont("times", "normal");
                doc.text("S/o / D/o", 15 + doc.getTextWidth("I") + nameW, cy);
                const sodW = doc.getTextWidth("S/o / D/o");
                doc.setFont("times", "bold");
                doc.text(fatherStr, 15 + doc.getTextWidth("I") + nameW + sodW, cy);
                const fatherW = doc.getTextWidth(fatherStr);
                doc.setFont("times", "normal");
                doc.text("have applied", 15 + doc.getTextWidth("I") + nameW + sodW + fatherW, cy);

                cy += 8;
                doc.text("for", 15, cy);
                doc.setFont("times", "bold");
                doc.text(courseStr, 15 + doc.getTextWidth("for"), cy);
                const courseW = doc.getTextWidth(courseStr);
                doc.setFont("times", "normal");
                doc.text("course in your esteemed university for the session", 15 + doc.getTextWidth("for") + courseW, cy);

                cy += 8;
                doc.setFont("times", "bold");
                doc.text(sessionStr, 15, cy);
                const sessionW = doc.getTextWidth(sessionStr);
                doc.setFont("times", "normal");
                const ptAmount1 = ". I am paying amount of Rs.";
                doc.text(ptAmount1, 15 + sessionW, cy);
                const ptAmount1W = doc.getTextWidth(ptAmount1);

                // Interactive Amount Field
                const tfAmount = new (doc as any).AcroFormTextField();
                tfAmount.fieldName = "provisional_amount";
                tfAmount.Rect = [15 + sessionW + ptAmount1W + 1, cy - 4, 35, 5];
                doc.addField(tfAmount);
                doc.rect(15 + sessionW + ptAmount1W + 1, cy - 4, 35, 5); // Visual box

                doc.text("on account of provisional", 15 + sessionW + ptAmount1W + 37, cy);

                cy += 8;
                const ptBefore1 = "admission & rest of the amount I will pay before";
                doc.text(ptBefore1, 15, cy);
                const ptBefore1W = doc.getTextWidth(ptBefore1);

                // Interactive Deadline Field
                const tfDeadline = new (doc as any).AcroFormTextField();
                tfDeadline.fieldName = "payment_deadline";
                tfDeadline.Rect = [15 + ptBefore1W + 1, cy - 4, 45, 5];
                doc.addField(tfDeadline);
                doc.rect(15 + ptBefore1W + 1, cy - 4, 45, 5); // Visual box

                doc.text(". I request", 15 + ptBefore1W + 47, cy);

                cy += 8;
                doc.text("you to kindly allow me to pay the fee on semester wise instead of yearly basis", 15, cy);

                cy += 8;
                doc.text("due to some financial constraints.", 15, cy);

                cy += 15;
                doc.text("I will be thankful to you.", 15, cy);

                cy += 20;
                doc.text("Yours sincerely", 15, cy);

                cy += 30;
                doc.text("Student sign", 15, cy);
                doc.text("Parent sign", 140, cy);

                cy += 20;
                doc.text("Approved by:", 15, cy);
                cy += 8;
                doc.text("Name: ____________________________", 15, cy);
                cy += 8;
                doc.text("Designation: _______________________", 15, cy);
            };

            const drawUndertakingPage = () => {
                doc.addPage();

                // Outer border
                doc.setLineWidth(0.8);
                doc.rect(5, 5, 200, 287);

                let cy = 15;

                // Header
                if (logoData) {
                    doc.addImage(logoData, "JPEG", 15, cy - 8, 20, 20);
                }

                doc.setFont("times", "italic");
                doc.setFontSize(22);
                const titleStr = "Lingaya's Vidyapeeth, Faridabad-121002";
                const textX = logoData ? 40 : 15;
                doc.text(titleStr, textX, cy);
                doc.setLineWidth(0.2);
                doc.line(textX, cy + 1, textX + doc.getTextWidth(titleStr), cy + 1);

                cy += 4;
                doc.setFontSize(10);
                doc.text("(Deemed to-be-University u/s - 3 of UGC Act-1956)", textX, cy);
                cy += 4;
                doc.text("Nachauli, Old Faridabad - Jasana Road, Faridabad - 121002, Ph. 0129-2598200 -205", textX, cy);

                cy += 3;
                doc.setLineWidth(0.5); doc.line(15, cy, 195, cy);
                cy += 1;
                doc.setLineWidth(0.2); doc.line(15, cy, 195, cy);

                cy += 10;
                doc.setFont("times", "normal");
                doc.setFontSize(12);
                doc.text(`Date: ________________`, 140, cy);

                cy += 15;
                doc.setFont("times", "bold");
                doc.setFontSize(14);
                const mainTitle = "Undertaking for Provisional admission in case of Result";
                doc.text(mainTitle, 105, cy, { align: "center" });
                cy += 6;
                const subTitle = "awaited/supplementary";
                doc.text(subTitle, 105, cy, { align: "center" });

                const twTitle1 = doc.getTextWidth(mainTitle);
                const twTitle2 = doc.getTextWidth(subTitle);
                doc.setLineWidth(0.3);
                doc.line(105 - twTitle1 / 2, cy - 5, 105 + twTitle1 / 2, cy - 5);
                doc.line(105 - twTitle2 / 2, cy + 1, 105 + twTitle2 / 2, cy + 1);

                cy += 12;
                const whomStr = "TO WHOM SO EVER IT MAY CONCERN";
                doc.text(whomStr, 105, cy, { align: "center" });
                doc.line(105 - doc.getTextWidth(whomStr) / 2, cy + 1, 105 + doc.getTextWidth(whomStr) / 2, cy + 1);

                cy += 15;
                doc.setFont("times", "normal");
                doc.setFontSize(12);
                doc.text("I", 15, cy);

                const iW = doc.getTextWidth("I");
                let nameSpace = 62;

                if (student?.name) {
                    doc.setFont("times", "bold");
                    const nStr = ` ${student.name.toUpperCase()} `;
                    doc.text(nStr, 15 + iW, cy);
                    nameSpace = doc.getTextWidth(nStr);
                    doc.setFont("times", "normal");
                } else {
                    const tfName = new (doc as any).AcroFormTextField();
                    tfName.fieldName = "undertaking_student_name";
                    tfName.Rect = [15 + iW + 1, cy - 4, 60, 5];
                    doc.addField(tfName);
                    doc.rect(15 + iW + 1, cy - 4, 60, 5);
                }

                doc.text("hereby declare that my result awaited/I have scored", 15 + iW + nameSpace, cy);

                cy += 8;
                doc.text("scored", 15, cy);
                const tfPerc = new (doc as any).AcroFormTextField();
                tfPerc.fieldName = "undertaking_percentage";
                tfPerc.Rect = [15 + doc.getTextWidth("scored") + 1, cy - 4, 15, 5];
                doc.addField(tfPerc);
                doc.rect(15 + doc.getTextWidth("scored") + 1, cy - 4, 15, 5);

                const percX = 15 + doc.getTextWidth("scored") + 17;
                doc.text("% total marks in 12th class or", percX, cy);
                const t1W = doc.getTextWidth("% total marks in 12th class or");

                const tfCourse1 = new (doc as any).AcroFormTextField();
                tfCourse1.fieldName = "undertaking_course_from";
                tfCourse1.Rect = [percX + t1W + 1, cy - 4, 30, 5];
                doc.addField(tfCourse1);
                doc.rect(percX + t1W + 1, cy - 4, 30, 5);

                doc.text("course and got", percX + t1W + 32, cy);

                cy += 8;
                doc.text("supplementary in", 15, cy);
                const tfSupSubject = new (doc as any).AcroFormTextField();
                tfSupSubject.fieldName = "undertaking_sup_subject";
                tfSupSubject.Rect = [15 + doc.getTextWidth("supplementary in") + 1, cy - 4, 35, 5];
                doc.addField(tfSupSubject);
                doc.rect(15 + doc.getTextWidth("supplementary in") + 1, cy - 4, 35, 5);

                const supX = 15 + doc.getTextWidth("supplementary in") + 37;
                doc.text("subject. On the basis of overall 12th percentage, I", supX, cy);

                cy += 8;
                doc.text("am eligible for provisional admission in", 15, cy);
                const eligW = doc.getTextWidth("am eligible for provisional admission in");
                let courseSpace = 47;

                if (student?.course) {
                    doc.setFont("times", "bold");
                    const cStr = ` ${student.course.toUpperCase()} `;
                    doc.text(cStr, 15 + eligW, cy);
                    courseSpace = doc.getTextWidth(cStr);
                    doc.setFont("times", "normal");
                } else {
                    const tfCourse2 = new (doc as any).AcroFormTextField();
                    tfCourse2.fieldName = "undertaking_course_to";
                    tfCourse2.Rect = [15 + eligW + 1, cy - 4, 45, 5];
                    doc.addField(tfCourse2);
                    doc.rect(15 + eligW + 1, cy - 4, 45, 5);
                }

                doc.text("course with", 15 + eligW + courseSpace, cy);

                cy += 8;
                const tfAmount = new (doc as any).AcroFormTextField();
                tfAmount.fieldName = "undertaking_amount";
                tfAmount.Rect = [15, cy - 4, 25, 5];
                doc.addField(tfAmount);
                doc.rect(15, cy - 4, 25, 5);

                doc.text("amount. In case of failure in qualifying my supplementary exam, my", 15 + 26, cy);

                cy += 8;
                doc.text("provisional admission will automatically terminated and amount deposited will", 15, cy);

                cy += 8;
                doc.text("not be refunded.", 15, cy);

                cy += 15;
                doc.setFont("times", "bold");
                const noteText = "Note- I declare that all the details provided above are true to the best of my knowledge. Any Discrepancy in the same will be solely my responsibility.";
                const splitNote = doc.splitTextToSize(noteText, 180);
                doc.text(splitNote, 15, cy);

                cy += 25;
                doc.setFont("times", "normal");
                doc.text("Student sign", 15, cy);
                doc.text("Parent sign", 140, cy);

                cy += 20;
                doc.text("Approved by:", 15, cy);
                cy += 8;
                doc.text("Name: ____________________________", 15, cy);
                cy += 8;
                doc.text("Designation: _______________________", 15, cy);
            };

            const drawLateSubmissionPage = () => {
                doc.addPage();

                // Outer border
                doc.setLineWidth(0.8);
                doc.rect(5, 5, 200, 287);

                let cy = 15;

                // Header
                if (logoData) {
                    doc.addImage(logoData, "JPEG", 15, cy - 8, 20, 20);
                }

                doc.setFont("times", "italic");
                doc.setFontSize(22);
                const titleStr = "Lingaya's Vidyapeeth, Faridabad-121002";
                const textX = logoData ? 40 : 15;
                doc.text(titleStr, textX, cy);
                doc.setLineWidth(0.2);
                doc.line(textX, cy + 1, textX + doc.getTextWidth(titleStr), cy + 1);

                cy += 4;
                doc.setFontSize(10);
                doc.text("(Deemed to-be-University u/s - 3 of UGC Act-1956)", textX, cy);
                cy += 4;
                doc.text("Nachauli, Old Faridabad - Jasana Road, Faridabad - 121002, Ph. 0129-2598200 -205", textX, cy);

                cy += 3;
                doc.setLineWidth(0.5); doc.line(15, cy, 195, cy);
                cy += 1;
                doc.setLineWidth(0.2); doc.line(15, cy, 195, cy);

                cy += 15;
                doc.setFont("times", "bold");
                doc.setFontSize(14);
                const mainTitle = "UNDERTAKING FOR LATE SUBMISSION OF DOCUMENTS";
                doc.text(mainTitle, 105, cy, { align: "center" });
                doc.setLineWidth(0.3);
                doc.line(105 - doc.getTextWidth(mainTitle) / 2, cy + 1, 105 + doc.getTextWidth(mainTitle) / 2, cy + 1);

                cy += 15;
                doc.setFont("times", "normal");
                doc.setFontSize(12);
                doc.text("I", 15, cy);

                let nameX = 15 + doc.getTextWidth("I") + 2;
                let postNameX = nameX + 60;
                if (student?.name) {
                    doc.setFont("times", "bold");
                    doc.text(student.name.toUpperCase(), nameX, cy);
                    postNameX = nameX + doc.getTextWidth(student.name.toUpperCase()) + 2;
                    doc.setFont("times", "normal");
                } else {
                    const tfName = new (doc as any).AcroFormTextField();
                    tfName.fieldName = "late_student_name";
                    tfName.Rect = [nameX, cy - 4, 60, 5];
                    doc.addField(tfName);
                    doc.rect(nameX, cy - 4, 60, 5);
                }

                doc.text("D/S/O", postNameX, cy);
                let fatherX = postNameX + doc.getTextWidth("D/S/O") + 2;
                let postFatherX = fatherX + 60;
                if (student?.fatherName) {
                    doc.setFont("times", "bold");
                    doc.text(student.fatherName.toUpperCase(), fatherX, cy);
                    postFatherX = fatherX + doc.getTextWidth(student.fatherName.toUpperCase()) + 2;
                    doc.setFont("times", "normal");
                } else {
                    const tfFather = new (doc as any).AcroFormTextField();
                    tfFather.fieldName = "late_father_name";
                    tfFather.Rect = [fatherX, cy - 4, 60, 5];
                    doc.addField(tfFather);
                    doc.rect(fatherX, cy - 4, 60, 5);
                }
                doc.text("have applied", postFatherX, cy);

                cy += 8;
                doc.text("for", 15, cy);
                let courseX = 15 + doc.getTextWidth("for") + 2;
                let postCourseX = courseX + 80;
                if (student?.course) {
                    doc.setFont("times", "bold");
                    doc.text(student.course.toUpperCase(), courseX, cy);
                    postCourseX = courseX + doc.getTextWidth(student.course.toUpperCase()) + 2;
                    doc.setFont("times", "normal");
                } else {
                    const tfCourse = new (doc as any).AcroFormTextField();
                    tfCourse.fieldName = "late_course";
                    tfCourse.Rect = [courseX, cy - 4, 80, 5];
                    doc.addField(tfCourse);
                    doc.rect(courseX, cy - 4, 80, 5);
                }
                doc.text("course in your esteemed University for the", postCourseX, cy);

                cy += 8;
                doc.text("session", 15, cy);
                let sessX = 15 + doc.getTextWidth("session") + 2;
                let postSessX = sessX + 30;
                if (student?.session) {
                    doc.setFont("times", "bold");
                    doc.text(student.session, sessX, cy);
                    postSessX = sessX + doc.getTextWidth(student.session) + 2;
                    doc.setFont("times", "normal");
                } else {
                    const tfSess = new (doc as any).AcroFormTextField();
                    tfSess.fieldName = "late_session";
                    tfSess.Rect = [sessX, cy - 4, 30, 5];
                    doc.addField(tfSess);
                    doc.rect(sessX, cy - 4, 30, 5);
                }
                doc.text("undertake to produce the following certificate related to my", postSessX, cy);

                cy += 8;
                doc.text("admission at Lingaya's Vidyapeeth (Deemed to be University) by", 15, cy);
                const dateX = 15 + doc.getTextWidth("admission at Lingaya's Vidyapeeth (Deemed to be University) by") + 2;
                const tfDate1 = new (doc as any).AcroFormTextField();
                tfDate1.fieldName = "late_deadline_1";
                tfDate1.Rect = [dateX, cy - 4, 40, 5];
                doc.addField(tfDate1);
                doc.rect(dateX, cy - 4, 40, 5);

                cy += 10;
                for (let i = 1; i <= 5; i++) {
                    doc.text(`${i}.`, 15, cy);
                    const tfDoc = new (doc as any).AcroFormTextField();
                    tfDoc.fieldName = `late_doc_${i}`;
                    tfDoc.Rect = [20, cy - 4, 150, 5];
                    doc.addField(tfDoc);
                    doc.rect(20, cy - 4, 150, 5);
                    cy += 7;
                }

                cy += 5;
                doc.text("I undertake that, in case I fail to produce the above certificate by", 15, cy);
                const dateX2 = 15 + doc.getTextWidth("I undertake that, in case I fail to produce the above certificate by") + 2;
                const tfDate2 = new (doc as any).AcroFormTextField();
                tfDate2.fieldName = "late_deadline_2";
                tfDate2.Rect = [dateX2, cy - 4, 40, 5];
                doc.addField(tfDate2);
                doc.rect(dateX2, cy - 4, 40, 5);

                cy += 8;
                doc.text("admission will be automatically and summarily cancelled without showing any reason thereof", 15, cy);
                cy += 8;
                doc.text("and all my fees paid by me will be forfeited.", 15, cy);

                cy += 20;
                doc.setFont("times", "bold");
                doc.text("Name &Signature of the Student", 110, cy);
                cy += 6;
                doc.setFont("times", "normal");
                doc.text("Mobile No:", 110, cy);
                if (student?.phone) {
                    doc.setFont("times", "bold");
                    doc.text(student.phone, 130, cy);
                    doc.setFont("times", "normal");
                } else {
                    const tfMob1 = new (doc as any).AcroFormTextField();
                    tfMob1.fieldName = "late_student_mobile";
                    tfMob1.Rect = [130, cy - 4, 40, 5];
                    doc.addField(tfMob1);
                    doc.rect(130, cy - 4, 40, 5);
                }
                cy += 6;
                doc.text("Date:", 110, cy);
                const tfDate3 = new (doc as any).AcroFormTextField();
                tfDate3.fieldName = "late_student_date";
                tfDate3.Rect = [130, cy - 4, 40, 5];
                doc.addField(tfDate3);
                doc.rect(130, cy - 4, 40, 5);

                cy += 15;
                const guardianNote = "I understand that, my ward has not produced the above certificates during admission, and the same has to be submitted by him/her by";
                const splitNote = doc.splitTextToSize(guardianNote, 180);
                doc.text(splitNote, 15, cy);
                const noteLastLineW = doc.getTextWidth("same has to be submitted by him/her by");
                const tfDate4 = new (doc as any).AcroFormTextField();
                tfDate4.fieldName = "late_guardian_deadline";
                tfDate4.Rect = [15 + noteLastLineW + 2, cy + 5, 40, 5];
                doc.addField(tfDate4);
                doc.rect(15 + noteLastLineW + 2, cy + 5, 40, 5);

                cy += 12;
                doc.text("I have carefully studied the above undertaking.", 15, cy);

                cy += 20;
                doc.setFont("times", "bold");
                doc.text("Name & Signature of Guardian", 110, cy);
                cy += 6;
                doc.setFont("times", "normal");
                doc.text("Mobile No:", 110, cy);
                const gMob = student?.fatherMobile || student?.fatherMobileNumber || "";
                if (gMob) {
                    doc.setFont("times", "bold");
                    doc.text(gMob, 130, cy);
                    doc.setFont("times", "normal");
                } else {
                    const tfMob2 = new (doc as any).AcroFormTextField();
                    tfMob2.fieldName = "late_guardian_mobile";
                    tfMob2.Rect = [130, cy - 4, 40, 5];
                    doc.addField(tfMob2);
                    doc.rect(130, cy - 4, 40, 5);
                }
                cy += 6;
                doc.text("Date:", 110, cy);
                const tfDate5 = new (doc as any).AcroFormTextField();
                tfDate5.fieldName = "late_guardian_date";
                tfDate5.Rect = [130, cy - 4, 40, 5];
                doc.addField(tfDate5);
                doc.rect(130, cy - 4, 40, 5);
            };

            // Page 1: Admission Checklist
            drawChecklistPage();

            // Page 2: Rules and Undertaking
            drawRulesPage();

            // Page 3: Annexure I
            drawAnnexurePage();

            // Page 4: Annexure II
            drawAnnexure2Page();

            // Add new page for ID Cards
            doc.addPage();

            // Draw Permanent Section (Top)
            drawSection(20, false);

            // Draw thick divider line
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            doc.line(15, 145, 195, 145);
            doc.line(15, 146, 195, 146);
            doc.setLineWidth(0.1);

            // Draw Temporary Section (Bottom)
            drawSection(160, true);

            // Bounding box for ID Card page
            doc.setLineWidth(0.8);
            doc.rect(5, 5, 200, 287);

            // Page 6: Permission Letter
            drawLetterPage();

            // Page 7: Provisional Undertaking
            drawUndertakingPage();

            // Page 8: Late Submission Undertaking
            drawLateSubmissionPage();

            doc.save(`Application_Form_${student?.name || "Student"}.pdf`);
            toast.success("PDF Downloaded successfully!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to generate PDF");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="relative pl-8 mb-6">
            <div className="absolute left-1 top-0 bottom-0 w-1 bg-gray-200" />

            <div className="relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">

                {/* Connection Dot */}
                <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-5 h-5 bg-blue-500 rounded-full border-4 border-gray-100 z-10 shadow-sm" />

                <div className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors hover:bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 hidden sm:flex">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                                Admission Checklist
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                Get a PDF copy of your filled details for offline reference.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={generatePDF}
                        disabled={generating}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold text-sm rounded-xl transition-all shadow-sm shadow-blue-200"
                    >
                        {generating ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Download size={16} />
                        )}
                        Download PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApplicationFormCard;
