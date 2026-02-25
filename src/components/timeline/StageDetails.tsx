import React, { useState } from "react";
import { Lock as LockIcon, ShieldAlert, CheckCircle2, Upload, FileText, Loader2 } from "lucide-react";
import PaymentSummary from "./PaymentSummary";
import VerificationGate from "../VerificationGate";
import { uploadFile, uploadDocument } from "../../services/uploadService";
import toast from "react-hot-toast";

/**
 * Helper: checks if value exists (for display only)
 */
const isFilled = (v: any) =>
  v !== null &&
  v !== undefined &&
  !(typeof v === "string" && v.trim() === "");

const StageDetails = ({
  stage,
  student,
  formData,
  onChange,
  onSave,
  saving,
}: any) => {
  const [editMode, setEditMode] = useState(false);
  const [showVerification, setShowVerification] = useState<{
    open: boolean;
    type: "Father Mobile" | "Mother Mobile" | "Email";
    value: string;
  }>({ open: false, type: "Father Mobile", value: "" });

  // Verification State (In a real app, this should come from the API/Session)
  const [verifiedStatus, setVerifiedStatus] = useState({
    fatherMobile: false,
    motherMobile: false,
    email: false,
  });

  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});

  const handleFileChange = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!student?._id) return toast.error("Student ID missing");

    setUploadingFields(prev => ({ ...prev, [key]: true }));
    try {
      // Use the new 3-step upload flow
      const res = await uploadDocument(file, student._id, key);
      const url = res.publicURL;

      console.log("File Uploaded Successfully:", url);
      if (url) {
        onChange(key, url);
        toast.success("Uploaded successfully");

        // Auto-save if onSave is provided
        if (onSave) {
          setTimeout(() => {
            onSave();
          }, 500);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setUploadingFields(prev => ({ ...prev, [key]: false }));
    }
  };

  const isActiveStage = stage.status === "active";
  const fields: any[] = stage.fields || [];

  const fatherMobile = student.fatherMobile || student.fatherMobileNumber || "";
  const motherMobile = student.motherMobile || student.motherMobileNumber || "";
  const email = student.email || "";

  const allVerified = verifiedStatus.fatherMobile && verifiedStatus.motherMobile && verifiedStatus.email;

  const handleEditClick = () => {
    if (!allVerified) {
      setShowVerification({ ...showVerification, open: true });
    } else {
      setEditMode((p) => !p);
    }
  };

  const onVerified = (type: string) => {
    if (type === "Father Mobile") setVerifiedStatus(p => ({ ...p, fatherMobile: true }));
    if (type === "Mother Mobile") setVerifiedStatus(p => ({ ...p, motherMobile: true }));
    if (type === "Email") setVerifiedStatus(p => ({ ...p, email: true }));
    // Don't close immediately here, the Gate handles switching. 
    // If all are verified, Gate might stay open or close.
  };

  const verificationItems = [
    { type: "Father Mobile" as const, value: fatherMobile, verified: verifiedStatus.fatherMobile },
    { type: "Mother Mobile" as const, value: motherMobile, verified: verifiedStatus.motherMobile },
    { type: "Email" as const, value: email, verified: verifiedStatus.email },
  ]; // Pass all items, even if value is empty, so student can fill them in.

  // ── Group fields into tabs dynamically ───────────
  // We look for 'groupName' or 'group' from the API.
  const grouped: Record<string, any[]> = {};
  const groupsInOrder: string[] = [];

  fields.forEach((f: any) => {
    const rawGroupName = f.groupBy || f.groupName || f.group || "Personal Information";
    // Normalize: e.g. "Personal Information" -> "Personal Information"
    // (We keep the case from the API for display)
    const tab = rawGroupName;

    if (!grouped[tab]) {
      grouped[tab] = [];
      groupsInOrder.push(tab);
    }
    grouped[tab].push(f);
  });

  // Only show tabs that actually have fields (already handled by logic above, but for safety)
  const visibleTabs = groupsInOrder.filter((t) => grouped[t]?.length > 0);

  const [activeTab, setActiveTab] = useState<string>("");

  // Initialize activeTab to the first visible tab if not set
  const currentTab = activeTab || visibleTabs[0] || "";
  const safeTab = grouped[currentTab]?.length > 0 ? currentTab : visibleTabs[0] || "";

  // ── Render a single field ────────────────────────
  const renderField = (field: any) => {
    const original = student[field.key];
    const hasEdited = Object.prototype.hasOwnProperty.call(formData, field.key);
    const value = hasEdited ? formData[field.key] : original;

    // A field is "locked" if it already has a value in the student record.
    const isLocked = isFilled(original);

    return (
      <div key={field._id} className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <label className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">
            {field.displayName}
          </label>
          {editMode && isLocked && isActiveStage && (
            <span
              title="Locked"
              className="cursor-help flex items-center opacity-90 hover:opacity-100 transition-opacity"
            >
              <LockIcon size={12} className="text-orange-600 fill-orange-500/10" />
            </span>
          )}
        </div>

        {editMode && isActiveStage && !isLocked ? (
          (safeTab === "Upload doc" || field.fieldType === "FILE") ? (
            <div className="relative group">
              <input
                type="file"
                className="hidden"
                id={`file-${field.key}`}
                onChange={(e) => handleFileChange(field.key, e)}
              />
              <label
                htmlFor={`file-${field.key}`}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 transition-all cursor-pointer min-h-[100px] text-center
                  ${uploadingFields[field.key] ? "bg-orange-50 border-orange-300" : "bg-white border-gray-200 hover:border-orange-400 hover:bg-orange-50"}`}
              >
                {uploadingFields[field.key] ? (
                  <Loader2 className="animate-spin text-orange-500" size={24} />
                ) : value ? (
                  <div className="flex flex-col items-center gap-1">
                    <CheckCircle2 className="text-green-500" size={24} />
                    <span className="text-[10px] text-gray-500 truncate max-w-[100px] font-bold">Replace File</span>
                  </div>
                ) : (
                  <>
                    <Upload className="text-gray-300 group-hover:text-orange-500 transition-colors mb-2" size={24} />
                    <span className="text-[10px] text-gray-400 group-hover:text-orange-600 transition-colors uppercase font-bold tracking-wider">
                      Click to Upload
                    </span>
                  </>
                )}
              </label>
            </div>
          ) : field.fieldType === "selectBox" ? (
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-colors"
              value={value ?? ""}
              onChange={(e) => onChange(field.key, e.target.value)}
            >
              <option value="">Select</option>
              {(field.options || []).map((opt: string) => (
                <option key={opt} value={opt}>
                  {opt.toUpperCase()}
                </option>
              ))}
            </select>
          ) : field.fieldType === "date" ? (
            <input
              type="date"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-colors"
              value={value ? value.slice(0, 10) : ""}
              onChange={(e) => onChange(field.key, e.target.value)}
            />
          ) : (
            <input
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-colors"
              value={value ?? ""}
              onChange={(e) => onChange(field.key, e.target.value)}
            />
          )
        ) : (
          <div
            className={`border rounded-lg px-3 py-2 text-sm min-h-[38px] flex items-center justify-between ${editMode && isLocked ? "bg-gray-100/50 text-gray-500 border-dashed" : "bg-gray-50 text-gray-700"
              }`}
          >
            <span className="truncate flex-1">
              {isFilled(value) ? (field.fieldType === "date" && typeof value === "string" ? value.slice(0, 10) : value) : "-"}
            </span>
            {(safeTab === "Upload doc" || field.fieldType === "FILE") && isFilled(value) && (
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-orange-600 hover:text-orange-700 p-1.5 hover:bg-orange-100 rounded-lg transition-all"
                title="View Document"
              >
                <FileText size={16} />
              </a>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

      {/* ================= HEADER ================= */}
      <div className="border-b border-gray-100 px-4 py-3 flex justify-between items-center">
        <div className="flex flex-col">
          <h3 className="font-bold text-gray-900">{stage.stage}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] font-semibold text-orange-600 uppercase tracking-wide">{stage.status}</span>
            {allVerified ? (
              <span className="flex items-center gap-1 text-[10px] text-green-600 font-bold uppercase">
                <CheckCircle2 size={10} /> Account Verified
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-red-500 font-bold uppercase">
                <ShieldAlert size={10} /> Verification Pending
              </span>
            )}
          </div>
        </div>

        {isActiveStage && (
          <div className="flex gap-2">
            <button
              onClick={handleEditClick}
              className={`text-xs font-bold px-4 py-2 rounded-xl border-2 transition-all shadow-sm flex items-center gap-2 
                ${!allVerified
                  ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                  : editMode
                    ? "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    : "bg-white border-orange-200 text-orange-600 hover:bg-orange-50"
                }`}
            >
              {editMode ? "Cancel" : allVerified ? "✏️ Edit Details" : "🛡️ Verify to Edit"}
            </button>
            {editMode && (
              <button
                onClick={onSave}
                disabled={saving}
                className="text-xs font-bold px-4 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-all shadow-md shadow-orange-100 flex items-center gap-2"
              >
                {saving ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : "💾 Save Changes"}
              </button>
            )}
          </div>
        )}
      </div>

      {showVerification.open && (
        <VerificationGate
          items={verificationItems}
          onVerified={onVerified}
          onCancel={() => setShowVerification({ ...showVerification, open: false })}
        />
      )}

      <div className="px-4 py-3 space-y-3">
        {/* ================= TABS ================= */}
        {visibleTabs.length > 1 && (
          <div className="flex flex-wrap gap-1.5 bg-gray-100 rounded-lg p-1">
            {visibleTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap
                ${safeTab === tab
                    ? "bg-gray-800 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/60"
                  }
              `}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* ================= FIELDS (active tab only) ================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {(grouped[safeTab] || []).map(renderField)}
        </div>

        {/* ================= PAYMENT SUMMARY ================= */}
        {student?.transactions?.length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Payment Summary</h4>
            <PaymentSummary student={student} stage={stage} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StageDetails;
