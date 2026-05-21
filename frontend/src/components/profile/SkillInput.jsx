import { useState } from "react";
import { HiOutlinePlus } from "react-icons/hi2";

export default function SkillInput({ skills, onAdd, onRemove }) {
    const [input, setInput] = useState("");

    const handleAdd = () => {
        const trimmed = input.trim();
        if (trimmed && !skills.includes(trimmed)) {
            onAdd(trimmed);
            setInput("");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. React, Node.js, UI/UX..."
                    className="flex-1 rounded-xl border border-surface-300 px-4 py-2.5 text-sm text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
                />
                <button
                    type="button"
                    onClick={handleAdd}
                    className="px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition flex items-center gap-1.5 text-sm font-medium cursor-pointer"
                >
                    <HiOutlinePlus className="h-4 w-4" />
                    Add
                </button>
            </div>
            {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                        <span
                            key={skill}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 text-sm font-medium rounded-lg border border-primary-200"
                        >
                            {skill}
                            <button
                                type="button"
                                onClick={() => onRemove(skill)}
                                className="hover:bg-primary-200 rounded-full p-0.5 transition cursor-pointer"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
