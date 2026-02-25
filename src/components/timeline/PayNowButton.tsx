import { useEffect, useRef, useState } from "react";
import { IndianRupee, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { viewStageSetup, resolveTxnAmount } from "../../services/paymentService";
import { useRazorpay } from "../../hooks/useRazorpay";

interface Props {
  stage: any;
  student: any;
  onPaymentSuccess?: () => void;
}

const PayNowButton = ({ stage, student, onPaymentSuccess }: Props) => {
  const [stageSetup, setStageSetup] = useState<any | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const { payNow, loading, status, paymentResult, error, resetPayment } = useRazorpay();

  // ── Fetch stage payment details on mount ────────────────────────────────────
  useEffect(() => {
    if (!stage?._id) return;
    viewStageSetup(stage._id)
      .then((res) => setStageSetup(res.data))
      .catch((e) => setFetchError(e?.message ?? "Failed to load payment details."));
  }, [stage._id]);

  // ── Notify parent on success (fired only once per payment) ─────────────────
  const successCalledRef = useRef(false);
  useEffect(() => {
    if (status === "success" && !successCalledRef.current) {
      successCalledRef.current = true;
      onPaymentSuccess?.();
    }
    if (status !== "success") {
      // Reset guard when status moves away from success (e.g. resetPayment)
      successCalledRef.current = false;
    }
  }, [status, onPaymentSuccess]);

  // Nothing to pay — calculate from txnMapping or fallback
  const resolved = stageSetup ? resolveTxnAmount(stageSetup, student) : null;
  const amount: number = resolved?.amount ?? 0;

  // Hide button if stage is loaded but nothing to pay
  if (fetchError || (stageSetup && amount <= 0)) return null;

  // ── Success state ────────────────────────────────────────────────────────────
  if (status === "success" && paymentResult) {
    return (
      <div className="mt-4 flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
        <div className="text-sm">
          <p className="font-semibold text-emerald-800">Payment Successful!</p>
          <p className="text-emerald-700 mt-0.5">
            ₹{paymentResult.paidAmount} paid · Receipt: <span className="font-mono font-medium">{paymentResult.receiptNo}</span>
          </p>
          <button
            onClick={resetPayment}
            className="mt-2 text-xs text-emerald-600 underline"
          >
            Make another payment
          </button>
        </div>
      </div>
    );
  }

  // ── Failed state ─────────────────────────────────────────────────────────────
  if (status === "failed") {
    return (
      <div className="mt-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
        <XCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
        <div className="text-sm">
          <p className="font-semibold text-red-800">Payment Failed</p>
          <p className="text-red-700 mt-0.5">{error ?? "Something went wrong. Please try again."}</p>
          <button
            onClick={resetPayment}
            className="mt-2 text-xs text-red-600 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // ── Pay Now button ───────────────────────────────────────────────────────────
  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      {/* Amount breakdown (if stage setup is loaded) */}
      {stageSetup && amount > 0 && (
        <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
          <IndianRupee size={14} className="text-orange-500 shrink-0" />
          <span>
            Amount due for <span className="font-semibold text-gray-800">{stage.stage}</span>:{" "}
            <span className="font-bold text-orange-600 text-base">₹{amount}</span>
          </span>
        </div>
      )}

      <button
        disabled={loading || !stageSetup || amount <= 0}
        onClick={() => payNow(stage, student, stageSetup)}
        className="
          w-full flex items-center justify-center gap-2
          bg-orange-500 hover:bg-orange-600
          disabled:bg-gray-300 disabled:cursor-not-allowed
          text-white font-semibold text-sm
          px-5 py-3 rounded-xl
          transition-all duration-200 shadow-sm
        "
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Processing…
          </>
        ) : !stageSetup ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Loading payment…
          </>
        ) : (
          <>
            <IndianRupee size={16} />
            Pay ₹{amount} Now
          </>
        )}
      </button>

      <p className="mt-2 text-center text-[11px] text-gray-400">
        Secured by Razorpay · UPI, Cards, Net Banking accepted
      </p>
    </div>
  );
};

export default PayNowButton;
