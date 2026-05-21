import { HiOutlineExclamationCircle } from "react-icons/hi2";

export default function AuthFormInput({
    label,
    id,
    type = "text",
    placeholder,
    value,
    onChange,
    error,
    icon: Icon,
    ...props
}) {
    return (
        <div className="space-y-1.5">
            {label && (
                <label
                    htmlFor={id}
                    className="block text-sm font-medium text-surface-700"
                >
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Icon className={`h-4.5 w-4.5 ${error ? "text-danger" : "text-surface-400"}`} />
                    </div>
                )}
                <input
                    id={id}
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className={`
                        w-full rounded-xl border bg-white
                        ${Icon ? "pl-10" : "pl-4"} pr-4 py-2.5
                        text-sm text-surface-800 placeholder:text-surface-400
                        transition-all duration-200
                        focus:outline-none focus:ring-2 focus:ring-offset-0
                        ${
                            error
                                ? "border-danger focus:ring-danger/30"
                                : "border-surface-300 focus:border-primary-500 focus:ring-primary-500/20"
                        }
                    `}
                    {...props}
                />
            </div>
            {error && (
                <div className="flex items-center gap-1.5 text-danger">
                    <HiOutlineExclamationCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    <p className="text-xs font-medium">{error}</p>
                </div>
            )}
        </div>
    );
}
