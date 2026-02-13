import API from "./api";

export const getAdmissionStages = () => {
  console.log("📞 Calling stages API");
  return API.get(
    // "/list/admissionStageSetup?entity=5e95a8d3eac1df35dd2d007f&session=2022-23" ayushtesting
    // "/list/admissionStageSetup?entity=5ea049ea774faa5d67505aac&session=2025-26%20Odd" timt
    "/list/admissionStageSetup?entity=698c2eed0ddb62000fef6822&session=2026-27%20Odd"
  );
};
