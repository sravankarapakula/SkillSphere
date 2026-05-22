import { Link, useLocation } from "react-router-dom";
import { HiOutlineMapPin } from "react-icons/hi2";
import BudgetRange from "./BudgetRange";
import SkillTag from "../profile/SkillTag";

export default function GigCard({ gig }) {
    const location = useLocation();

    return (
        <article className="bg-white border border-surface-200 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <Link
                        to={`/dashboard/gigs/${gig._id}`}
                        state={{ from: `${location.pathname}${location.search}` }}
                        className="text-lg font-bold text-surface-900 hover:text-primary-700"
                    >
                        {gig.title}
                    </Link>
                    <p className="text-sm text-surface-500 mt-1">
                        Posted by {gig.client?.name || "Client"}
                    </p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${
                    gig.status === "open"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-surface-100 text-surface-600"
                }`}>
                    {gig.status}
                </span>
            </div>

            <p className="text-sm text-surface-600 leading-relaxed line-clamp-3">
                {gig.description}
            </p>

            <div className="flex flex-wrap gap-2">
                {gig.skillsRequired.map((skill) => (
                    <SkillTag key={skill} skill={skill} readOnly />
                ))}
            </div>

            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-surface-100 text-sm">
                <BudgetRange min={gig.budgetMin} max={gig.budgetMax} />
                <div className="flex items-center gap-3 text-surface-500">
                    {gig.location && (
                        <span className="inline-flex items-center gap-1">
                            <HiOutlineMapPin className="h-4 w-4" />
                            {gig.location}
                        </span>
                    )}
                    <span className="capitalize">{gig.experienceLevel}</span>
                </div>
            </div>
        </article>
    );
}
