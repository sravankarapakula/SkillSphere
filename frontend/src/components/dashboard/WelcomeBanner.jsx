export default function WelcomeBanner({ user, subtitle }) {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    return (
        <div className="relative overflow-hidden rounded-2xl gradient-bg p-8 text-white">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 blur-2xl" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/3 rounded-full blur-xl" />

            <div className="relative z-10">
                <p className="text-white/70 text-sm font-medium mb-1">
                    {getGreeting()},
                </p>
                <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                    {user?.name} 👋
                </h1>
                <p className="text-white/60 text-sm max-w-md">
                    {subtitle}
                </p>
            </div>
        </div>
    );
}
