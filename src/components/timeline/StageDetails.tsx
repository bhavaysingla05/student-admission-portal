import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Lock as LockIcon, Upload, FileText, Loader2, Eye } from "lucide-react";
import PaymentSummary from "./PaymentSummary";
import VerificationGate from "../VerificationGate";
import { uploadDocument } from "../../services/uploadService";
import toast from "react-hot-toast";
import PayNowButton from "./PayNowButton";

/**
 * Helper: checks if value exists (for display only)
 */
const isFilled = (v: any) =>
  v !== null &&
  v !== undefined &&
  !(typeof v === "string" && v.trim() === "");

const isFatherMobileField = (field: any) => {
  if (!field) return false;
  const key = String(field.key || "").toLowerCase();
  const name = String(field.displayName || "").toLowerCase();

  const combined = (key + " " + name).replace(/_/g, " ").replace(/-/g, " ");
  const hasParent = combined.includes("father") || combined.includes("parent");
  const hasContact = combined.includes("mobile") || combined.includes("phone") || combined.includes("number") ||
    combined.includes("contact") || combined.includes("cell") || combined.includes("no");

  const isMotherOrEmail = combined.includes("mother") || combined.includes("email");

  return (hasParent && hasContact && !isMotherOrEmail);
};

const StageDetails = ({
  stage,
  student,
  formData,
  onChange,
  onSave,
  saving,
  onStudentRefresh,
}: any) => {
  const [editMode, setEditMode] = useState(false);
  const [showVerification, setShowVerification] = useState<{
    open: boolean;
    type: "Father Mobile" | "Mother Mobile" | "Email";
    value: string;
  }>({ open: false, type: "Father Mobile", value: "" });

  // Verification State persists in localStorage tied to student ID
  const storageKey = `verifiedStatus_${student?._id || "default"}`;
  const [verifiedStatus, setVerifiedStatus] = useState(() => {
    if (typeof window === "undefined") return { fatherMobile: false };
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : {
      fatherMobile: false,
    };
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(verifiedStatus));
  }, [verifiedStatus, storageKey]);

  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});

  const handleFileChange = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File Size Check: 5MB limit
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return toast.error("File size must be less than 5MB");
    }

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
  const handlePaymentSuccess = useCallback(() => {
    onStudentRefresh?.();
  }, [onStudentRefresh]);

  const isActiveStage = stage.status === "active";
  const fields: any[] = useMemo(() => stage.fields || [], [stage.fields]);

  useEffect(() => {
    console.log("DEBUG: All Stage Fields:", fields.map(f => ({ key: f.key, label: f.displayName, isFather: isFatherMobileField(f) })));
  }, [fields]);

  const fatherMobile = student.fatherMobile || student.fatherMobileNumber || "";

  const allVerified = verifiedStatus.fatherMobile;

  const handleEditClick = () => {
    setEditMode(true);
  };

  const onVerified = (type: string, verifiedValue?: string) => {
    if (type === "Father Mobile") {
      setVerifiedStatus((p: any) => ({ ...p, fatherMobile: true }));
      setEditMode(true);
      setShowVerification((p) => ({ ...p, open: false }));

      if (verifiedValue) {
        // Find which key the stage uses for father mobile
        const fKey = fields.find((f: any) => isFatherMobileField(f))?.key || "fatherMobile";
        onChange(fKey, verifiedValue);
      }
    }
  };

  const verificationItem = { type: "Father Mobile" as const, value: formData.fatherMobileNumber || formData.fatherMobile || fatherMobile, verified: verifiedStatus.fatherMobile };

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

    if (isFatherMobileField(field)) {
      console.log("Checking Father Mobile Field:", { key: field.key, name: field.displayName, verified: verifiedStatus.fatherMobile, value });
    }

    // A field is "locked" if it's filled AND in the Personal Details group AND matches specific keys (name, phone, email)
    const isLockableKey = ["name", "phone", "email"].some(k =>
      field.key.toLowerCase().includes(k)
    );
    const group = (field.groupBy || field.groupName || field.group || "Personal Information").toLowerCase();
    const isPersonalGroup = group.includes("personal");

    // A field is "locked" if it's filled AND (it's a specific personal detail OR a father mobile field)
    const isLocked = isFilled(original) && ((isPersonalGroup && isLockableKey) || isFatherMobileField(field));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      onChange(field.key, e.target.value);
    };

    return (
      <div key={field._id} className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <label className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">
            {field.displayName}
          </label>
          {editMode && isLocked && (
            <span
              title="Locked"
              className="cursor-help flex items-center opacity-90 hover:opacity-100 transition-opacity"
            >
              <LockIcon size={12} className="text-orange-600 fill-orange-500/10" />
            </span>
          )}
        </div>

        {editMode && !isLocked ? (
          (field.fieldType?.toUpperCase() === "FILE") ? (
            <div className="relative group">
              <input
                type="file"
                className="hidden"
                id={`file-${field.key}`}
                onChange={(e) => handleFileChange(field.key, e)}
              />
              {value ? (
                <div className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-2 transition-all min-h-[120px] text-center bg-gray-50 border-orange-200 group-hover:border-orange-400`}>
                  {uploadingFields[field.key] ? (
                    <Loader2 className="animate-spin text-orange-500" size={24} />
                  ) : (
                    <>
                      {/* Preview Logic */}
                      {(field.key.toLowerCase().includes("photo") || field.key.toLowerCase().includes("signature") || value.match(/\.(jpg|jpeg|png|gif|webp)$/i)) ? (
                        <div className="relative w-full h-[60px] flex justify-center mb-1">
                          <img src={value} alt={field.displayName} className="h-full object-contain rounded-md shadow-sm border border-gray-100 bg-white" />
                        </div>
                      ) : (
                        <FileText size={32} className="text-orange-400 mb-1" />
                      )}

                      <div className="flex items-center gap-2 mt-1">
                        <a
                          href={value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-white border border-gray-100 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-all shadow-sm"
                          title="View"
                        >
                          <Eye size={14} />
                        </a>
                        <label
                          htmlFor={`file-${field.key}`}
                          className="p-1.5 bg-white border border-gray-100 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all shadow-sm cursor-pointer"
                          title="Replace"
                        >
                          <Upload size={14} />
                        </label>
                      </div>
                      <span className="text-[9px] text-gray-400 mt-1 uppercase font-bold tracking-wider truncate max-w-full px-2">Uploaded</span>
                    </>
                  )}
                </div>
              ) : (
                <label
                  htmlFor={`file-${field.key}`}
                  className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 transition-all cursor-pointer min-h-[120px] text-center
                  ${uploadingFields[field.key] ? "bg-orange-50 border-orange-300" : "bg-white border-gray-200 hover:border-orange-400 hover:bg-orange-50"}`}
                >
                  {uploadingFields[field.key] ? (
                    <Loader2 className="animate-spin text-orange-500" size={24} />
                  ) : (
                    <>
                      <Upload className="text-gray-300 group-hover:text-orange-500 transition-colors mb-2" size={24} />
                      <span className="text-[10px] text-gray-400 group-hover:text-orange-600 transition-colors uppercase font-bold tracking-wider">
                        Click to Upload
                      </span>
                    </>
                  )}
                </label>
              )}
            </div>
          ) : field.fieldType === "selectBox" ? (
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-colors"
              value={value ?? ""}
              onChange={handleChange}
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
              onChange={handleChange}
            />
          ) : (
            <div className="flex flex-col gap-1 w-full">
              <input
                className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-colors ${isFatherMobileField(field) && !verifiedStatus.fatherMobile ? "cursor-pointer bg-orange-50/50 hover:bg-orange-50 border-orange-200 ring-1 ring-orange-200" : ""}`}
                value={value ?? ""}
                onChange={handleChange}
                onClick={(e) => {
                  if (isFatherMobileField(field) && !verifiedStatus.fatherMobile) {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowVerification({ open: true, type: "Father Mobile", value: value || fatherMobile });
                  }
                }}
                onFocus={(e) => {
                  if (isFatherMobileField(field) && !verifiedStatus.fatherMobile) {
                    e.target.blur();
                    setShowVerification({ open: true, type: "Father Mobile", value: value || fatherMobile });
                  }
                }}
                readOnly={isFatherMobileField(field) && !verifiedStatus.fatherMobile}
              />
              {isFatherMobileField(field) && !verifiedStatus.fatherMobile && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowVerification({ open: true, type: "Father Mobile", value: value || fatherMobile });
                  }}
                  className="w-full py-1 text-[10px] font-bold uppercase tracking-wider bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                >
                  Verify Number Now
                </button>
              )}
            </div>
          )
        ) : (
          (field.fieldType?.toUpperCase() === "FILE") ? (
            <div className={`relative flex flex-col items-center justify-center border rounded-xl p-2 transition-all min-h-[120px] text-center ${editMode && isLocked ? "bg-gray-100/30 border-gray-200 border-dashed" : "bg-gray-50 border-gray-100"}`}>
              {isFilled(value) ? (
                <>
                  {(field.key.toLowerCase().includes("photo") || field.key.toLowerCase().includes("signature") || (typeof value === 'string' && value.match(/\.(jpg|jpeg|png|gif|webp)$/i))) ? (
                    <div className="relative w-full h-[60px] flex justify-center mb-1">
                      <img src={value} alt={field.displayName} className="h-full object-contain rounded-md shadow-sm border border-gray-100 bg-white" />
                    </div>
                  ) : (
                    <FileText size={32} className="text-gray-300 mb-1" />
                  )}
                  <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 p-1.5 bg-white border border-gray-100 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-all shadow-sm"
                    title="View Document"
                  >
                    <Eye size={14} />
                  </a>
                </>
              ) : (
                <span className="text-gray-300 text-[10px] font-bold uppercase">No Document</span>
              )}
            </div>
          ) : (
            <div
              className={`border rounded-lg px-3 py-2 text-sm min-h-[38px] flex items-center justify-between ${isFatherMobileField(field) && !verifiedStatus.fatherMobile
                ? "bg-orange-50/50 text-orange-700 border-orange-300 cursor-pointer hover:bg-orange-50 border-dashed"
                : editMode && isLocked ? "bg-gray-100/50 text-gray-500 border-dashed" : "bg-gray-50 text-gray-700"
                }`}
              onClick={() => {
                if (isFatherMobileField(field) && !verifiedStatus.fatherMobile) {
                  console.log("Div Father Mobile onClick Triggered");
                  setShowVerification({ open: true, type: "Father Mobile", value: value || fatherMobile });
                }
              }}
              onMouseDown={() => {
                if (isFatherMobileField(field) && !verifiedStatus.fatherMobile) {
                  setShowVerification({ open: true, type: "Father Mobile", value: value || fatherMobile });
                }
              }}
            >
              <span className="truncate flex-1">
                {isFilled(value) ? (field.fieldType === "date" && typeof value === "string" ? value.slice(0, 10) : value) : "-"}
              </span>
              {isFatherMobileField(field) && !verifiedStatus.fatherMobile && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("View Mode Verify Button Clicked");
                    setShowVerification({ open: true, type: "Father Mobile", value: value || fatherMobile });
                  }}
                  className="text-[10px] bg-orange-600 text-white px-2 py-1 rounded-md font-extrabold shadow-sm hover:bg-orange-700 transition-colors shrink-0"
                >
                  VERIFY NOW
                </button>
              )}
            </div>
          )
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

      {/* ================= HEADER ================= */}
      <div className="border-b border-gray-100 px-4 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex flex-col">
          <h3 className="font-bold text-gray-900 text-lg sm:text-base">{stage.stage}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-0.5">
            <span className="text-[10px] sm:text-[11px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full uppercase tracking-wide border border-orange-100">{stage.status}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleEditClick}
            className={`flex-1 sm:flex-none text-[11px] sm:text-xs font-bold px-3 sm:px-4 py-2 rounded-xl border-2 transition-all shadow-sm flex items-center justify-center gap-2 
              ${!allVerified
                ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                : editMode
                  ? "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  : "bg-white border-orange-200 text-orange-600 hover:bg-orange-50"
              }`}
          >
            {editMode ? "Cancel" : "✏️ Edit Details"}
          </button>
          {editMode && (
            <button
              onClick={onSave}
              disabled={saving}
              className="flex-1 sm:flex-none text-[11px] sm:text-xs font-bold px-3 sm:px-4 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-all shadow-md shadow-orange-100 flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : "💾 Save Changes"}
            </button>
          )}
        </div>
      </div>

      {showVerification.open && (
        <VerificationGate
          item={verificationItem}
          onVerified={onVerified}
          onCancel={() => setShowVerification({ ...showVerification, open: false })}
        />
      )}

      <div className="px-4 py-3 space-y-3">
        {/* ================= TABS ================= */}
        {visibleTabs.length > 1 && (
          <div className="flex overflow-x-auto gap-1.5 bg-gray-50/50 rounded-xl p-1.5 no-scrollbar border border-gray-100 shadow-inner">
            {visibleTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap uppercase tracking-wider
                ${safeTab === tab
                    ? "bg-orange-500 text-white shadow-md shadow-orange-100"
                    : "text-gray-500 hover:text-orange-600 hover:bg-orange-50/50"
                  }
              `}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* ================= FIELDS (active tab only) ================= */}
        {visibleTabs.length > 0 && (
          <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 px-1">
            {safeTab}
          </h4>
        )}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-3">
          {(grouped[safeTab] || []).map(renderField)}
        </div>

        {/* ================= PAY NOW (active stage only) ================= */}
        {isActiveStage && (
          <PayNowButton
            stage={stage}
            student={student}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}

        {/* ================= PAYMENT SUMMARY ================= */}
        {student?.transactions?.length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Payment Summary</h4>
            <PaymentSummary student={student} stage={stage} />
          </div>
        )}
      </div>
    </div >
  );
};

export default StageDetails;
