import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { register, reset } from "../../redux/slices/authSlice";
import AuthFormInput from "../../components/auth/AuthFormInput";
import RoleSelector from "../../components/auth/RoleSelector";
import Button from "../../components/shared/Button";
import toast from "react-hot-toast";
import {
    HiOutlineUser,
    HiOutlineEnvelope,
    HiOutlineLockClosed,
    HiOutlineShieldCheck
} from "react-icons/hi2";

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "client",
        secretCode: ""
    });
    const [errors, setErrors] = useState({});

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { isLoading, isError, isSuccess, message, user } = useSelector(
    (state) => state.auth
);

    useEffect(() => {
        if (isError && message) {
            toast.error(message);
        }

        if (isSuccess && user) {
            toast.success("Account created successfully!");

            if (user.role === "admin") {
                navigate("/admin/dashboard");
            }
            else if (user.role === "client") {
                navigate("/client/dashboard");
            }
            else {
                navigate("/freelancer/dashboard");
            }
        }

        return () => {
            dispatch(reset());
        };
    }, [
        isError,
        isSuccess,
        message,
        user,
        navigate,
        dispatch
    ]);
    
    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
        }
        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Enter a valid email address";
        }
        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }
        if (
            formData.role === "admin" &&
            !formData.secretCode.trim()
        ) {
            newErrors.secretCode = "Admin secret is required";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
        if (errors[id]) {
            setErrors((prev) => ({ ...prev, [id]: "" }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(formData);
        if (validate()) {
            const submitData = { ...formData };
            delete submitData.confirmPassword;
            dispatch(register(submitData));
        }
    };

    return (
        <div className="animate-fade-in">
            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-8 lg:hidden">
                <div className="h-9 w-9 rounded-lg gradient-bg flex items-center justify-center">
                    <span className="text-white font-bold">S</span>
                </div>
                <span className="text-xl font-bold text-surface-900">
                    Skill<span className="gradient-text">Sphere</span>
                </span>
            </div>

            <div className="mb-8">
                <h2 className="text-2xl font-bold text-surface-900 mb-2">
                    Create your account
                </h2>
                <p className="text-surface-500 text-sm">
                    Join SkillSphere and start building your future
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <AuthFormInput
                    label="Full Name"
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    icon={HiOutlineUser}
                />

                <AuthFormInput
                    label="Email Address"
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    icon={HiOutlineEnvelope}
                />

                <AuthFormInput
                    label="Password"
                    id="password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    icon={HiOutlineLockClosed}
                />

                <AuthFormInput
                    label="Confirm Password"
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    icon={HiOutlineLockClosed}
                />

                <RoleSelector
                    selected={formData.role}
                    onChange={(role) =>
                        setFormData((prev) => ({ ...prev, role }))
                    }
                />

                {formData.role === "admin" && (
                    <AuthFormInput
                        label="Admin Secret"
                        id="secretCode"
                        type="password"
                        placeholder="Enter admin secret"
                        value={formData.secretCode}
                        onChange={handleChange}
                        error={errors.secretCode}
                        icon={HiOutlineShieldCheck}
                    />
                )}

                <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    isLoading={isLoading}
                >
                    Create Account
                </Button>
            </form>

            <p className="text-center text-sm text-surface-500 mt-8">
                Already have an account?{" "}
                <Link
                    to="/login"
                    className="font-semibold text-primary-600 hover:text-primary-700"
                >
                    Sign in
                </Link>
            </p>
        </div>
    );
}
