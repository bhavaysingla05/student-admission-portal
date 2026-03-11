import { useState, useCallback } from "react";
import {
  getEntityForERP,
  recentPaymentCheck,
  initiateTxn,
  processPayment,
  viewStageSetup,
  resolveTxnAmount,
  ERP_ENTITY_ID,
} from "../services/paymentService";

declare const Razorpay: any;

export interface PaymentResult {
  paidAmount: number;
  receiptNo: string;
}

type PaymentStatus = "idle" | "loading" | "success" | "failed";

// ─── Load Razorpay SDK dynamically ───────────────────────────────────────────
const loadRazorpayScript = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if (document.getElementById("razorpay-sdk")) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(script);
  });

// ─── Round up amount to 2 decimal places ─────────────────────────────────────
const roundUp = (amount: number): number => {
  if (!amount || isNaN(amount)) return 0;
  return amount % 1 !== 0
    ? Number((Math.ceil(amount * 100) / 100).toFixed(2))
    : amount;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useRazorpay = () => {
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetPayment = useCallback(() => {
    setStatus("idle");
    setPaymentResult(null);
    setError(null);
  }, []);

  const payNow = useCallback(
    async (stage: any, student: any, preloadedStageSetup?: any, overrideAmount?: number) => {
      setStatus("loading");
      setError(null);
      setPaymentResult(null);

      try {
        // ── Step 1: Load SDK ──────────────────────────────────────────────
        await loadRazorpayScript();

        // ── Step 2: Fetch stage payment details (use preloaded if available) ──
        const stageSetupRes = preloadedStageSetup
          ? { data: preloadedStageSetup }
          : await viewStageSetup(stage._id);
        const stageSetup = stageSetupRes.data;

        // ── Resolve amount by comparing course+stream in txnMapping ──────────
        let { amount: totalPaybleAmount, receipt } = resolveTxnAmount(
          stageSetup,
          student
        );

        if (overrideAmount !== undefined && overrideAmount !== null) {
          totalPaybleAmount = overrideAmount;
          let pool = overrideAmount;
          // Distribute the total edited amount sequentially (top-down)
          for (let i = 0; i < receipt.length; i++) {
            if (i === receipt.length - 1) {
              receipt[i].paidAmount = pool; // Final head takes whatever's left
            } else {
              const take = Math.min(pool, receipt[i].paidAmount);
              receipt[i].paidAmount = take;
              pool -= take;
            }
          }
        }

        const resolvedAmount = roundUp(totalPaybleAmount);

        if (resolvedAmount <= 0) {
          setError("No payment required for this stage.");
          setStatus("failed");
          return;
        }

        // ── Step 3: Resolve ODPay entity ID ───────────────────────────────
        const entityRes = await getEntityForERP(ERP_ENTITY_ID);
        const odPayEntityId: string = entityRes._id;

        // ── Step 4: Check for recent pending payment ───────────────────────
        const recentRes = await recentPaymentCheck(
          odPayEntityId,
          student.applicationNumber,
          resolvedAmount
        );

        if (recentRes.count > 0) {
          const proceed = window.confirm(
            "A recent payment may already be in progress. If payment was deducted from your bank, please do not pay again. Proceed anyway?"
          );
          if (!proceed) {
            setStatus("idle");
            return;
          }
        }

        // ── Step 5: Determine gateway & payment mode ──────────────────────
        const paymentGateway: string = "razorpay";
        const paymentMode = "upi"; // default; can be expanded later

        // ── Step 6: Initiate transaction ──────────────────────────────────
        const txnRes = await initiateTxn({
          odPayEntityId,
          enrollmentNumber: student.applicationNumber,
          name: student.name,
          meta: {
            "course": student.course,
            "installment": "For Admission Purpose",
            "installmentData": null,
            "lateFine": 0
          },
          amount: resolvedAmount,
          paymentGateway,
          paymentMode,
          receiptArr: receipt,
          remark: "",
          session: student.session,
        });

        // ── Step 8: Open Razorpay popup ───────────────────────────────────
        const profile = (() => {
          try { return JSON.parse(sessionStorage.getItem("userProfile") || "{}"); }
          catch { return {}; }
        })();

        await new Promise<void>((resolve, reject) => {
          let handlerCalled = false; // ← guard: prevent duplicate processPayment calls
          const options: any = {
            key: txnRes.key,
            amount: txnRes.amount,
            currency: "INR",
            name: student.name,
            description: `Admission Fee — ${stage.stage} — ${student.applicationNumber}`,
            order_id: txnRes.id,
            modal: { escape: false },
            prefill: {
              name: student.name,
              email: profile.email || "",
              contact: profile.phone || student.phone || "",
              method: paymentMode,
            },
            theme: { color: "#F97316" }, // orange-500
            handler: async (response: any) => {
              if (handlerCalled) return;   // ← guard: fire at most once
              handlerCalled = true;
              try {
                // ── Step 9: Capture payment ───────────────────────────────
                const captureRes = await processPayment(response, paymentGateway);
                setPaymentResult({
                  paidAmount: roundUp(captureRes.data?.paidAmount ?? resolvedAmount),
                  receiptNo: captureRes.data?.name ?? "",
                });
                setStatus("success");
                resolve();
              } catch (captureErr: any) {
                setError(captureErr?.message ?? "Payment capture failed.");
                setStatus("failed");
                reject(captureErr);
              }
            },
          };

          const rzp = new Razorpay(options);
          rzp.on("payment.failed", (resp: any) => {
            setError(resp?.error?.description ?? "Payment failed.");
            setStatus("failed");
            reject(new Error(resp?.error?.description));
          });
          rzp.open();
        });
      } catch (err: any) {
        console.error("Razorpay payment error:", err);
        setError(err?.message ?? "Something went wrong. Please try again.");
        setStatus("failed");
      }
    },
    []
  );

  return {
    payNow,
    loading: status === "loading",
    status,
    paymentResult,
    error,
    resetPayment,
  };
};
