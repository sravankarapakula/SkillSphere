export default function BudgetRange({ min, max }) {
    return (
        <span className="font-semibold text-surface-900">
            ${Number(min || 0).toLocaleString()} - ${Number(max || 0).toLocaleString()}
        </span>
    );
}
