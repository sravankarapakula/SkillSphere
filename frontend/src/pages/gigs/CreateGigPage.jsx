import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SkillInput from "../../components/profile/SkillInput";
import Button from "../../components/shared/Button";
import * as gigApi from "../../api/gigApi";
import { requestDashboardRefresh } from "../../hooks/useDashboardStats";

const initialForm = {
    title: "",
    description: "",
    skillsRequired: [],
    budgetMin: "",
    budgetMax: "",
    location: "",
    experienceLevel: "entry"
};

export default function CreateGigPage() {
    const [form, setForm] = useState(initialForm);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const update = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
        setError("");
    };

    const submit = async (event) => {
        event.preventDefault();

        if (!form.title.trim() || !form.description.trim()) {
            setError("Title and description are required.");
            return;
        }

        if (Number(form.budgetMax) < Number(form.budgetMin)) {
            setError("Maximum budget must be at least minimum budget.");
            return;
        }

        try {
            setIsLoading(true);
            const data = await gigApi.createGig({
                ...form,
                budgetMin: Number(form.budgetMin),
                budgetMax: Number(form.budgetMax)
            });
            requestDashboardRefresh();
            navigate(`/dashboard/gigs/${data.data.gig._id}`);
        } catch (apiError) {
            setError(apiError.response?.data?.message || "Could not create gig.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div>
                <p className="text-sm font-medium text-primary-600">Client Gig</p>
                <h1 className="text-2xl font-bold text-surface-900 mt-1">Create Gig</h1>
            </div>

            <form onSubmit={submit} className="bg-white border border-surface-200 rounded-xl p-6 space-y-5">
                <Field label="Title">
                    <input
                        name="title"
                        value={form.title}
                        onChange={update}
                        placeholder="Build a marketing dashboard"
                        className="form-input"
                    />
                </Field>

                <Field label="Description">
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={update}
                        rows={6}
                        placeholder="Describe the work, deliverables, and context."
                        className="form-input resize-none"
                    />
                </Field>

                <Field label="Skills Required">
                    <SkillInput
                        skills={form.skillsRequired}
                        onAdd={(skill) =>
                            setForm((current) => ({
                                ...current,
                                skillsRequired: [...current.skillsRequired, skill]
                            }))
                        }
                        onRemove={(skill) =>
                            setForm((current) => ({
                                ...current,
                                skillsRequired: current.skillsRequired.filter((item) => item !== skill)
                            }))
                        }
                    />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Minimum Budget">
                        <input
                            name="budgetMin"
                            type="number"
                            min="0"
                            value={form.budgetMin}
                            onChange={update}
                            placeholder="500"
                            className="form-input"
                        />
                    </Field>
                    <Field label="Maximum Budget">
                        <input
                            name="budgetMax"
                            type="number"
                            min="0"
                            value={form.budgetMax}
                            onChange={update}
                            placeholder="1500"
                            className="form-input"
                        />
                    </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Location">
                        <input
                            name="location"
                            value={form.location}
                            onChange={update}
                            placeholder="Remote"
                            className="form-input"
                        />
                    </Field>
                    <Field label="Experience Level">
                        <select
                            name="experienceLevel"
                            value={form.experienceLevel}
                            onChange={update}
                            className="form-input bg-white"
                        >
                            <option value="entry">Entry</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="expert">Expert</option>
                        </select>
                    </Field>
                </div>

                {error && (
                    <p className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                        {error}
                    </p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="secondary" onClick={() => navigate("/dashboard/gigs/my")}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        Publish Gig
                    </Button>
                </div>
            </form>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <label className="block">
            <span className="field-label">{label}</span>
            {children}
        </label>
    );
}
