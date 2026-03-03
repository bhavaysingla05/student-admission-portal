const { jsPDF } = require("jspdf");
const fs = require("fs");

const doc = new jsPDF();

try {
    const cbYes = new doc.AcroFormCheckBox();
    cbYes.fieldName = "Item1_Yes";
    // For mutually exclusive behavior with CheckBox, they must have unique names
    // To link them, one normally uses radio buttons, but jsPDF RadioButton has bugs in some PDF readers.
    // The visual request: both need to start empty.
    cbYes.Rect = [50, 50, 5, 5];
    cbYes.appearanceState = "Off";

    const cbNo = new doc.AcroFormCheckBox();
    cbNo.fieldName = "Item1_No";
    cbNo.Rect = [70, 50, 5, 5];
    cbNo.appearanceState = "Off";

    doc.addField(cbYes);
    doc.addField(cbNo);

    doc.rect(50, 50, 5, 5);
    doc.text("Yes", 40, 54);

    doc.rect(70, 50, 5, 5);
    doc.text("No", 80, 54);

    fs.writeFileSync("test.pdf", Buffer.from(doc.output('arraybuffer')));
    console.log("Success! Open test.pdf to see 2 empty checkboxes.");
} catch (e) {
    console.error(e);
}
