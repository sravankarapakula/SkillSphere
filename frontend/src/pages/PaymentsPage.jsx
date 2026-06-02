import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyPayments } from "../redux/slices/paymentSlice";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import { HiOutlineCreditCard, HiOutlineArrowUpRight, HiOutlineArrowDownLeft } from "react-icons/hi2";

export default function PaymentsPage() {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { payments, loading, error } = useSelector((state) => state.payment || { payments: [], loading: false, error: null });

    useEffect(() => {
        dispatch(fetchMyPayments());
    }, [dispatch]);

    if (loading && payments.length === 0) {
        return <LoadingSpinner size="lg" className="py-20" />;
    }

    const isClient = user?.role === "client";
    const isFreelancer = user?.role === "freelancer";
    const isAdmin = user?.role === "admin";

    // Summary stats
    const successfulPayments = payments.filter((p) => p.status === "completed");
    const totalAmount = successfulPayments.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Banner Section */}
            <div className="bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl p-6 md:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-xl md:text-3xl font-extrabold flex items-center gap-3">
                        <HiOutlineCreditCard className="h-8 w-8" />
                        {isAdmin ? "Transactions Ledger" : isClient ? "My Payments Ledger" : "My Earnings Ledger"}
                    </h1>
                    <p className="text-primary-100 text-sm font-medium">
                        {isAdmin
                            ? "View, monitor and audit all platform payments."
                            : isClient
                            ? "Keep track of payments made for your marketplace projects."
                            : "Keep track of earnings received from completed projects."}
                    </p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 min-w-[200px] border border-white/10 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-primary-200 uppercase font-bold tracking-wider">
                            {isAdmin ? "Platform Volume" : isClient ? "Total Outflow" : "Total Earnings"}
                        </p>
                        <p className="text-2xl font-black mt-1">₹{totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                        {isClient ? <HiOutlineArrowUpRight className="h-5 w-5 text-white" /> : <HiOutlineArrowDownLeft className="h-5 w-5 text-white" />}
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-danger/5 border border-danger/10 text-danger text-sm rounded-xl">
                    {error}
                </div>
            )}

            {/* Transactions List */}
            <div className="bg-white border border-surface-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-surface-150 flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-surface-900">
                        {isAdmin ? "All Platform Transactions" : isClient ? "History of Payments" : "History of Earnings"}
                    </h3>
                    <span className="bg-surface-100 text-surface-600 text-xs font-bold px-2.5 py-1 rounded-full">
                        {payments.length} Transaction{payments.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {payments.length === 0 ? (
                    <div className="py-16 text-center space-y-3">
                        <div className="h-12 w-12 bg-surface-50 rounded-full flex items-center justify-center mx-auto text-surface-400">
                            <HiOutlineCreditCard className="h-6 w-6" />
                        </div>
                        <h4 className="text-sm font-bold text-surface-800">No transactions recorded</h4>
                        <p className="text-xs text-surface-500 max-w-[280px] mx-auto">
                            Transactions will appear here as soon as they are processed.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-50 text-[10px] uppercase font-bold text-surface-500 tracking-wider border-b border-surface-150">
                                    <th className="px-6 py-4">Project</th>
                                    {(!isClient || isAdmin) && <th className="px-6 py-4">Client</th>}
                                    {(!isFreelancer || isAdmin) && <th className="px-6 py-4">Freelancer</th>}
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Transaction ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-100 text-sm font-medium text-surface-700">
                                {payments.map((payment) => (
                                    <tr key={payment._id} className="hover:bg-surface-50/50 transition">
                                        <td className="px-6 py-4 max-w-[220px] truncate">
                                            <span className="font-extrabold text-surface-900 block truncate">
                                                {payment.projectId?.gig?.title || "Marketplace Gig Contract"}
                                            </span>
                                            <span className="text-[10px] text-surface-400 truncate block font-mono">
                                                Ref: {payment.projectId?._id || payment.projectId}
                                            </span>
                                        </td>
                                        {(!isClient || isAdmin) && (
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-surface-800 font-semibold">{payment.clientId?.name || "Client"}</span>
                                                </div>
                                            </td>
                                        )}
                                        {(!isFreelancer || isAdmin) && (
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-surface-800 font-semibold">{payment.freelancerId?.name || "Freelancer"}</span>
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 font-bold text-surface-950">
                                            ₹{payment.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                                                payment.status === "completed"
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                    : "bg-danger/5 text-danger border-danger/10"
                                            }`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-surface-500 font-semibold">
                                            {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : new Date(payment.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs select-all max-w-[150px] truncate text-surface-500">
                                            {payment.razorpayPaymentId || payment.razorpayOrderId || "N/A"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
