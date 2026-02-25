import axios from "axios";

const BASE_API_URL = "https://api.odpay.in/api";

const getAuthToken = () => {
    return sessionStorage.getItem("authToken") || "";
};

/**
 * Advanced 3-step document upload flow
 * @param file The file object
 * @param studentId The student's database ID
 * @param fieldName The name of the field (e.g. "photo", "marksheet10")
 * @returns The final response or public URL
 */
export const uploadDocument = async (file: File, studentId: string, fieldName: string) => {
    const token = getAuthToken();

    // Step 1: Get Presigned URL
    const presignedRes = await axios.post(`${BASE_API_URL}/getPresignedUrl?qac=LV`, {
        filename: file.name,
        fileType: file.type,
        fieldName: fieldName
    }, {
        headers: {
            Authorization: token
        }
    });

    const { uploadURL, publicURL } = presignedRes.data;

    // Step 2: Direct S3 Upload (PUT)
    await axios.put(uploadURL, file, {
        headers: {
            "Content-Type": file.type
        }
    });

    // Step 3: Notify ERP / Save Document
    const finalData:any = new FormData();
    let formData = {
        presignedKey: true,
        [fieldName]: publicURL
    }
    // finalData.append("id", studentId);
    // finalData.append("qac", "LV");
    // finalData.append("presignedKey", true);
    // finalData.append(fieldName, publicURL);

    const saveRes = await axios.post(`${BASE_API_URL}/uploadAdmissionDocuments?id=${studentId}&qac=LV`, formData, {
        headers: {
            Authorization: token
        }
    });

    return { publicURL, data: saveRes.data };
};

/**
 * Legacy upload helper (kept for compatibility if needed)
 */
export const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post("https://api.odpay.in/api/image/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return res.data;
};
