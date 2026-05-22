import { useState } from "react";
import { HiOutlineXMark } from "react-icons/hi2";
import Button from "../shared/Button";
import * as proposalApi from "../../api/proposalApi";
import { requestDashboardRefresh } from "../../hooks/useDashboardStats";

export default function ProposalForm({ gig, onClose, onSubmitted }) {
    const [form, setForm] = useState({
        coverLetter: "",
        bidAmount: "",
        estimatedDays: ""
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const update = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
        setError("");
    };

    const submit = async (event) => {
        event.preventDefault();

        if (!form.coverLetter.trim()) {
            setError("Add a cover letter before submitting.");
            return;
        }

        if (Number(form.bidAmount) <= 0 || Number(form.estimatedDays) < 1) {
            setError("Bid amount and estimated days must be valid numbers.");
            return;
        }

        try {
            setIsLoading(true);
            const data = await proposalApi.submitProposal({
                gig: gig._id,
                coverLetter: form.coverLetter,
                bidAmount: Number(form.bidAmount),
                estimatedDays: Number(form.estimatedDays)
            });
            requestDashboardRefresh();
            onSubmitted(data.data.proposal);
        } catch (apiError) {
            setError(apiError.response?.data?.message || "Proposal submission failed.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center">
            <div className="w-full max-w-xl bg-white rounded-xl border border-surface-200 shadow-xl">
                <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-surface-100">
                    <div>
                        <h2 className="text-lg font-bold text-surface-900">Submit Proposal</h2>
                        <p className="text-sm text-surface-500 mt-1">{gig.title}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 cursor-pointer"
                        aria-label="Close proposal form"
                    >
                        <HiOutlineXMark className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={submit} className="p-6 space-y-4">
                    <label className="block">
                        <span className="field-label">Cover letter</span>
                        <textarea
                            name="coverLetter"
                            value={form.coverLetter}
                            onChange={update}
                            rows={5}
                            placeholder="Explain your approach and relevant experience."
                            className="form-input resize-none"
                        />
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="block">
                            <span className="field-label">Bid amount</span>
                            <input
                                name="bidAmount"
                                type="number"
                                min="1"
                                value={form.bidAmount}
                                onChange={update}
                                placeholder="1200"
                                className="form-input"
                            />
                        </label>
                        <label className="block">
                            <span className="field-label">Estimated days</span>
                            <input
                                name="estimatedDays"
                                type="number"
                                min="1"
                                value={form.estimatedDays}
                                onChange={update}
                                placeholder="7"
                                className="form-input"
                            />
                        </label>
                    </div>

                    {error && (
                        <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">
                            {error}
                        </p>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={isLoading}>
                            Submit Proposal
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
