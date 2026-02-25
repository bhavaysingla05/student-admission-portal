import React, { useState, useEffect, useRef } from "react";
import { sendOtp, verifyOtp } from "../services/authService";
import toast from "react-hot-toast";
import { X, ShieldCheck, Mail, Phone, Lock, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

interface VerificationItem {
    type: "Father Mobile" | "Mother Mobile" | "Email";
    value: string;
    verified: boolean;
}

interface VerificationGateProps {
    items: VerificationItem[];
    onVerified: (type: string) => void;
    onCancel: () => void;
}

const VerificationGate: React.FC<VerificationGateProps> = ({
    items,
    onVerified,
    onCancel,
}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [step, setStep] = useState<"initial" | "otp">("initial");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(30);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [customValues, setCustomValues] = useState<Record<string, string>>({});

    const currentItem = items[activeIndex];
    const currentValue = customValues[currentItem.type] || currentItem.value || "";

    // Reset step/otp when switching slides
    useEffect(() => {
        setStep("initial");
        setOtp("");
        setTimer(30);
    }, [activeIndex]);

    useEffect(() => {
        if (step === "otp" && timer > 0) {
            const t = setInterval(() => setTimer((prev) => prev - 1), 1000);
            return () => clearInterval(t);
        }
    }, [step, timer]);

    useEffect(() => {
        if (step === "otp") {
            otpRefs.current[0]?.focus();
        }
    }, [step]);

    const handleSendOtp = async () => {
        if (!currentValue) {
            return toast.error(`Please enter ${currentItem.type}`);
        }

        // Basic validation
        if (currentItem.type.includes("Mobile") && !/^\d{10}$/.test(currentValue)) {
            return toast.error("Enter a valid 10-digit mobile number");
        }
        if (currentItem.type === "Email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentValue)) {
            return toast.error("Enter a valid email address");
        }

        setLoading(true);
        try {
            await sendOtp(currentValue);
            toast.success("OTP Sent");
            setStep("otp");
            setTimer(30);
        } catch (err) {
            toast.error("Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) {
            return toast.error("Enter 6-digit OTP");
        }
        setLoading(true);
        try {
            await verifyOtp(currentValue, otp);
            toast.success(`${currentItem.type} Verified Successfully`);
            onVerified(currentItem.type);

            // If there's a next unverified item, move to it after a delay
            const nextIndex = items.findIndex((item, idx) => idx > activeIndex && !item.verified);
            if (nextIndex !== -1) {
                setTimeout(() => setActiveIndex(nextIndex), 1000);
            }
        } catch (err) {
            toast.error("Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        // toast.success(`${currentItem.type} skipped for now`);
        onVerified(currentItem.type);

        // Find next unverified index
        const nextIndex = items.findIndex((item, idx) => idx > activeIndex && !item.verified);
        if (nextIndex !== -1) {
            setActiveIndex(nextIndex);
        }
    };

    const nextSlide = () => {
        setActiveIndex((prev) => (prev + 1) % items.length);
    };

    const prevSlide = () => {
        setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative">

                {/* CAROUSEL NAVIGATION */}
                <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-2 pointer-events-none z-10">
                    <button
                        onClick={prevSlide}
                        className="p-2 bg-white/80 backdrop-blur-sm hover:bg-white text-gray-800 rounded-full shadow-lg pointer-events-auto transition-all hover:scale-110 active:scale-95"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="p-2 bg-white/80 backdrop-blur-sm hover:bg-white text-gray-800 rounded-full shadow-lg pointer-events-auto transition-all hover:scale-110 active:scale-95"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>

                {/* HEADER */}
                <div className="p-6 text-center relative border-b border-gray-100">
                    <button
                        onClick={onCancel}
                        className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-20"
                    >
                        <X size={20} />
                    </button>

                    <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                        {currentItem.type.includes("Mobile") ? <Phone size={32} /> : <Mail size={32} />}
                        {currentItem.verified && (
                            <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1 border-2 border-white">
                                <CheckCircle2 size={16} />
                            </div>
                        )}
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900">Verify {currentItem.type}</h2>
                    <p className="text-gray-500 mt-1 text-sm">
                        {currentItem.verified ? "Successfully Verified" : "Verification is required before editing"}
                    </p>
                </div>

                {/* CONTENT */}
                <div className="p-6 sm:p-8">
                    {currentItem.verified ? (
                        <div className="text-center py-8">
                            <CheckCircle2 className="mx-auto text-green-500 mb-4" size={64} />
                            <p className="text-lg font-bold text-gray-900">This is already verified!</p>
                            <p className="text-gray-500 mt-2">Use the arrows to find pending verifications.</p>
                            <button
                                onClick={nextSlide}
                                className="mt-6 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                            >
                                Next Step →
                            </button>
                        </div>
                    ) : step === "initial" ? (
                        <div className="text-center">
                            <div className={`p-4 rounded-2xl mb-6 flex items-center justify-center gap-3 border transition-all ${!currentValue ? "bg-white border-orange-200 ring-4 ring-orange-50 shadow-inner" : "bg-gray-50 border-gray-100"}`}>
                                {!currentValue ? null : <ShieldCheck className="text-green-500" size={20} />}

                                {!currentValue || (customValues[currentItem.type] !== undefined) ? (
                                    <input
                                        autoFocus
                                        type={currentItem.type === "Email" ? "email" : "tel"}
                                        placeholder={`Enter ${currentItem.type}`}
                                        className="bg-transparent border-none focus:outline-none text-center font-bold text-gray-800 placeholder:text-gray-300 w-full"
                                        value={currentValue}
                                        onChange={(e) => setCustomValues({ ...customValues, [currentItem.type]: e.target.value })}
                                    />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-800 tracking-wide">{currentValue}</span>
                                        <button
                                            onClick={() => setCustomValues({ ...customValues, [currentItem.type]: currentItem.value })}
                                            className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400 transition-colors"
                                            title="Edit"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleSendOtp}
                                disabled={loading || !currentValue}
                                className="w-full py-4 px-6 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 text-white font-bold rounded-2xl transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2 group"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Get OTP
                                        <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleSkip}
                                className="w-full mt-3 py-3 text-orange-600 font-bold text-sm hover:bg-orange-50 rounded-xl transition-all uppercase tracking-wider"
                            >
                                Skip for now
                            </button>

                            <p className="mt-4 text-[11px] text-gray-400 uppercase font-bold tracking-widest text-center">
                                Secure Verification Powered by OkieDokie
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600 mb-6">
                                    Enter the 6-digit code sent to <br />
                                    <span className="font-bold text-gray-900">{currentValue}</span>
                                </p>

                                <div className="flex gap-2 justify-center mb-6">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <input
                                            key={i}
                                            ref={(el) => {
                                                otpRefs.current[i] = el;
                                            }}
                                            maxLength={1}
                                            type="text"
                                            className="w-11 h-11 sm:w-12 sm:h-12 text-center text-xl font-bold border-2 border-gray-100 rounded-xl bg-gray-50 focus:border-orange-500 focus:ring-0 transition-all text-gray-900"
                                            value={otp[i] || ""}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, "");
                                                if (!val && e.target.value !== "") return;

                                                const newOtp = otp.split("");
                                                newOtp[i] = val;
                                                const finalOtp = newOtp.join("");
                                                setOtp(finalOtp);

                                                if (val && i < 5) otpRefs.current[i + 1]?.focus();
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Backspace" && !otp[i] && i > 0) {
                                                    otpRefs.current[i - 1]?.focus();
                                                }
                                            }}
                                        />
                                    ))}
                                </div>

                                <button
                                    onClick={handleVerifyOtp}
                                    disabled={loading || otp.length < 6}
                                    className="w-full py-4 px-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 text-white font-bold rounded-2xl transition-all shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Lock size={18} />
                                            Verify & Proceed
                                        </>
                                    )}
                                </button>

                                <div className="mt-6 flex flex-col items-center gap-2">
                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-orange-500 transition-all duration-1000 ease-linear"
                                            style={{ width: `${(timer / 30) * 100}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between w-full mt-2">
                                        <button
                                            disabled={timer > 0 || loading}
                                            onClick={handleSendOtp}
                                            className="text-xs font-bold text-orange-600 hover:text-orange-700 disabled:text-gray-400 transition-colors uppercase tracking-wider"
                                        >
                                            {timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
                                        </button>
                                        <button
                                            onClick={handleSkip}
                                            className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-wider"
                                        >
                                            Skip for now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* DOTS INDICATOR */}
                <div className="flex justify-center gap-1.5 pb-6">
                    {items.map((it, idx) => (
                        <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeIndex
                                ? "w-6 bg-orange-500"
                                : it.verified
                                    ? "w-2 bg-green-500"
                                    : "w-2 bg-gray-200"
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

const ArrowRight = ({ size, className }: { size: number; className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
);

export default VerificationGate;
