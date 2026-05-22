import BudgetRange from "../gigs/BudgetRange";
import StatusBadge from "./StatusBadge";

export default function ProposalCard({ proposal, actions }) {
    return (
        <article className="bg-white border border-surface-200 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="font-bold text-surface-900">
                        {proposal.gig?.title || proposal.freelancer?.name || "Proposal"}
                    </h3>
                    {proposal.freelancer && (
                        <p className="text-sm text-surface-500 mt-1">
                            {proposal.freelancer.name} · {proposal.freelancer.email}
                        </p>
                    )}
                </div>
                <StatusBadge status={proposal.status} />
            </div>

            <p className="text-sm text-surface-600 whitespace-pre-wrap">
                {proposal.coverLetter}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-surface-600">
                <span>
                    Bid <strong className="text-surface-900">${Number(proposal.bidAmount).toLocaleString()}</strong>
                </span>
                <span>
                    Delivery <strong className="text-surface-900">{proposal.estimatedDays} days</strong>
                </span>
                {proposal.gig?.budgetMin !== undefined && (
                    <span>
                        Gig budget <BudgetRange min={proposal.gig.budgetMin} max={proposal.gig.budgetMax} />
                    </span>
                )}
            </div>

            {actions && <div className="flex flex-wrap gap-2 pt-1">{actions}</div>}
        </article>
    );
}
