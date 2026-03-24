import StageCard from "./StageCard";
import ApplicationFormCard from "./ApplicationFormCard";

interface Props {
  stages: any[];
  student: any;
  formData: any;
  onChange: (key: string, value: any) => void;
  onSave: () => void;
  saving?: boolean;
  onStudentRefresh?: () => void;
}

const Timeline = ({
  stages,
  student,
  formData,
  onChange,
  onSave,
  saving,
  onStudentRefresh,
}: Props) => {
  const orderedStages = [...stages].sort(
    (a, b) => a.sequence - b.sequence
  );

  const currentStageObj = orderedStages.find(
    (s) => s.stage === student.currentStage
  );

  const currentSeq = currentStageObj?.sequence ?? 0;

  const isApproved = student.currentStage?.toLowerCase() === "approved";

  const enrichedStages = orderedStages.map((stage) => {
    let status: "completed" | "active" | "pending" = "pending";

    if (isApproved) {
      status = "completed";
    } else if (stage.sequence < currentSeq) {
      status = "completed";
    } else if (stage.sequence === currentSeq) {
      status = "active";
    }

    return { ...stage, status };
  });

  return (
    <div className="space-y-6">
      {/* Download Application Form (Always at the top) */}
      <ApplicationFormCard student={student} />

      {enrichedStages.map((stage) => (
        <StageCard
          key={stage._id}
          stage={stage}
          student={student}
          formData={formData}
          onChange={onChange}
          onSave={onSave}
          saving={saving}
          onStudentRefresh={onStudentRefresh}
        />
      ))}
    </div>
  );
};

export default Timeline;
