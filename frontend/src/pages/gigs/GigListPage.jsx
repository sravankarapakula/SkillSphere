import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { HiOutlineBriefcase } from "react-icons/hi2";
import { useSelector } from "react-redux";
import * as gigApi from "../../api/gigApi";
import GigCard from "../../components/gigs/GigCard";
import GigFilters from "../../components/gigs/GigFilters";
import Button from "../../components/shared/Button";
import LoadingSpinner from "../../components/shared/LoadingSpinner";

const emptyFilters = {
    keyword: "",
    skills: "",
    minBudget: "",
    maxBudget: "",
    location: "",
    experienceLevel: ""
};

export default function GigListPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [gigs, setGigs] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const { user } = useSelector((state) => state.auth);

    const filters = Object.keys(emptyFilters).reduce((current, key) => {
        current[key] = searchParams.get(key) || "";
        return current;
    }, {});
    const page = Number(searchParams.get("page") || 1);

    useEffect(() => {
        const loadGigs = async () => {
            try {
                setIsLoading(true);
                setError("");
                const data = await gigApi.getGigs(Object.fromEntries(searchParams));
                setGigs(data.data.gigs);
                setPagination(data.data.pagination);
            } catch (apiError) {
                setError(apiError.response?.data?.message || "Could not load gigs.");
            } finally {
                setIsLoading(false);
            }
        };

        loadGigs();
    }, [searchParams]);

    const setFilters = (nextFilters) => {
        const next = new URLSearchParams();

        Object.entries(nextFilters).forEach(([key, value]) => {
            if (String(value).trim()) {
                next.set(key, String(value).trim());
            }
        });

        setSearchParams(next);
    };

    const changePage = (nextPage) => {
        const next = new URLSearchParams(searchParams);
        next.set("page", nextPage);
        setSearchParams(next);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-primary-600">Marketplace</p>
                    <h1 className="text-2xl font-bold text-surface-900 mt-1">
                        Browse Gigs
                    </h1>
                    <p className="text-sm text-surface-500 mt-2">
                        Search open client work by skill, budget, and experience.
                    </p>
                </div>
                {user?.role === "client" && (
                    <Link to="/dashboard/gigs/create">
                        <Button>Create Gig</Button>
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-6">
                <GigFilters
                    key={searchParams.toString()}
                    filters={filters}
                    onApply={setFilters}
                    onClear={() => setFilters(emptyFilters)}
                />

                <section className="space-y-4">
                    {isLoading && (
                        <div className="bg-white border border-surface-200 rounded-xl py-20">
                            <LoadingSpinner size="lg" />
                        </div>
                    )}

                    {!isLoading && error && (
                        <div className="rounded-xl bg-red-50 border border-red-100 p-5 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {!isLoading && !error && gigs.length === 0 && (
                        <div className="bg-white border border-surface-200 rounded-xl py-16 px-6 text-center">
                            <div className="h-14 w-14 mx-auto rounded-xl bg-surface-100 flex items-center justify-center">
                                <HiOutlineBriefcase className="h-7 w-7 text-surface-400" />
                            </div>
                            <h2 className="text-lg font-bold text-surface-900 mt-4">
                                No gigs found
                            </h2>
                            <p className="text-sm text-surface-500 mt-2">
                                Try broader filters or clear the search to see new work.
                            </p>
                        </div>
                    )}

                    {!isLoading && gigs.length > 0 && (
                        <>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                {gigs.map((gig) => (
                                    <GigCard key={gig._id} gig={gig} />
                                ))}
                            </div>
                            {pagination?.pages > 1 && (
                                <div className="flex items-center justify-between bg-white border border-surface-200 rounded-xl px-4 py-3">
                                    <p className="text-sm text-surface-500">
                                        Page {pagination.page} of {pagination.pages}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            disabled={page <= 1}
                                            onClick={() => changePage(page - 1)}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            disabled={page >= pagination.pages}
                                            onClick={() => changePage(page + 1)}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}
