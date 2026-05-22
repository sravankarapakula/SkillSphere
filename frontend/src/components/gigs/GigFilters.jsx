import { useState } from "react";
import Button from "../shared/Button";

const levels = [
    { value: "", label: "Any experience" },
    { value: "entry", label: "Entry" },
    { value: "intermediate", label: "Intermediate" },
    { value: "expert", label: "Expert" }
];

export default function GigFilters({ filters, onApply, onClear }) {
    const [draft, setDraft] = useState(filters);

    const update = (event) => {
        const { name, value } = event.target;
        setDraft((current) => ({ ...current, [name]: value }));
    };

    const submit = (event) => {
        event.preventDefault();
        onApply(draft);
    };

    return (
        <aside className="bg-white border border-surface-200 rounded-xl p-5 h-fit">
            <form onSubmit={submit} className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <h2 className="font-semibold text-surface-900">Filters</h2>
                    <button
                        type="button"
                        onClick={onClear}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 cursor-pointer"
                    >
                        Clear
                    </button>
                </div>

                <Field label="Search">
                    <input
                        name="keyword"
                        value={draft.keyword}
                        onChange={update}
                        placeholder="React dashboard"
                        className="filter-input"
                    />
                </Field>

                <Field label="Skills">
                    <input
                        name="skills"
                        value={draft.skills}
                        onChange={update}
                        placeholder="React, Node.js"
                        className="filter-input"
                    />
                </Field>

                <Field label="Location">
                    <input
                        name="location"
                        value={draft.location}
                        onChange={update}
                        placeholder="Remote or city"
                        className="filter-input"
                    />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                    <Field label="Min budget">
                        <input
                            name="minBudget"
                            type="number"
                            min="0"
                            value={draft.minBudget}
                            onChange={update}
                            placeholder="0"
                            className="filter-input"
                        />
                    </Field>
                    <Field label="Max budget">
                        <input
                            name="maxBudget"
                            type="number"
                            min="0"
                            value={draft.maxBudget}
                            onChange={update}
                            placeholder="5000"
                            className="filter-input"
                        />
                    </Field>
                </div>

                <Field label="Experience">
                    <select
                        name="experienceLevel"
                        value={draft.experienceLevel}
                        onChange={update}
                        className="filter-input bg-white"
                    >
                        {levels.map((level) => (
                            <option key={level.value} value={level.value}>
                                {level.label}
                            </option>
                        ))}
                    </select>
                </Field>

                <Button type="submit" className="w-full">
                    Apply Filters
                </Button>
            </form>
        </aside>
    );
}

function Field({ label, children }) {
    return (
        <label className="block">
            <span className="block text-sm font-medium text-surface-700 mb-1.5">
                {label}
            </span>
            {children}
        </label>
    );
}
