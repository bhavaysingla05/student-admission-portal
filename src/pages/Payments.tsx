import { useEffect, useState } from "react";
import Header from "../components/Header";
import FooterTabs from "../components/FooterTabs";
import { listAdmissionStudents } from "../services/admissionListService";
import { CreditCard, Calendar, IndianRupee } from "lucide-react";

const statusColor: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-100",
  success: "bg-emerald-50 text-emerald-700 border-emerald-100",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  failed: "bg-red-50 text-red-700 border-red-100",
};

const Payments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const res = await listAdmissionStudents();
        const applications = res.data?.data || [];

        const flattenedPayments = applications.flatMap((app: any) =>
          (app.transactions || []).map((txn: any) => ({
            studentName: app.name,
            applicationNumber: app.applicationNumber,
            stage: txn.stage,
            receiptId: txn.receiptId,
            amount: txn.totalPaidAmount,
            status: txn.status,
            date: txn.date,
            applicationId: app._id,
          }))
        );

        setPayments(flattenedPayments);
      } catch (e) {
        console.error("❌ Payment load error", e);
      } finally {
        setLoading(false);
      }
    };
    loadPayments();
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen pb-20 sm:pb-24">
      <Header studentName="Payments" />

      <div className="page-enter max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
        {/* Title */}
        <div className="flex items-center gap-2 pt-2">
          <CreditCard className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Payment History</h2>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center h-[40vh]">
            <div className="loader" />
          </div>
        )}

        {/* Empty */}
        {!loading && payments.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[40vh] text-gray-400">
            <CreditCard size={40} strokeWidth={1.2} />
            <p className="mt-2 text-sm">No payment records found.</p>
          </div>
        )}

        {/* Cards */}
        {!loading && payments.length > 0 && (
          <div className="space-y-3">
            {payments.map((p, i) => {
              const colorClass =
                statusColor[(p.status || "").toLowerCase()] ||
                "bg-gray-50 text-gray-600 border-gray-100";

              return (
                <div
                  key={i}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 card-hover"
                >
                  {/* Top row: Amount + Status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <IndianRupee size={16} className="text-emerald-600" />
                      <span className="text-lg font-bold text-gray-900">
                        ₹{p.amount}
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}>
                      {p.status}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-[11px] text-gray-400 uppercase tracking-wide">Student</span>
                      <p className="font-medium text-gray-800">{p.studentName}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-400 uppercase tracking-wide">Stage</span>
                      <p className="font-medium text-gray-800">{p.stage}</p>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                      <Calendar size={13} className="text-gray-400" />
                      <span className="text-gray-600">
                        {new Date(p.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <FooterTabs />
    </div>
  );
};

export default Payments;
