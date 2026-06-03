import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchMyProfile } from "../../redux/slices/profileSlice";
import ProfileCompletionBar from "../../components/profile/ProfileCompletionBar";
import SkillTag from "../../components/profile/SkillTag";
import PortfolioCard from "../../components/profile/PortfolioCard";
import ExperienceCard from "../../components/profile/ExperienceCard";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import Button from "../../components/shared/Button";
import {
    HiOutlineMapPin,
    HiOutlineCurrencyDollar,
    HiOutlineSignal,
    HiOutlinePencilSquare,
    HiOutlineDocumentText,
    HiOutlineStar
} from "react-icons/hi2";
import StarRating from "../../components/reviews/StarRating";
import { viewFileInNewTab } from "../../utils/downloadHelper";

export default function ProfilePage() {
    const dispatch = useDispatch();
    const { profile, isLoading } = useSelector((state) => state.profile);
    const { user } = useSelector((state) => state.auth);
    const targetUser = profile?.user || user;

    useEffect(() => {
        dispatch(fetchMyProfile());
    }, [dispatch]);

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="max-w-2xl mx-auto text-center py-20 animate-fade-in">
                <div className="h-20 w-20 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-6">
                    <HiOutlinePencilSquare className="h-10 w-10 text-primary-400" />
                </div>
                <h2 className="text-2xl font-bold text-surface-900 mb-3">
                    Set Up Your Profile
                </h2>
                <p className="text-surface-500 mb-8 max-w-md mx-auto">
                    Create your freelancer profile to start showcasing your skills and attracting clients.
                </p>
                <Link to="/dashboard/profile/edit">
                    <Button size="lg">Create Profile</Button>
                </Link>
            </div>
        );
    }

    const availabilityColors = {
        available: "bg-emerald-100 text-emerald-700",
        busy: "bg-amber-100 text-amber-700",
        unavailable: "bg-red-100 text-red-700"
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-surface-900">My Profile</h1>
                <Link to="/dashboard/profile/edit">
                    <Button variant="secondary" size="sm">
                        <HiOutlinePencilSquare className="h-4 w-4" />
                        Edit Profile
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column */}
                <div className="space-y-6">
                    {/* Avatar + basic info */}
                    <div className="bg-white rounded-xl border border-surface-200 p-6 text-center">
                        <div className="h-24 w-24 rounded-full mx-auto mb-4 overflow-hidden bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                            {profile.profileImage ? (
                                <img
                                    src={profile.profileImage}
                                    alt={user?.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span className="text-3xl font-bold text-white">
                                    {user?.name?.[0]?.toUpperCase() || "U"}
                                </span>
                            )}
                        </div>
                        <h2 className="text-lg font-bold text-surface-900">
                            {user?.name}
                        </h2>
                        <p className="text-sm text-primary-600 font-medium mt-1">
                            {profile.title || "No title set"}
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs">
                            {profile.location && (
                                <span className="flex items-center gap-1 text-surface-500">
                                    <HiOutlineMapPin className="h-3.5 w-3.5" />
                                    {profile.location}
                                </span>
                            )}
                            {profile.hourlyRate > 0 && (
                                <span className="flex items-center gap-1 text-surface-500">
                                    <HiOutlineCurrencyDollar className="h-3.5 w-3.5" />
                                    ${profile.hourlyRate}/hr
                                </span>
                            )}
                            <span
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                                    availabilityColors[profile.availability] || ""
                                }`}
                            >
                                <HiOutlineSignal className="h-3 w-3" />
                                {profile.availability}
                            </span>
                        </div>
                    </div>

                    {/* Reputation */}
                    {((targetUser?.freelancerReviewCount > 0) || (targetUser?.clientReviewCount > 0)) && (
                        <div className="bg-white rounded-xl border border-surface-200 p-5 space-y-4">
                            <h3 className="text-sm font-semibold text-surface-800 border-b border-surface-100 pb-2 flex items-center gap-2">
                                <HiOutlineStar className="h-4 w-4 text-amber-500" />
                                Reputation
                            </h3>
                            
                            {targetUser.freelancerReviewCount > 0 && (
                                <div className="space-y-1">
                                    <span className="text-xs text-surface-400 font-bold uppercase tracking-wider block">
                                        Freelancer Rating
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <StarRating rating={targetUser.freelancerRating || 0} size="md" />
                                        <span className="text-xs text-surface-500 font-medium">
                                            {targetUser.freelancerRating ? targetUser.freelancerRating.toFixed(1) : "0.0"} ({targetUser.freelancerReviewCount} review{targetUser.freelancerReviewCount !== 1 ? "s" : ""})
                                            {targetUser.freelancerCompletedProjects > 0 && ` • ${targetUser.freelancerCompletedProjects} completed project${targetUser.freelancerCompletedProjects !== 1 ? "s" : ""}`}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {targetUser.clientReviewCount > 0 && (
                                <div className="space-y-1">
                                    <span className="text-xs text-surface-400 font-bold uppercase tracking-wider block">
                                        Client Rating
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <StarRating rating={targetUser.clientRating || 0} size="md" />
                                        <span className="text-xs text-surface-500 font-medium">
                                            {targetUser.clientRating ? targetUser.clientRating.toFixed(1) : "0.0"} ({targetUser.clientReviewCount} review{targetUser.clientReviewCount !== 1 ? "s" : ""})
                                            {targetUser.clientCompletedProjects > 0 && ` • ${targetUser.clientCompletedProjects} completed project${targetUser.clientCompletedProjects !== 1 ? "s" : ""}`}
                                        </span>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}

                    {/* Completion */}
                    <ProfileCompletionBar score={profile.completionScore} />

                    {/* Resume */}
                    {profile.resume && (
                        <div className="bg-white rounded-xl border border-surface-200 p-5">
                            <h3 className="text-sm font-semibold text-surface-800 mb-3">
                                Resume
                            </h3>
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    viewFileInNewTab(profile.resume, "application/pdf");
                                }}
                                className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                            >
                                <HiOutlineDocumentText className="h-4 w-4" />
                                View Resume
                            </a>
                        </div>
                    )}
                </div>

                {/* Right column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Bio */}
                    {profile.bio && (
                        <div className="bg-white rounded-xl border border-surface-200 p-6">
                            <h3 className="text-sm font-semibold text-surface-800 mb-3">
                                About
                            </h3>
                            <p className="text-sm text-surface-600 leading-relaxed whitespace-pre-wrap">
                                {profile.bio}
                            </p>
                        </div>
                    )}

                    {/* Skills */}
                    {profile.skills.length > 0 && (
                        <div className="bg-white rounded-xl border border-surface-200 p-6">
                            <h3 className="text-sm font-semibold text-surface-800 mb-3">
                                Skills
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.skills.map((skill) => (
                                    <SkillTag key={skill} skill={skill} readOnly />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Experience */}
                    {profile.experience.length > 0 && (
                        <div className="bg-white rounded-xl border border-surface-200 p-6">
                            <h3 className="text-sm font-semibold text-surface-800 mb-4">
                                Experience
                            </h3>
                            <div>
                                {profile.experience.map((exp, i) => (
                                    <ExperienceCard key={i} exp={exp} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Portfolio */}
                    {profile.portfolio.length > 0 && (
                        <div className="bg-white rounded-xl border border-surface-200 p-6">
                            <h3 className="text-sm font-semibold text-surface-800 mb-4">
                                Portfolio
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {profile.portfolio.map((item) => (
                                    <PortfolioCard
                                        key={item._id}
                                        item={item}
                                        readOnly
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
