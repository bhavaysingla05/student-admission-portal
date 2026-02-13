import API from "./api";

const ENTITY_ID = "698c2eed0ddb62000fef6822";
const SESSION = "2026-27 Odd";
// Helper to get logged-in user's phone
const getUserMobile = () => {
  try {
    const userProfile = sessionStorage.getItem("userProfile");
    if (!userProfile) return "";
    const parsed = JSON.parse(userProfile);
    return parsed.phone || "";
  } catch (error) {
    console.error("Error parsing user profile:", error);
    return "";
  }
};

// List admission students by phone
export const listAdmissionStudents = () => {
  const mobile = getUserMobile();
  console.log("📞 Calling admission list API (admissionStudentData) for:", mobile);

  return API.post("/list/admissionStudentData", {
    entity: ENTITY_ID,
    session: SESSION,
    search: mobile,
    searchBy: "phone",
    pageNumber: 1,
    pageSize: 10,
  });
};

