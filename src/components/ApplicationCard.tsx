import {
  ArrowRight,
  ClipboardList,
  User,
  Phone,
  Mail,
  UserCheck,
} from "lucide-react";

interface ApplicationCardProps {
  student: any;
  onView?: () => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({ student, onView }) => {
  return (
    <div className="w-full rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">

      {/* HEADER */}
      <div className="border-b border-gray-100 px-5 py-3.5 flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-orange-500 flex-shrink-0" />
            Application Summary
          </h2>
          <p className="text-xs text-orange-600 font-semibold mt-0.5 ml-6">{student.applicationNumber}</p>
        </div>
        <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide ${student.currentStage?.toLowerCase() === "inquiry"
            ? "text-amber-700 bg-amber-50"
            : student.currentStage?.toLowerCase() === "approved"
              ? "text-green-700 bg-green-50"
              : "text-blue-700 bg-blue-50"
          }`}>
          {student.currentStage}
        </span>
      </div>

      <div className="px-5 py-4 space-y-4">

        {/* APPLICANT DETAILS — no box, just clean rows */}
        <div>
          <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <UserCheck className="w-3.5 h-3.5" />
            Applicant Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
            <p className="flex items-center gap-2">
              <User size={13} className="text-gray-400 flex-shrink-0" />
              <span className="text-gray-500">Name:</span>
              <span className="font-semibold text-gray-800">{student.name || "—"}</span>
            </p>
            <p className="flex items-center gap-2">
              <User size={13} className="text-gray-400 flex-shrink-0" />
              <span className="text-gray-500">Father:</span>
              <span className="font-semibold text-gray-800">{student.fatherName || "—"}</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone size={13} className="text-gray-400 flex-shrink-0" />
              <span className="text-gray-500">Phone:</span>
              <span className="font-semibold text-gray-800">{student.phone || "—"}</span>
            </p>
            <p className="flex items-center gap-2">
              <Mail size={13} className="text-gray-400 flex-shrink-0" />
              <span className="text-gray-500">Email:</span>
              <span className="font-semibold text-gray-800 truncate">{student.email || "—"}</span>
            </p>
          </div>
        </div>

        {/* DIVIDER */}
        <hr className="border-gray-100" />

        {/* COURSE INFO — inline labels, no boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          {[
            { label: "Course", value: student.course },
            { label: "Stream", value: student.stream },
            { label: "Batch", value: student.batch },
            { label: "Session", value: student.session },
          ].map(({ label, value }) => (
            <div key={label}>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{label}</span>
              <p className="font-semibold text-gray-800 mt-0.5 truncate text-xs">{value || "—"}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onView}
          className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg text-sm flex justify-center items-center gap-2 transition-colors"
        >
          View Application <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default ApplicationCard;
