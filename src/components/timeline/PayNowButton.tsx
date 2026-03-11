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
  const [editableAmount, setEditableAmount] = useState<string>("");

  const { payNow, loading, status, paymentResult, error, resetPayment } = useRazorpay();

  // ── Resolve amount by comparing course+stream in txnMapping ──────────
  const resolved = stageSetup ? resolveTxnAmount(stageSetup, student) : null;
  const initialAmount: number = resolved?.amount ?? 0;

  // ── Check if amount is editable ──────────────────────────────────────────
  // User wants to edit even if multiple heads exist.
  const norm = (s: string) => s?.trim().toLowerCase() ?? "";
  const match = stageSetup?.txnMapping?.find(
    (m: any) =>
      norm(m.course) === norm(student.course) &&
      norm(m.stream) === norm(student.stream)
  );
  const isEditable = match?.amountEditable;

  // ── Fetch stage payment details on mount ────────────────────────────────────
  useEffect(() => {
    if (!stage?._id) return;
    viewStageSetup(stage._id)
      .then((res) => setStageSetup(res.data))
      .catch((e) => setFetchError(e?.message ?? "Failed to load payment details."));
  }, [stage._id]);

  // ── Sync editableAmount with resolved amount ──────────────────────────────
  useEffect(() => {
    if (initialAmount > 0) {
      setEditableAmount(initialAmount.toString());
    }
  }, [initialAmount]);

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

  const currentAmount = isEditable ? parseFloat(editableAmount) || 0 : initialAmount;

  // Check if already paid
  const isAlreadyPaid = student?.transactions?.some(
    (tx: any) =>
      tx.status?.toLowerCase() === "confirmed" &&
      tx.stage?.trim().toLowerCase() === stage.stage?.trim().toLowerCase()
  );

  // Hide button if stage is loaded but nothing to pay, OR if already paid
  if (fetchError || isAlreadyPaid || (stageSetup && initialAmount <= 0)) return null;

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
  const isTooSmall = currentAmount < 1000;
  const isTooLarge = currentAmount > initialAmount;
  const isAmountValid = !isTooSmall && !isTooLarge;

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      {/* Amount breakdown (if stage setup is loaded) */}
      {stageSetup && initialAmount > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <IndianRupee size={14} className="text-orange-500 shrink-0" />
              <span>
                Total for <span className="font-semibold text-gray-800">{stage.stage}</span>
              </span>
            </div>

            {isEditable ? (
              <div className="relative max-w-[140px]">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-orange-600 font-bold text-base">₹</span>
                <input
                  type="number"
                  value={editableAmount}
                  onChange={(e) => setEditableAmount(e.target.value)}
                  placeholder="0"
                  className={`
                    w-full pl-6 pr-3 py-1 bg-orange-50/30 border-2 
                    ${!isAmountValid ? 'border-red-200 focus:border-red-500 focus:ring-red-500/10' : 'border-orange-100 focus:border-orange-500 focus:ring-orange-500/10'}
                    rounded-lg font-bold text-orange-600 text-lg text-right
                    focus:bg-white focus:outline-none focus:ring-4
                    transition-all duration-200
                  `}
                />
              </div>
            ) : (
              <span className="font-bold text-orange-600 text-lg">₹{initialAmount}</span>
            )}
          </div>

          {isEditable && (
            <div className="mt-1 flex justify-between items-center px-1">
              {isTooSmall && (
                <span className="text-[11px] text-red-500 font-medium">Min. ₹1,000 required</span>
              )}
              {isTooLarge && (
                <span className="text-[11px] text-red-500 font-medium">Max. ₹{initialAmount.toLocaleString()} allowed</span>
              )}
              {initialAmount !== currentAmount && (
                <button 
                  onClick={() => setEditableAmount(initialAmount.toString())}
                  className="ml-auto text-[11px] text-orange-500 hover:text-orange-600 font-semibold"
                >
                  Reset
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <button
        disabled={loading || !stageSetup || currentAmount <= 0 || !isAmountValid}
        onClick={() => payNow(stage, student, stageSetup, isEditable ? currentAmount : undefined)}
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
            Pay ₹{currentAmount} Now
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
