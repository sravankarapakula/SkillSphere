import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { HiOutlineArrowLeft, HiOutlineDocumentText } from "react-icons/hi2";
import * as proposalApi from "../../api/proposalApi";
import * as messageApi from "../../api/messageApi";
import Button from "../../components/shared/Button";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ProposalCard from "../../components/proposals/ProposalCard";
import { requestDashboardRefresh } from "../../hooks/useDashboardStats";
import { setActiveConversation, addNewConversation } from "../../redux/slices/messageSlice";

export default function GigProposalsPage() {
    const { gigId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [gig, setGig] = useState(null);
    const [proposals, setProposals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [workingId, setWorkingId] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const loadProposals = async () => {
            try {
                setIsLoading(true);
                const data = await proposalApi.getGigProposals(gigId);
                setGig(data.data.gig);
                setProposals(data.data.proposals);
            } catch (apiError) {
                setError(apiError.response?.data?.message || "Could not load gig proposals.");
            } finally {
                setIsLoading(false);
            }
        };

        loadProposals();
    }, [gigId]);

    const setStatus = async (proposalId, status) => {
        try {
            setWorkingId(proposalId);
            const data = await proposalApi.updateProposalStatus(proposalId, status);
            setProposals((current) =>
                current.map((proposal) =>
                    proposal._id === proposalId ? data.data.proposal : proposal
                )
            );
            requestDashboardRefresh();
        } catch (apiError) {
            setError(apiError.response?.data?.message || "Could not update proposal.");
        } finally {
            setWorkingId("");
        }
    };

    const handleOpenDiscussion = async (proposalId) => {
        try {
            setWorkingId(proposalId);
            const data = await messageApi.createConversation(proposalId);
            const conversation = data.data.conversation;
            
            dispatch(addNewConversation(conversation));
            dispatch(setActiveConversation(conversation._id));
            
            setProposals((current) =>
                current.map((p) =>
                    p._id === proposalId && p.status === "pending"
                        ? { ...p, status: "discussion" }
                        : p
                )
            );
            
            navigate("/dashboard/messages");
        } catch (apiError) {
            setError(apiError.response?.data?.message || "Could not open discussion.");
        } finally {
            setWorkingId("");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <Link
                    to="/dashboard/gigs/my"
                    className="inline-flex items-center gap-2 text-sm font-medium text-surface-600 hover:text-primary-700 mb-4"
                >
                    <HiOutlineArrowLeft className="h-4 w-4" />
                    Back to my gigs
                </Link>
                <p className="text-sm font-medium text-primary-600">Client Review</p>
                <h1 className="text-2xl font-bold text-surface-900 mt-1">
                    {gig ? `${gig.title} Proposals` : "Gig Proposals"}
                </h1>
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
                    <h2 className="text-lg font-bold text-surface-900 mt-4">No proposals yet</h2>
                    <p className="text-sm text-surface-500 mt-2">
                        New freelancer bids will appear here.
                    </p>
                </div>
            )}

            <div className="space-y-4">
                {proposals.map((proposal) => (
                    <ProposalCard
                        key={proposal._id}
                        proposal={proposal}
                        actions={
                            (["submitted", "shortlisted", "pending", "discussion"].includes(proposal.status)) ? (
                                <div className="flex gap-2 flex-wrap items-center">
                                    <Button
                                        size="sm"
                                        isLoading={workingId === proposal._id}
                                        onClick={() => setStatus(proposal._id, "accepted")}
                                    >
                                        Accept Proposal
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        disabled={workingId === proposal._id}
                                        onClick={() => setStatus(proposal._id, "rejected")}
                                    >
                                        Reject Proposal
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={workingId === proposal._id}
                                        onClick={() => handleOpenDiscussion(proposal._id)}
                                    >
                                        Negotiate
                                    </Button>
                                </div>
                            ) : null
                        }
                    />
                ))}
            </div>
        </div>
    );
}
