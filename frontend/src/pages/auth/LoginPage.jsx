import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login, reset, googleLogin } from "../../redux/slices/authSlice";
import { GoogleLogin } from "@react-oauth/google";
import AuthFormInput from "../../components/auth/AuthFormInput";
import Button from "../../components/shared/Button";
import toast from "react-hot-toast";
import { HiOutlineEnvelope, HiOutlineLockClosed } from "react-icons/hi2";

export default function LoginPage() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        rememberMe: false
    });
    const [errors, setErrors] = useState({});

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.auth
    );

    useEffect(() => {
        if (isError && message) {
            toast.error(message);
        }
        if (isSuccess) {
            toast.success("Welcome back!");
            navigate("/dashboard");
        }
        return () => {
            dispatch(reset());
        };
    }, [isError, isSuccess, message, navigate, dispatch]);

    const validate = () => {
        const newErrors = {};
        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Enter a valid email address";
        }
        if (!formData.password) {
            newErrors.password = "Password is required";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { id, type, value, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [id]: type === "checkbox" ? checked : value
        }));
        if (errors[id]) {
            setErrors((prev) => ({ ...prev, [id]: "" }));
        }
    };

    const handleGoogleSuccess = (credentialResponse) => {
        if (credentialResponse.credential) {
            dispatch(googleLogin(credentialResponse.credential));
        } else {
            toast.error("Google authentication failed");
        }
    };

    const handleGoogleFailure = () => {
        toast.error("Google login failed");
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            dispatch(login(formData));
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
                    Welcome back
                </h2>
                <p className="text-surface-500 text-sm">
                    Sign in to your account to continue
                </p>
            </div>

            <form onSubmit={handleSubmit} autoComplete="on" className="space-y-5">
                <AuthFormInput
                    label="Email Address"
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    icon={HiOutlineEnvelope}
                />

                <AuthFormInput
                    label="Password"
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    icon={HiOutlineLockClosed}
                />

                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            id="rememberMe"
                            name="rememberMe"
                            type="checkbox"
                            checked={formData.rememberMe}
                            onChange={handleChange}
                            className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                        <span className="text-sm text-surface-600">Remember me</span>
                    </label>
                    <Link
                        to="/forgot-password"
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                        Forgot password?
                    </Link>
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    isLoading={isLoading}
                >
                    Sign In
                </Button>
            </form>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-surface-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-surface-500">
                        Or continue with
                    </span>
                </div>
            </div>

            <div className="flex justify-center">
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleFailure}
                />
            </div>

            <p className="text-center text-sm text-surface-500 mt-8">
                Don&apos;t have an account?{" "}
                <Link
                    to="/register"
                    className="font-semibold text-primary-600 hover:text-primary-700"
                >
                    Create one free
                </Link>
            </p>
        </div>
    );
}
