import { Outlet } from "react-router-dom";

export default function AuthLayout() {
    return (
        <div className="min-h-screen flex">
            {/* Left panel — branding */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] gradient-bg relative overflow-hidden">
                {/* Decorative shapes */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-32 right-16 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/3 rounded-full blur-2xl" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24">
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-12">
                            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <span className="text-white font-bold text-lg">S</span>
                            </div>
                            <span className="text-2xl font-bold text-white">
                                SkillSphere
                            </span>
                        </div>
                        <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
                            Connect with top talent,{" "}
                            <span className="text-white/80">build amazing things.</span>
                        </h1>
                        <p className="text-lg text-white/70 leading-relaxed max-w-lg">
                            SkillSphere is the platform where skilled freelancers and
                            ambitious clients come together to create extraordinary
                            projects.
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-10 mt-8">
                        <div>
                            <p className="text-3xl font-bold text-white">10K+</p>
                            <p className="text-sm text-white/60">Freelancers</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">5K+</p>
                            <p className="text-sm text-white/60">Projects</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">98%</p>
                            <p className="text-sm text-white/60">Satisfaction</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right panel — form */}
            <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center px-6 py-10 bg-surface-50">
                <div className="w-full max-w-md">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
