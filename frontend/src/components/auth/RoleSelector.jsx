import { HiOutlineBriefcase, HiOutlineUserGroup } from "react-icons/hi2";

const roles = [
    {
        value: "freelancer",
        label: "Freelancer",
        description: "Find work and showcase your skills",
        icon: HiOutlineBriefcase
    },
    {
        value: "client",
        label: "Client",
        description: "Hire talented freelancers for your projects",
        icon: HiOutlineUserGroup
    }
];

export default function RoleSelector({ selected, onChange }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-medium text-surface-700">
                I want to join as a
            </label>
            <div className="grid grid-cols-2 gap-3">
                {roles.map((role) => {
                    const isSelected = selected === role.value;
                    return (
                        <button
                            key={role.value}
                            type="button"
                            onClick={() => onChange(role.value)}
                            className={`
                                relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
                                ${
                                    isSelected
                                        ? "border-primary-500 bg-primary-50 shadow-md shadow-primary-500/10"
                                        : "border-surface-200 bg-white hover:border-surface-300 hover:shadow-sm"
                                }
                            `}
                        >
                            {isSelected && (
                                <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary-500 flex items-center justify-center">
                                    <svg
                                        className="h-3 w-3 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={3}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                </div>
                            )}
                            <role.icon
                                className={`h-7 w-7 ${
                                    isSelected
                                        ? "text-primary-600"
                                        : "text-surface-400"
                                }`}
                            />
                            <span
                                className={`text-sm font-semibold ${
                                    isSelected
                                        ? "text-primary-700"
                                        : "text-surface-700"
                                }`}
                            >
                                {role.label}
                            </span>
                            <span className="text-xs text-surface-500 text-center leading-snug">
                                {role.description}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
