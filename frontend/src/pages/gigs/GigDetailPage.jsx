import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
    HiOutlineArrowLeft,
    HiOutlineMapPin,
    HiOutlineUserCircle
} from "react-icons/hi2";
import * as gigApi from "../../api/gigApi";
import BudgetRange from "../../components/gigs/BudgetRange";
import SkillTag from "../../components/profile/SkillTag";
import Button from "../../components/shared/Button";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ProposalForm from "../../components/proposals/ProposalForm";
import StatusBadge from "../../components/proposals/StatusBadge";

export default function GigDetailPage() {
    const { gigId } = useParams();
    const location = useLocation();
    const { user } = useSelector((state) => state.auth);
    const [gig, setGig] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [proposalOpen, setProposalOpen] = useState(false);
    const [proposalMessage, setProposalMessage] = useState("");

    useEffect(() => {
        const loadGig = async () => {
            try {
                setIsLoading(true);
                const data = await gigApi.getGig(gigId);
                setGig(data.data.gig);
            } catch (apiError) {
                setError(apiError.response?.data?.message || "Could not load gig.");
            } finally {
                setIsLoading(false);
            }
        };

        loadGig();
    }, [gigId]);

    if (isLoading) {
        return <LoadingSpinner size="lg" className="py-20" />;
    }

    if (error || !gig) {
        return (
            <div className="rounded-xl bg-red-50 border border-red-100 p-5 text-sm text-red-700">
                {error || "Gig not found."}
            </div>
        );
    }

    const backTo = location.state?.from || "/dashboard/projects";
    const isOwner = user?.id === gig.client?._id;

    return (
        <div className="max-w-5xl mx-auto space-y-5 animate-fade-in">
            <Link
                to={backTo}
                className="inline-flex items-center gap-2 text-sm font-medium text-surface-600 hover:text-primary-700"
            >
                <HiOutlineArrowLeft className="h-4 w-4" />
                Back to gigs
            </Link>

            <article className="bg-white border border-surface-200 rounded-xl p-6 lg:p-8 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <StatusBadge status={gig.status} />
                            <span className="rounded-lg bg-surface-100 px-2.5 py-1 text-xs font-semibold capitalize text-surface-600">
                                {gig.experienceLevel}
                            </span>
                        </div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-surface-900">
                            {gig.title}
                        </h1>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-surface-500">Budget</p>
                        <p className="text-xl mt-1">
                            <BudgetRange min={gig.budgetMin} max={gig.budgetMax} />
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <Info icon={HiOutlineUserCircle} label="Client" value={gig.client?.name} />
                    <Info icon={HiOutlineMapPin} label="Location" value={gig.location || "Flexible"} />
                </div>

                <div>
                    <h2 className="text-sm font-semibold text-surface-800 mb-2">Description</h2>
                    <p className="text-sm leading-relaxed text-surface-600 whitespace-pre-wrap">
                        {gig.description}
                    </p>
                </div>

                <div>
                    <h2 className="text-sm font-semibold text-surface-800 mb-3">Skills Required</h2>
                    <div className="flex flex-wrap gap-2">
                        {gig.skillsRequired.map((skill) => (
                            <SkillTag key={skill} skill={skill} readOnly />
                        ))}
                    </div>
                </div>

                {proposalMessage && (
                    <p className="rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
                        {proposalMessage}
                    </p>
                )}

                <div className="flex flex-wrap gap-3 pt-2 border-t border-surface-100">
                    {user?.role === "freelancer" && gig.status === "open" && (
                        <Button onClick={() => setProposalOpen(true)}>
                            Submit Proposal
                        </Button>
                    )}
                    {isOwner && (
                        <Link to={`/dashboard/gigs/${gig._id}/proposals`}>
                            <Button variant="secondary">View Proposals</Button>
                        </Link>
                    )}
                </div>
            </article>

            {proposalOpen && (
                <ProposalForm
                    gig={gig}
                    onClose={() => setProposalOpen(false)}
                    onSubmitted={() => {
                        setProposalOpen(false);
                        setProposalMessage("Proposal submitted. Track it from My Proposals.");
                    }}
                />
            )}
        </div>
    );
}

function Info({ icon: Icon, label, value }) {
    return (
        <div className="rounded-xl bg-surface-50 border border-surface-100 p-4 flex items-center gap-3">
            <Icon className="h-5 w-5 text-primary-600" />
            <div>
                <p className="text-xs text-surface-500">{label}</p>
                <p className="font-semibold text-surface-800 mt-0.5">{value}</p>
            </div>
        </div>
    );
}
