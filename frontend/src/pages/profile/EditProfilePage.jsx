import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
    fetchMyProfile,
    updateProfile,
    uploadImage,
    uploadResume,
    resetProfile
} from "../../redux/slices/profileSlice";
import SkillInput from "../../components/profile/SkillInput";
import FileUpload from "../../components/profile/FileUpload";
import Button from "../../components/shared/Button";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import toast from "react-hot-toast";
import { HiOutlineArrowLeft } from "react-icons/hi2";

export default function EditProfilePage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { profile, isLoading, isSuccess, isError, message } = useSelector(
        (state) => state.profile
    );

    const [formData, setFormData] = useState({
        title: "",
        bio: "",
        skills: [],
        hourlyRate: "",
        availability: "available",
        location: "",
        experience: []
    });

    const [newExperience, setNewExperience] = useState({
        company: "",
        role: "",
        startDate: "",
        endDate: "",
        description: ""
    });

    // Load profile on mount
    useEffect(() => {
        dispatch(fetchMyProfile());
    }, [dispatch]);

    // Populate form when profile loads
    useEffect(() => {
        if (profile) {
            setFormData({
                title: profile.title || "",
                bio: profile.bio || "",
                skills: profile.skills || [],
                hourlyRate: profile.hourlyRate || "",
                availability: profile.availability || "available",
                location: profile.location || "",
                experience: profile.experience || []
            });
        }
    }, [profile]);

    // Toast on success/error
    useEffect(() => {
        if (isSuccess && message) {
            toast.success(message);
            dispatch(resetProfile());
        }
        if (isError && message) {
            toast.error(message);
            dispatch(resetProfile());
        }
    }, [isSuccess, isError, message, dispatch]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddSkill = (skill) => {
        setFormData((prev) => ({
            ...prev,
            skills: [...prev.skills, skill]
        }));
    };

    const handleRemoveSkill = (skillToRemove) => {
        setFormData((prev) => ({
            ...prev,
            skills: prev.skills.filter((s) => s !== skillToRemove)
        }));
    };

    const handleAddExperience = () => {
        if (!newExperience.company || !newExperience.role || !newExperience.startDate) {
            toast.error("Company, role, and start date are required");
            return;
        }
        setFormData((prev) => ({
            ...prev,
            experience: [...prev.experience, { ...newExperience }]
        }));
        setNewExperience({
            company: "",
            role: "",
            startDate: "",
            endDate: "",
            description: ""
        });
    };

    const handleRemoveExperience = (index) => {
        setFormData((prev) => ({
            ...prev,
            experience: prev.experience.filter((_, i) => i !== index)
        }));
    };

    const handleImageUpload = (file) => {
        const fd = new FormData();
        fd.append("profileImage", file);
        dispatch(uploadImage(fd));
    };

    const handleResumeUpload = (file) => {
        const fd = new FormData();
        fd.append("resume", file);
        dispatch(uploadResume(fd));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const submitData = {
            ...formData,
            hourlyRate: Number(formData.hourlyRate) || 0
        };
        dispatch(updateProfile(submitData));
    };

    if (isLoading && !profile) {
        return (
            <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate("/dashboard/profile")}
                    className="p-2 rounded-lg hover:bg-surface-100 text-surface-600 transition cursor-pointer"
                >
                    <HiOutlineArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-2xl font-bold text-surface-900">
                    Edit Profile
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Image */}
                <div className="bg-white rounded-xl border border-surface-200 p-6">
                    <h3 className="text-sm font-semibold text-surface-800 mb-4">
                        Profile Photo
                    </h3>
                    <div className="flex items-center gap-6">
                        <div className="h-20 w-20 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-accent-500 flex-shrink-0 flex items-center justify-center">
                            {profile?.profileImage ? (
                                <img
                                    src={profile.profileImage}
                                    alt="Profile"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span className="text-2xl font-bold text-white">?</span>
                            )}
                        </div>
                        <FileUpload
                            accept="image/*"
                            onChange={handleImageUpload}
                            currentFile={profile?.profileImage}
                            hint="JPG, PNG or WebP. Max 5MB"
                        />
                    </div>
                </div>

                {/* Basic Info */}
                <div className="bg-white rounded-xl border border-surface-200 p-6 space-y-4">
                    <h3 className="text-sm font-semibold text-surface-800 mb-2">
                        Basic Information
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-surface-700 mb-1.5">
                            Professional Title
                        </label>
                        <input
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g. Full Stack Developer"
                            className="w-full rounded-xl border border-surface-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-surface-700 mb-1.5">
                            Bio
                        </label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Tell clients about yourself, your experience, and what you're passionate about..."
                            className="w-full rounded-xl border border-surface-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1.5">
                                Location
                            </label>
                            <input
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="e.g. San Francisco, CA"
                                className="w-full rounded-xl border border-surface-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1.5">
                                Hourly Rate ($)
                            </label>
                            <input
                                name="hourlyRate"
                                type="number"
                                min="0"
                                value={formData.hourlyRate}
                                onChange={handleChange}
                                placeholder="50"
                                className="w-full rounded-xl border border-surface-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-surface-700 mb-1.5">
                            Availability
                        </label>
                        <select
                            name="availability"
                            value={formData.availability}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-surface-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition bg-white cursor-pointer"
                        >
                            <option value="available">Available</option>
                            <option value="busy">Busy</option>
                            <option value="unavailable">Unavailable</option>
                        </select>
                    </div>
                </div>

                {/* Skills */}
                <div className="bg-white rounded-xl border border-surface-200 p-6">
                    <h3 className="text-sm font-semibold text-surface-800 mb-4">
                        Skills
                    </h3>
                    <SkillInput
                        skills={formData.skills}
                        onAdd={handleAddSkill}
                        onRemove={handleRemoveSkill}
                    />
                </div>

                {/* Experience */}
                <div className="bg-white rounded-xl border border-surface-200 p-6">
                    <h3 className="text-sm font-semibold text-surface-800 mb-4">
                        Experience
                    </h3>

                    {/* Existing experiences */}
                    {formData.experience.length > 0 && (
                        <div className="space-y-3 mb-6">
                            {formData.experience.map((exp, i) => (
                                <div
                                    key={i}
                                    className="flex items-start justify-between bg-surface-50 rounded-lg p-3 border border-surface-200"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-surface-800">
                                            {exp.role}
                                        </p>
                                        <p className="text-xs text-surface-500">
                                            {exp.company}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveExperience(i)}
                                        className="text-xs text-danger hover:text-red-600 font-medium cursor-pointer"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add new experience */}
                    <div className="space-y-3 p-4 border border-dashed border-surface-300 rounded-xl bg-surface-50">
                        <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
                            Add Experience
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                                value={newExperience.company}
                                onChange={(e) =>
                                    setNewExperience((p) => ({
                                        ...p,
                                        company: e.target.value
                                    }))
                                }
                                placeholder="Company"
                                className="rounded-lg border border-surface-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            />
                            <input
                                value={newExperience.role}
                                onChange={(e) =>
                                    setNewExperience((p) => ({
                                        ...p,
                                        role: e.target.value
                                    }))
                                }
                                placeholder="Role"
                                className="rounded-lg border border-surface-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            />
                            <input
                                type="date"
                                value={newExperience.startDate}
                                onChange={(e) =>
                                    setNewExperience((p) => ({
                                        ...p,
                                        startDate: e.target.value
                                    }))
                                }
                                className="rounded-lg border border-surface-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            />
                            <input
                                type="date"
                                value={newExperience.endDate}
                                onChange={(e) =>
                                    setNewExperience((p) => ({
                                        ...p,
                                        endDate: e.target.value
                                    }))
                                }
                                placeholder="End Date (optional)"
                                className="rounded-lg border border-surface-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            />
                        </div>
                        <textarea
                            value={newExperience.description}
                            onChange={(e) =>
                                setNewExperience((p) => ({
                                    ...p,
                                    description: e.target.value
                                }))
                            }
                            placeholder="Description (optional)"
                            rows={2}
                            className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                        />
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={handleAddExperience}
                        >
                            + Add Experience
                        </Button>
                    </div>
                </div>

                {/* Resume */}
                <div className="bg-white rounded-xl border border-surface-200 p-6">
                    <h3 className="text-sm font-semibold text-surface-800 mb-4">
                        Resume
                    </h3>
                    <FileUpload
                        accept=".pdf"
                        onChange={handleResumeUpload}
                        currentFile={profile?.resume}
                        hint="PDF only. Max 10MB"
                    />
                </div>

                {/* Submit */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate("/dashboard/profile")}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        Save Profile
                    </Button>
                </div>
            </form>
        </div>
    );
}
