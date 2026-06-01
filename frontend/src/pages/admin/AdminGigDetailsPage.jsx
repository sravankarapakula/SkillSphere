import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../../components/shared/Button";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import * as adminApi from "../../api/adminApi";
import { AdminPageHeader, DetailCard, FieldGrid, ReasonModal, StatusBadge } from "./AdminShared";
import { formatDate, money } from "./adminFormat";

export default function AdminGigDetailsPage() {
    const { gigId } = useParams();
    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    const [reason, setReason] = useState("");
    const [showDisable, setShowDisable] = useState(false);

    useEffect(() => {
        let isMounted = true;

        adminApi.getGigDetails(gigId)
            .then((response) => {
                if (!isMounted) return;
                setData(response.data);
                setError("");
            })
            .catch((apiError) => {
                if (!isMounted) return;
                setError(apiError.response?.data?.message || "Could not load gig");
            });

        return () => {
            isMounted = false;
        };
    }, [gigId]);

    const load = async () => {
        const response = await adminApi.getGigDetails(gigId);
        setData(response.data);
        setError("");
    };

    if (error) return <div className="rounded-xl bg-red-50 border border-red-100 p-5 text-sm text-red-700">{error}</div>;
    if (!data) return <LoadingSpinner size="lg" />;

    const { gig, proposals } = data;
    const disable = async () => {
        await adminApi.disableGig(gig._id, reason);
        toast.success("Gig disabled");
        setShowDisable(false);
        setReason("");
        load();
    };
    const enable = async () => {
        await adminApi.enableGig(gig._id);
        toast.success("Gig enabled");
        load();
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <AdminPageHeader
                eyebrow="Gig Details"
                title={gig.title}
                description={gig.client?.name}
                actions={gig.isDisabled ? <Button variant="secondary" onClick={enable}>Enable Gig</Button> : <Button variant="danger" onClick={() => setShowDisable(true)}>Disable Gig</Button>}
            />
            <DetailCard title="Overview">
                <FieldGrid items={[
                    { label: "Title", value: gig.title },
                    { label: "Client", value: gig.client?.name },
                    { label: "Budget", value: `${money(gig.budgetMin)} - ${money(gig.budgetMax)}` },
                    { label: "Status", value: <StatusBadge tone={gig.isDisabled ? "danger" : "success"}>{gig.isDisabled ? "Disabled" : "Active"}</StatusBadge> },
                    { label: "Created Date", value: formatDate(gig.createdAt) },
                    { label: "Disable Reason", value: gig.disabledReason || "-" }
                ]} />
                <p className="text-sm text-surface-600 mt-5 leading-relaxed">{gig.description}</p>
            </DetailCard>
            <DetailCard title="Proposals">
                <div className="space-y-2">
                    {proposals.length ? proposals.map((proposal) => (
                        <div key={proposal._id} className="rounded-lg border border-surface-200 p-3 text-sm flex justify-between gap-3">
                            <span>{proposal.freelancer?.name} - {money(proposal.bidAmount)}</span>
                            <StatusBadge>{proposal.status}</StatusBadge>
                        </div>
                    )) : <p className="text-sm text-surface-500">No proposals submitted.</p>}
                </div>
            </DetailCard>
            {showDisable && <ReasonModal title={`Disable ${gig.title}`} label="Reason for disabling" value={reason} onChange={setReason} onCancel={() => setShowDisable(false)} onConfirm={disable} />}
        </div>
    );
}
