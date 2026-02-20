import { useEffect, useState } from "react";
import Header from "../components/Header";
import FooterTabs from "../components/FooterTabs";

/* ---- UTILITIES ---- */
const formatLabel = (key: string) =>
  key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());

const formatValue = (value: any) => {
  if (!value) return "—";
  return String(value);
};

/* ---- COMPONENT ---- */
const Profile = () => {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("userProfile");
      if (stored) setStudent(JSON.parse(stored));
      else setStudent(null);
    } catch (e) {
      console.error("Failed to read profile from sessionStorage", e);
      setStudent(null);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 pb-20 sm:pb-24">
        <Header />
        <div className="flex justify-center items-center h-[60vh]">
          <div className="loader" />
        </div>
        <FooterTabs />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-100 pb-20 sm:pb-24">
        <Header />
        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
          <p className="text-sm">No profile data found</p>
        </div>
        <FooterTabs />
      </div>
    );
  }

  // Initials avatar
  const initials = (student.name || "S")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Profile fields to display
  const profileFields = ["name", "phone", "email"].filter(
    (k) => student[k]
  );

  return (
    <div className="min-h-screen bg-gray-100 pb-20 sm:pb-24">
      <Header studentName={student.name || "Student"} />

      <div className="page-enter max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Avatar + Name hero */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xl font-bold mb-3">
            {initials}
          </div>
          <h1 className="text-xl font-bold text-gray-900">{student.name}</h1>
          {student.email && (
            <p className="text-sm text-gray-500 mt-0.5">{student.email}</p>
          )}
        </div>

        {/* Details card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Personal Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {profileFields.map((key) => (
              <div
                key={key}
                className="flex flex-col gap-0.5 bg-gray-50 rounded-lg px-4 py-3"
              >
                <span className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">
                  {formatLabel(key)}
                </span>
                <span className="font-medium text-gray-900">
                  {formatValue(student[key])}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <FooterTabs />
    </div>
  );
};

export default Profile;
