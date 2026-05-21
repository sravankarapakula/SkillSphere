import { HiOutlineXMark } from "react-icons/hi2";

export default function SkillTag({ skill, onRemove, readOnly = false }) {
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 text-sm font-medium rounded-lg border border-primary-200 transition-all hover:bg-primary-100">
            {skill}
            {!readOnly && onRemove && (
                <button
                    type="button"
                    onClick={() => onRemove(skill)}
                    className="hover:bg-primary-200 rounded-full p-0.5 transition cursor-pointer"
                >
                    <HiOutlineXMark className="h-3.5 w-3.5" />
                </button>
            )}
        </span>
    );
}
