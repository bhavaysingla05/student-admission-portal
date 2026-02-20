import { useEffect, useState } from "react";
import { listAdmissionStudents } from "../services/admissionListService";
import Header from "../components/Header";
import ApplicationCard from "../components/ApplicationCard";
import FooterTabs from "../components/FooterTabs";

const Dashboard = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await listAdmissionStudents();
        const list = res.data?.data || [];
        setStudents(list);
      } catch (err: any) {
        console.error("❌ Admission list API failed:", err);
        setError(err?.response?.data?.message || "Failed to load applications");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleViewApplication = (student: any) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("selectedStudentId", student._id);
    }
    window.location.href = "/application/timeline";
  };

  const firstName = students[0]?.name || "Student";

  return (
    <div className="bg-gray-100 min-h-screen pb-20 sm:pb-24">
      <Header studentName={firstName} />

      <div className="page-enter max-w-5xl mx-auto px-3 sm:px-4 py-4 space-y-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900">My Applications</h2>
          <p className="text-xs text-gray-500">
            {loading
              ? "Loading..."
              : `${students.length} application${students.length !== 1 ? "s" : ""} found`}
          </p>
        </div>

        {loading && (
          <div className="flex justify-center items-center h-[40vh]">
            <div className="loader" />
          </div>
        )}

        {error && !loading && (
          <div className="flex justify-center items-center h-[40vh]">
            <div className="text-center">
              <p className="text-red-500 font-medium">{error}</p>
              <button onClick={() => window.location.reload()} className="mt-3 text-sm text-orange-600 hover:underline">
                Try again
              </button>
            </div>
          </div>
        )}

        {!loading && !error && students.map((student) => (
          <ApplicationCard
            key={student._id}
            student={student}
            onView={() => handleViewApplication(student)}
          />
        ))}
      </div>
      <FooterTabs />
    </div>
  );
};

export default Dashboard;
