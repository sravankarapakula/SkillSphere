import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HiOutlineBriefcase } from "react-icons/hi2";
import * as gigApi from "../../api/gigApi";
import BudgetRange from "../../components/gigs/BudgetRange";
import SkillTag from "../../components/profile/SkillTag";
import Button from "../../components/shared/Button";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import StatusBadge from "../../components/proposals/StatusBadge";
import { requestDashboardRefresh } from "../../hooks/useDashboardStats";

export default function MyGigsPage() {
    const [gigs, setGigs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [workingId, setWorkingId] = useState("");

    useEffect(() => {
        const loadGigs = async () => {
            try {
                setIsLoading(true);
                const data = await gigApi.getMyGigs();
                setGigs(data.data.gigs);
            } catch (apiError) {
                setError(apiError.response?.data?.message || "Could not load your gigs.");
            } finally {
                setIsLoading(false);
            }
        };

        loadGigs();
    }, []);

    const changeStatus = async (gig) => {
        try {
            setWorkingId(gig._id);
            const nextStatus = gig.status === "open" ? "closed" : "open";
            const data = await gigApi.updateGig(gig._id, { status: nextStatus });
            setGigs((current) =>
                current.map((item) => (item._id === gig._id ? data.data.gig : item))
            );
            requestDashboardRefresh();
        } catch (apiError) {
            setError(apiError.response?.data?.message || "Could not update gig.");
        } finally {
            setWorkingId("");
        }
    };

    const removeGig = async (gig) => {
        if (!window.confirm(`Delete "${gig.title}"?`)) return;

        try {
            setWorkingId(gig._id);
            await gigApi.deleteGig(gig._id);
            setGigs((current) => current.filter((item) => item._id !== gig._id));
            requestDashboardRefresh();
        } catch (apiError) {
            setError(apiError.response?.data?.message || "Could not delete gig.");
        } finally {
            setWorkingId("");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-primary-600">Client Workspace</p>
                    <h1 className="text-2xl font-bold text-surface-900 mt-1">My Gigs</h1>
                </div>
                <Link to="/dashboard/gigs/create">
                    <Button>Create Gig</Button>
                </Link>
            </div>

            {isLoading && <LoadingSpinner size="lg" className="py-20" />}

            {error && (
                <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            {!isLoading && gigs.length === 0 && (
                <div className="bg-white border border-surface-200 rounded-xl py-16 px-6 text-center">
                    <HiOutlineBriefcase className="h-10 w-10 mx-auto text-surface-300" />
                    <h2 className="text-lg font-bold text-surface-900 mt-4">No gigs yet</h2>
                    <p className="text-sm text-surface-500 mt-2">
                        Publish the first project freelancers can propose on.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {gigs.map((gig) => (
                    <article key={gig._id} className="bg-white border border-surface-200 rounded-xl p-5 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <Link
                                    to={`/dashboard/gigs/${gig._id}`}
                                    className="text-lg font-bold text-surface-900 hover:text-primary-700"
                                >
                                    {gig.title}
                                </Link>
                                <p className="text-sm text-surface-500 mt-1">
                                    <BudgetRange min={gig.budgetMin} max={gig.budgetMax} />
                                </p>
                            </div>
                            <StatusBadge status={gig.status} />
                        </div>

                        <p className="text-sm text-surface-600 line-clamp-2">{gig.description}</p>

                        <div className="flex flex-wrap gap-2">
                            {gig.skillsRequired.map((skill) => (
                                <SkillTag key={skill} skill={skill} readOnly />
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2 border-t border-surface-100">
                            <Link to={`/dashboard/gigs/${gig._id}/proposals`}>
                                <Button size="sm" variant="secondary">View Proposals</Button>
                            </Link>
                            <Button
                                size="sm"
                                variant="outline"
                                isLoading={workingId === gig._id}
                                onClick={() => changeStatus(gig)}
                            >
                                {gig.status === "open" ? "Close" : "Reopen"}
                            </Button>
                            <Button
                                size="sm"
                                variant="danger"
                                disabled={workingId === gig._id}
                                onClick={() => removeGig(gig)}
                            >
                                Delete
                            </Button>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}
