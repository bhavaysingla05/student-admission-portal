import React, { useReducer, useEffect, useRef } from "react";
import { sendOtp, verifyOtp, portalLogin } from "../services/authService";
import toast from "react-hot-toast";
import {
  GraduationCap,
  Laptop,
  FileText,
  PenLine,
  ClipboardList,
  Monitor,
  BookOpenCheck,
} from "lucide-react";

type State = {
  step: "mobile" | "otp";
  mobile: string;
  otp: string;
  loading: boolean;
  timer: number;
};

const initialState: State = {
  step: "mobile",
  mobile: "",
  otp: "",
  loading: false,
  timer: 30,
};

function reducer(state: State, action: Partial<State>) {
  return { ...state, ...action };
}

export default function Login() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    if (state.step === "otp" && state.timer > 0) {
      const t = setInterval(() => {
        dispatch({ timer: state.timer - 1 });
      }, 1000);
      return () => clearInterval(t);
    }
  }, [state.step, state.timer]);

  /* ---------------- AUTO FOCUS FIRST OTP INPUT ---------------- */
  useEffect(() => {
    if (state.step === "otp") {
      otpRefs.current[0]?.focus();
    }
  }, [state.step]);

  /* ---------------- SEND OTP ---------------- */
  const handleSendOtp = async () => {
    if (state.mobile.length !== 10) {
      return toast.error("Enter valid 10-digit number");
    }

    dispatch({ loading: true });

    try {
      await sendOtp(state.mobile);
      toast.success("OTP Sent");
      dispatch({ step: "otp", loading: false, timer: 30 });
    } catch {
      toast.error("Failed to send OTP");
      dispatch({ loading: false });
    }
  };

  /* ---------------- VERIFY OTP ---------------- */
  const handleVerifyOtp = async () => {
    if (state.otp.length !== 6) {
      return toast.error("Enter 6-digit OTP");
    }

    try {
      dispatch({ loading: true });

      const res = await verifyOtp(state.mobile, state.otp);

      console.log("✅ OTP VERIFY RESPONSE:", res);

      const data = res?.data || res;

      // ✅ 1. Store USER (Guest) data
      sessionStorage.setItem(
        "userProfile",
        JSON.stringify({
          name: data.name || "User",
          email: data.email || "",
          phone: state.mobile, // Ensure mobile is stored for admission list search
        })
      );

      // ✅ 2. Perform PORTAL LOGIN (Background) to get Master Token
      console.log("🔄 Attempting Portal Login...");
      const portalRes = await portalLogin();
      console.log("✅ PORTAL LOGIN SUCCESS:", portalRes);

      const token = portalRes?.token;
      if (!token) {
        throw new Error("No token received from Portal Login");
      }

      // ✅ 3. Store Master Token
      sessionStorage.setItem("authToken", token);
      sessionStorage.setItem("isLoggedIn", "true");

      toast.success("Login Successful");

      setTimeout(() => {
        window.location.replace("/dashboard");
      }, 600);
    } catch (err) {
      toast.error("Invalid OTP or verification failed");
    } finally {
      dispatch({ loading: false });
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-[Lato] bg-white relative overflow-hidden">

      {/* ================= LEFT PANEL (60%) ================= */}
      <div className="hidden md:flex w-full md:w-3/5 bg-[#FFF7ED] flex-col justify-center px-8 lg:px-16 border-r border-orange-100 relative overflow-hidden">

        {/* 🎨 Scattered Icons */}
        <GraduationCap size={250} className="absolute top-2 left-8 opacity-[0.06] text-[#F68B1E]" />
        <Laptop size={200} className="absolute top-10 right-10 opacity-[0.06] text-[#F68B1E]" />
        <ClipboardList size={180} className="absolute bottom-20 left-20 opacity-[0.06] text-[#F68B1E]" />
        <FileText size={220} className="absolute bottom-4 right-24 opacity-[0.06] text-[#F68B1E]" />

        {/* LOGO + TEXT */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-10 relative">
          <img src="/logo.png" alt="OkieDokie" className="w-20 sm:w-28 h-auto" />
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#F68B1E] leading-tight">
              Welcome to Okie Dokie
              <br /> Admission Portal
            </h1>
            <p className="text-gray-700 mt-2 text-sm sm:text-base lg:text-lg max-w-md">
              Track & manage your admission status and process with ease.
            </p>
          </div>
        </div>
      </div>

      {/* ================= RIGHT PANEL (40%) ================= */}
      <div className="w-full md:w-2/5 flex items-center justify-center px-4 sm:px-6 md:px-10 py-8 sm:py-12 relative overflow-hidden">

        {/* Background Icons */}
        <Monitor size={150} className="absolute top-10 right-5 opacity-[0.04] text-[#F68B1E] hidden sm:block" />
        <PenLine size={150} className="absolute bottom-10 left-6 opacity-[0.04] text-[#F68B1E] hidden sm:block" />
        <BookOpenCheck size={140} className="absolute top-1/2 right-10 -translate-y-1/2 opacity-[0.05] text-[#F68B1E] hidden sm:block" />

        <div className="max-w-md w-full relative z-10">
          <div className="overflow-hidden relative min-h-[280px] sm:h-[300px]">

            {/* MOBILE INPUT */}
            <div
              className={`absolute w-full transition-all duration-500 ${state.step === "mobile"
                ? "translate-x-0"
                : "-translate-x-[120%]"
                }`}
            >
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-[#F68B1E]">
                Login
              </h2>

              <label className="block text-gray-700 font-medium mb-1 text-sm sm:text-base">
                Mobile Number
              </label>
              <input
                type="tel"
                maxLength={10}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-xl bg-[#FFF9F3] border-[#FFD8B4] focus:ring-2 focus:ring-[#F68B1E] text-sm sm:text-base"
                placeholder="Enter registered mobile"
                onChange={(e) =>
                  dispatch({ mobile: e.target.value })
                }
              />

              <button
                onClick={handleSendOtp}
                disabled={state.loading}
                className="w-full py-2.5 sm:py-3 mt-4 sm:mt-6 text-white bg-[#F68B1E] hover:bg-[#d97706] rounded-xl font-semibold text-sm sm:text-base"
              >
                {state.loading ? "Sending..." : "Send OTP"}
              </button>
            </div>

            {/* OTP INPUT */}
            <div
              className={`absolute w-full transition-all duration-500 ${state.step === "otp"
                ? "translate-x-0"
                : "translate-x-[120%]"
                }`}
            >
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-[#F68B1E]">
                Verify OTP
              </h2>

              <div className="flex gap-1.5 sm:gap-2 justify-center">
                {Array.from({ length: 6 }).map((_, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    maxLength={1}
                    type="text"
                    inputMode="numeric"
                    value={state.otp[i] || ""}
                    className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl border border-orange-300 rounded-xl bg-[#FFF9F3] focus:ring-2 focus:ring-[#F68B1E] focus:border-[#F68B1E]"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!/^[0-9]?$/.test(val)) return;

                      const newOtp =
                        state.otp.slice(0, i) +
                        val +
                        state.otp.slice(i + 1);
                      dispatch({ otp: newOtp });

                      // Move to next input if digit entered
                      if (val && i < 5) {
                        otpRefs.current[i + 1]?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      // Handle backspace
                      if (e.key === "Backspace" && !state.otp[i] && i > 0) {
                        otpRefs.current[i - 1]?.focus();
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pastedData = e.clipboardData
                        .getData("text")
                        .slice(0, 6)
                        .replace(/\D/g, "");
                      if (pastedData.length > 0) {
                        dispatch({ otp: pastedData });
                        const nextIndex = Math.min(pastedData.length, 5);
                        otpRefs.current[nextIndex]?.focus();
                      }
                    }}
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={state.loading}
                className="w-full py-2.5 sm:py-3 mt-4 sm:mt-6 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm sm:text-base"
              >
                Verify OTP
              </button>

              <div className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-gray-600">
                Resend OTP in {state.timer}s
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="absolute bottom-2 w-full text-center text-xs sm:text-sm text-gray-600 px-4">
        Crafted with ❤️ by OkieDokie
      </footer>
    </div>
  );
}
