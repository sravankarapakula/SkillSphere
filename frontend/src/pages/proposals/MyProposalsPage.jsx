import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { HiOutlineDocumentText } from "react-icons/hi2";
import * as proposalApi from "../../api/proposalApi";
import * as messageApi from "../../api/messageApi";
import ProposalCard from "../../components/proposals/ProposalCard";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import Button from "../../components/shared/Button";
import { setActiveConversation, addNewConversation } from "../../redux/slices/messageSlice";

export default function MyProposalsPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [proposals, setProposals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [workingId, setWorkingId] = useState("");
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

    const handleOpenDiscussion = async (proposalId) => {
        try {
            setWorkingId(proposalId);
            const data = await messageApi.createConversation(proposalId);
            const conversation = data.data.conversation;
            
            dispatch(addNewConversation(conversation));
            dispatch(setActiveConversation(conversation._id));
            
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
                    <ProposalCard
                        key={proposal._id}
                        proposal={proposal}
                        actions={
                            proposal.status === "discussion" ? (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    isLoading={workingId === proposal._id}
                                    onClick={() => handleOpenDiscussion(proposal._id)}
                                >
                                    Chat with Client
                                </Button>
                            ) : null
                        }
                    />
                ))}
            </div>
        </div>
    );
}
