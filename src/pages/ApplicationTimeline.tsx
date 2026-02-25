import { useCallback, useEffect, useState } from "react";
import Header from "../components/Header";
import Timeline from "../components/timeline/Timeline";
import { getStudentById } from "../services/studentService";
import { getAdmissionStages } from "../services/stageService";
import { saveAdmissionApplication } from "../services/admissionService";
import FooterTabs from "../components/FooterTabs";
import toast from "react-hot-toast";

const ApplicationTimeline = () => {
  const [student, setStudent] = useState<any>(null);
  const [stages, setStages] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [studentRes, stageRes] = await Promise.all([
        getStudentById(),
        getAdmissionStages(),
      ]);
      setStudent(studentRes.data);
      setStages(stageRes.data);
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStudentRefresh = useCallback(() => {
    // Re-fetch student after a successful payment to update PaymentSummary
    getStudentById().then((res) => setStudent(res.data)).catch(console.error);
  }, []);

  const handleFieldChange = (key: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Construct payload by merging current student and unsaved formData
      const payload = { ...student, ...formData };

      await saveAdmissionApplication(payload);

      // ✅ Re-fetch instead of just merging locally to ensure ERP consistency
      const freshRes = await getStudentById();
      setStudent(freshRes.data);
      setFormData({});

      toast.success("Saved successfully");
    } catch (e) {
      console.error(e);
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !student)
    return (
      <div className="min-h-screen bg-gray-100 pb-24">
        <Header />
        <div className="flex justify-center items-center h-[60vh]"><div className="loader" /></div>
        <FooterTabs />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <Header studentName={student.name} />

      <div className="page-enter max-w-5xl mx-auto p-4 sm:p-6">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
          Application Timeline
        </h1>

        <Timeline
          stages={stages}
          student={student}
          formData={formData}
          onChange={handleFieldChange}
          onSave={handleSave}
          saving={saving}
          onStudentRefresh={handleStudentRefresh}
        />
      </div>

      <FooterTabs />
    </div>
  );
};

export default ApplicationTimeline;
