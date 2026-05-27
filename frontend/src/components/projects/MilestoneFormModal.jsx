import { useEffect, useState } from "react";
import Button from "../shared/Button";

export default function MilestoneFormModal({
    isOpen,
    onClose,
    onSubmit,
    milestone = null,
    isLoading = false,
    remainingBudget = 0,
    totalBudget = 0
}) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [dueTime, setDueTime] = useState("");
    const [errors, setErrors] = useState({});

    // Calculate maximum allowable amount for this milestone
    const currentMilestoneAmount = milestone ? milestone.amount : 0;
    const maxAllowedAmount = remainingBudget + currentMilestoneAmount;

    useEffect(() => {
        if (milestone) {
            setTitle(milestone.title || "");
            setDescription(milestone.description || "");
            setAmount(milestone.amount?.toString() || "");
            
            if (milestone.dueDate) {
                const dateObj = new Date(milestone.dueDate);
                
                // Format YYYY-MM-DD in local time
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                setDueDate(`${year}-${month}-${day}`);
                
                // Format HH:MM in local time
                const hours = String(dateObj.getHours()).padStart(2, '0');
                const minutes = String(dateObj.getMinutes()).padStart(2, '0');
                setDueTime(`${hours}:${minutes}`);
            } else {
                setDueDate("");
                setDueTime("");
            }
        } else {
            setTitle("");
            setDescription("");
            setAmount("");
            setDueDate("");
            setDueTime("");
        }
        setErrors({});
    }, [milestone, isOpen]);

    // Close on Escape key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const validate = () => {
        const newErrors = {};
        if (!title.trim() || title.trim().length < 3) {
            newErrors.title = "Title must be at least 3 characters long.";
        }
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            newErrors.amount = "Amount must be a positive number.";
        } else if (parsedAmount > maxAllowedAmount) {
            newErrors.amount = `Amount cannot exceed the remaining budget of $${maxAllowedAmount.toFixed(2)}.`;
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        let finalDueDate = null;
        if (dueDate) {
            const timePart = dueTime ? dueTime : "23:59";
            const [year, month, day] = dueDate.split("-").map(Number);
            const [hours, minutes] = timePart.split(":").map(Number);
            
            // Create the date in local timezone
            const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
            finalDueDate = localDate.toISOString();
        }

        onSubmit({
            title: title.trim(),
            description: description.trim(),
            amount: parseFloat(amount),
            dueDate: finalDueDate
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm">
            {/* Modal backdrop wrapper to click outside to close */}
            <div className="absolute inset-0" onClick={onClose}></div>

            {/* Modal Card */}
            <div className="relative w-full max-w-lg bg-white border border-surface-200 shadow-2xl rounded-2xl p-6 z-10 transform scale-95 transition-transform duration-300 ease-out">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-surface-900">
                        {milestone ? "Edit Milestone" : "Add Milestone"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-surface-400 hover:text-surface-600 transition-colors p-1.5 hover:bg-surface-50 rounded-lg cursor-pointer"
                        aria-label="Close modal"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-surface-700 mb-1.5" htmlFor="milestone-title">
                            Milestone Title <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            id="milestone-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Design Wireframes"
                            className={`w-full px-4 py-2.5 bg-surface-55 border rounded-xl text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all ${
                                errors.title ? "border-danger focus:ring-danger" : "border-surface-200"
                            }`}
                        />
                        {errors.title && <p className="text-xs text-danger mt-1 font-medium">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-surface-700 mb-1.5" htmlFor="milestone-description">
                            Description
                        </label>
                        <textarea
                            id="milestone-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe deliverables for this milestone..."
                            rows="3"
                            className="w-full px-4 py-2.5 bg-surface-55 border border-surface-200 rounded-xl text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-semibold text-surface-700 mb-1.5" htmlFor="milestone-amount">
                                Amount ($) <span className="text-danger">*</span>
                            </label>
                            <input
                                type="number"
                                id="milestone-amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                className={`w-full px-4 py-2.5 bg-surface-55 border rounded-xl text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all ${
                                    errors.amount ? "border-danger focus:ring-danger" : "border-surface-200"
                                }`}
                            />
                            <div className="flex justify-between items-center mt-1 text-[11px] font-medium text-surface-500">
                                <span>Max Limit: ${maxAllowedAmount.toFixed(2)}</span>
                                <span>Remaining: ${remainingBudget.toFixed(2)}</span>
                            </div>
                            {errors.amount && <p className="text-xs text-danger mt-1 font-medium">{errors.amount}</p>}
                        </div>

                        {/* Due Date & Time */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-sm font-semibold text-surface-700 mb-1.5" htmlFor="milestone-due-date">
                                    Due Date
                                </label>
                                <input
                                    type="date"
                                    id="milestone-due-date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full px-2 py-2.5 bg-surface-55 border border-surface-200 rounded-xl text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all text-xs"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-surface-700 mb-1.5" htmlFor="milestone-due-time">
                                    Due Time
                                </label>
                                <input
                                    type="time"
                                    id="milestone-due-time"
                                    value={dueTime}
                                    onChange={(e) => setDueTime(e.target.value)}
                                    className="w-full px-2 py-2.5 bg-surface-55 border border-surface-200 rounded-xl text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all text-xs"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-100">
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            disabled={isLoading}
                            className="w-24 rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isLoading}
                            className="px-6 rounded-xl"
                        >
                            {milestone ? "Save Changes" : "Create Milestone"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
