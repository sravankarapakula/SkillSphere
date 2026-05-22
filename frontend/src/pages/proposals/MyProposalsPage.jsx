import { useEffect, useState } from "react";
import { HiOutlineDocumentText } from "react-icons/hi2";
import * as proposalApi from "../../api/proposalApi";
import ProposalCard from "../../components/proposals/ProposalCard";
import LoadingSpinner from "../../components/shared/LoadingSpinner";

export default function MyProposalsPage() {
    const [proposals, setProposals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadProposals = async () => {
            try {
                setIsLoading(true);
                const data = await proposalApi.getMyProposals();
                setProposals(data.data.proposals);
            } catch (apiError) {
                setError(apiError.response?.data?.message || "Could not load proposals.");
            } finally {
                setIsLoading(false);
            }
        };

        loadProposals();
    }, []);

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <p className="text-sm font-medium text-primary-600">Freelancer Bids</p>
                <h1 className="text-2xl font-bold text-surface-900 mt-1">My Proposals</h1>
            </div>

            {isLoading && <LoadingSpinner size="lg" className="py-20" />}

            {error && (
                <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            {!isLoading && !error && proposals.length === 0 && (
                <div className="bg-white border border-surface-200 rounded-xl py-16 px-6 text-center">
                    <HiOutlineDocumentText className="h-10 w-10 mx-auto text-surface-300" />
                    <h2 className="text-lg font-bold text-surface-900 mt-4">No proposals sent</h2>
                    <p className="text-sm text-surface-500 mt-2">
                        Browse open gigs and submit a focused bid.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {proposals.map((proposal) => (
                    <ProposalCard key={proposal._id} proposal={proposal} />
                ))}
            </div>
        </div>
    );
}
