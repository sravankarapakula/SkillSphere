const Deliverable = require("../models/Deliverable");
const Gig = require("../models/Gig.models");
const Milestone = require("../models/Milestone");
const Project = require("../models/Project.models");
const Proposal = require("../models/Proposal.models");
const Review = require("../models/Review");
const User = require("../models/user.models");
const asyncHandler = require("../utils/asynchandler");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const textRegex = (value) => new RegExp(escapeRegex(String(value || "").trim()), "i");

const getPagination = (query, defaultLimit = 20) => {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || defaultLimit, 1), 50);
    return { page, limit, skip: (page - 1) * limit };
};

const sendList = async (res, modelQuery, countQuery, page, limit, key) => {
    const [items, total] = await Promise.all([modelQuery, countQuery]);
    res.status(200).json({
        success: true,
        data: {
            [key]: items,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        }
    });
};

const recalculateUserReputation = async (userId) => {
    const [freelancerStats, clientStats] = await Promise.all([
        Review.aggregate([
            { $match: { reviewee: userId, reviewType: "client_to_freelancer", isHidden: { $ne: true } } },
            { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$overallRating" } } }
        ]),
        Review.aggregate([
            { $match: { reviewee: userId, reviewType: "freelancer_to_client", isHidden: { $ne: true } } },
            { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$overallRating" } } }
        ])
    ]);

    const freelancer = freelancerStats[0] || { count: 0, total: 0 };
    const client = clientStats[0] || { count: 0, total: 0 };

    await User.findByIdAndUpdate(userId, {
        freelancerReviewCount: freelancer.count,
        freelancerTotalRatingPoints: freelancer.total,
        freelancerRating: freelancer.count ? Number((freelancer.total / freelancer.count).toFixed(2)) : 0,
        clientReviewCount: client.count,
        clientTotalRatingPoints: client.total,
        clientRating: client.count ? Number((client.total / client.count).toFixed(2)) : 0
    });
};

const getAdminUsers = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};

    if (["client", "freelancer", "admin"].includes(req.query.role)) {
        filter.role = req.query.role;
    }

    if (req.query.status === "active") filter.isSuspended = { $ne: true };
    if (req.query.status === "suspended") filter.isSuspended = true;

    if (req.query.search) {
        const search = textRegex(req.query.search);
        filter.$or = [{ name: search }, { email: search }];
    }

    const usersQuery = User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const [users, total] = await Promise.all([usersQuery, User.countDocuments(filter)]);
    const userIds = users.map((user) => user._id);
    const [projectCounts, reviewCounts] = await Promise.all([
        Project.aggregate([
            { $match: { $or: [{ client: { $in: userIds } }, { freelancer: { $in: userIds } }] } },
            { $project: { participants: ["$client", "$freelancer"] } },
            { $unwind: "$participants" },
            { $match: { participants: { $in: userIds } } },
            { $group: { _id: "$participants", count: { $sum: 1 } } }
        ]),
        Review.aggregate([
            { $match: { $or: [{ reviewer: { $in: userIds } }, { reviewee: { $in: userIds } }] } },
            { $project: { users: ["$reviewer", "$reviewee"] } },
            { $unwind: "$users" },
            { $match: { users: { $in: userIds } } },
            { $group: { _id: "$users", count: { $sum: 1 } } }
        ])
    ]);
    const projectsByUser = new Map(projectCounts.map((item) => [String(item._id), item.count]));
    const reviewsByUser = new Map(reviewCounts.map((item) => [String(item._id), item.count]));

    res.status(200).json({
        success: true,
        data: {
            users: users.map((user) => ({
                ...user,
                projectsCount: projectsByUser.get(String(user._id)) || 0,
                reviewsCount: reviewsByUser.get(String(user._id)) || 0
            })),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        }
    });
});

const getAdminUserDetails = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId)
        .select("-password")
        .populate("suspendedBy", "name email")
        .lean();

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const userId = user._id;
    const [
        projectsCount,
        proposalsCount,
        reviewsCount,
        deliverablesCount,
        recentProjects,
        recentReviews,
        recentDeliverables
    ] = await Promise.all([
        Project.countDocuments({ $or: [{ client: userId }, { freelancer: userId }] }),
        Proposal.countDocuments({ freelancer: userId }),
        Review.countDocuments({ $or: [{ reviewer: userId }, { reviewee: userId }] }),
        Deliverable.countDocuments({ submittedBy: userId }),
        Project.find({ $or: [{ client: userId }, { freelancer: userId }] })
            .populate("gig", "title")
            .populate("client freelancer", "name email")
            .sort({ createdAt: -1 })
            .limit(5)
            .lean(),
        Review.find({ $or: [{ reviewer: userId }, { reviewee: userId }] })
            .populate({
                path: "project",
                select: "gig",
                populate: {
                    path: "gig",
                    select: "title"
                }
            })
            .populate("reviewer reviewee", "name email")
            .sort({ createdAt: -1 })
            .limit(5)
            .lean(),
        Deliverable.find({ submittedBy: userId })
            .populate("project", "gig")
            .populate("milestone", "title")
            .sort({ createdAt: -1 })
            .limit(5)
            .lean()
    ]);

    await Project.populate(recentDeliverables, { path: "project.gig", select: "title" });

    recentReviews.forEach((review) => {
        if (review.project) {
            review.project.title = review.project.gig?.title || "";
        }
    });

    res.status(200).json({
        success: true,
        data: {
            user,
            activity: { projectsCount, proposalsCount, reviewsCount, deliverablesCount },
            recent: { projects: recentProjects, reviews: recentReviews, deliverables: recentDeliverables }
        }
    });
});

const suspendUser = asyncHandler(async (req, res) => {
    const reason = String(req.body.reason || "").trim();
    if (!reason) return res.status(400).json({ success: false, message: "Suspension reason is required" });

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.role === "admin") {
        return res.status(400).json({ success: false, message: "Admin users cannot be suspended" });
    }

    user.isSuspended = true;
    user.suspensionReason = reason;
    user.suspendedAt = new Date();
    user.suspendedBy = req.user._id;
    await user.save();

    res.status(200).json({ success: true, message: "User suspended", data: { user } });
});

const unsuspendUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.isSuspended = false;
    user.suspensionReason = null;
    user.suspendedAt = null;
    user.suspendedBy = null;
    await user.save();

    res.status(200).json({ success: true, message: "User unsuspended", data: { user } });
});

const getAdminGigs = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.status === "active") filter.isDisabled = { $ne: true };
    if (req.query.status === "disabled") filter.isDisabled = true;
    if (req.query.search) filter.title = textRegex(req.query.search);

    const query = Gig.find(filter)
        .populate("client", "name email")
        .populate("disabledBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const [gigs, total] = await Promise.all([query, Gig.countDocuments(filter)]);
    const proposalCounts = await Proposal.aggregate([
        { $match: { gig: { $in: gigs.map((gig) => gig._id) } } },
        { $group: { _id: "$gig", count: { $sum: 1 } } }
    ]);
    const counts = new Map(proposalCounts.map((item) => [String(item._id), item.count]));

    res.status(200).json({
        success: true,
        data: {
            gigs: gigs.map((gig) => ({ ...gig, proposalsCount: counts.get(String(gig._id)) || 0 })),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        }
    });
});

const getAdminGigDetails = asyncHandler(async (req, res) => {
    const gig = await Gig.findById(req.params.gigId)
        .populate("client", "name email")
        .populate("disabledBy", "name email")
        .lean();
    if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });

    const proposals = await Proposal.find({ gig: gig._id })
        .populate("freelancer", "name email")
        .sort({ createdAt: -1 })
        .lean();

    res.status(200).json({ success: true, data: { gig, proposals } });
});

const disableGig = asyncHandler(async (req, res) => {
    const reason = String(req.body.reason || "").trim();
    if (!reason) return res.status(400).json({ success: false, message: "Disable reason is required" });

    const gig = await Gig.findById(req.params.gigId);
    if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });

    gig.isDisabled = true;
    gig.disabledReason = reason;
    gig.disabledAt = new Date();
    gig.disabledBy = req.user._id;
    await gig.save();

    res.status(200).json({ success: true, message: "Gig disabled", data: { gig } });
});

const enableGig = asyncHandler(async (req, res) => {
    const gig = await Gig.findById(req.params.gigId);
    if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });

    gig.isDisabled = false;
    gig.disabledReason = null;
    gig.disabledAt = null;
    gig.disabledBy = null;
    await gig.save();

    res.status(200).json({ success: true, message: "Gig enabled", data: { gig } });
});

const getAdminProjects = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    const map = { open: "active", "in_progress": "in_progress", completed: "completed", archived: "cancelled" };
    if (map[req.query.status]) filter.status = map[req.query.status];

    let query = Project.find(filter)
        .populate("gig", "title description")
        .populate("client freelancer", "name email")
        .sort({ createdAt: -1 });

    const search = req.query.search ? textRegex(req.query.search) : null;
    if (search) {
        query = query.populate({ path: "gig", match: { title: search }, select: "title description" });
    }

    const projects = await query.skip(skip).limit(limit).lean();
    const filtered = search
        ? projects.filter((project) => project.gig || search.test(project.client?.name || "") || search.test(project.freelancer?.name || ""))
        : projects;
    const projectIds = filtered.map((project) => project._id);
    const milestoneCounts = await Milestone.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: "$project", count: { $sum: 1 } } }
    ]);
    const counts = new Map(milestoneCounts.map((item) => [String(item._id), item.count]));

    res.status(200).json({
        success: true,
        data: {
            projects: filtered.map((project) => ({ ...project, milestonesCount: counts.get(String(project._id)) || 0 })),
            pagination: { page, limit, total: filtered.length, pages: Math.ceil(filtered.length / limit) || 1 }
        }
    });
});

const getAdminProjectDetails = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.projectId)
        .populate("gig", "title description budgetMin budgetMax status")
        .populate("client freelancer", "name email profileImage")
        .populate("proposal", "bidAmount estimatedDays coverLetter")
        .lean();
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    const [milestones, deliverables, reviews] = await Promise.all([
        Milestone.find({ project: project._id }).sort({ order: 1, createdAt: 1 }).lean(),
        Deliverable.find({ project: project._id })
            .populate("milestone", "title")
            .populate("submittedBy reviewedBy", "name email")
            .sort({ createdAt: -1 })
            .lean(),
        Review.find({ project: project._id })
            .populate("reviewer reviewee", "name email")
            .sort({ createdAt: -1 })
            .lean()
    ]);

    res.status(200).json({ success: true, data: { project, milestones, deliverables, reviews } });
});

const getAdminReviews = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.type === "client") filter.reviewType = "client_to_freelancer";
    if (req.query.type === "freelancer") filter.reviewType = "freelancer_to_client";
    if (req.query.status === "hidden") filter.isHidden = true;
    if (req.query.status === "visible") filter.isHidden = { $ne: true };

    let reviews = await Review.find(filter)
        .populate("reviewer reviewee", "name email")
        .populate({
            path: "project",
            select: "gig",
            populate: {
                path: "gig",
                select: "title"
            }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    reviews.forEach((review) => {
        if (review.project) {
            review.project.title = review.project.gig?.title || "";
        }
    });

    if (req.query.search) {
        const search = textRegex(req.query.search);
        reviews = reviews.filter((review) =>
            search.test(review.reviewer?.name || "") ||
            search.test(review.reviewee?.name || "") ||
            search.test(review.project?.title || "")
        );
    }

    res.status(200).json({
        success: true,
        data: {
            reviews,
            pagination: { page, limit, total: reviews.length, pages: Math.ceil(reviews.length / limit) || 1 }
        }
    });
});

const getAdminReviewDetails = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.reviewId)
        .populate("reviewer reviewee hiddenBy", "name email")
        .populate({
            path: "project",
            select: "gig status",
            populate: {
                path: "gig",
                select: "title"
            }
        })
        .lean();
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });
    if (review.project) {
        review.project.title = review.project.gig?.title || "";
    }
    res.status(200).json({ success: true, data: { review } });
});

const hideReview = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    review.isHidden = true;
    review.hiddenAt = new Date();
    review.hiddenBy = req.user._id;
    await review.save();
    await recalculateUserReputation(review.reviewee);

    res.status(200).json({ success: true, message: "Review hidden", data: { review } });
});

const restoreReview = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    review.isHidden = false;
    review.hiddenAt = null;
    review.hiddenBy = null;
    await review.save();
    await recalculateUserReputation(review.reviewee);

    res.status(200).json({ success: true, message: "Review restored", data: { review } });
});

const getAdminDeliverables = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (["submitted", "approved", "rejected"].includes(req.query.status)) filter.status = req.query.status;

    const query = Deliverable.find(filter)
        .populate("project", "gig")
        .populate("milestone", "title")
        .populate("submittedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    const [deliverables, total] = await Promise.all([query, Deliverable.countDocuments(filter)]);
    await Project.populate(deliverables, { path: "project.gig", select: "title" });

    res.status(200).json({
        success: true,
        data: {
            deliverables,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        }
    });
});

const getAdminDeliverableDetails = asyncHandler(async (req, res) => {
    const deliverable = await Deliverable.findById(req.params.deliverableId)
        .populate("project", "gig client freelancer status")
        .populate("milestone", "title status dueDate")
        .populate("submittedBy reviewedBy", "name email")
        .lean();
    if (!deliverable) return res.status(404).json({ success: false, message: "Deliverable not found" });
    await Project.populate(deliverable, [
        { path: "project.gig", select: "title description" },
        { path: "project.client", select: "name email" },
        { path: "project.freelancer", select: "name email" }
    ]);

    const versionHistory = await Deliverable.find({ milestone: deliverable.milestone._id })
        .populate("submittedBy reviewedBy", "name email")
        .sort({ version: -1 })
        .lean();

    res.status(200).json({ success: true, data: { deliverable, versionHistory } });
});

const getAdminAnalytics = asyncHandler(async (req, res) => {
    const [
        totalUsers,
        totalClients,
        totalFreelancers,
        suspendedUsers,
        totalGigs,
        activeGigs,
        disabledGigs,
        totalProposals,
        openProjects,
        inProgressProjects,
        completedProjects,
        totalReviews,
        visibleReviews,
        hiddenReviews,
        totalDeliverables,
        pendingDeliverables,
        approvedDeliverables,
        rejectedDeliverables,
        freelancerRatingStats,
        clientRatingStats
    ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: "client" }),
        User.countDocuments({ role: "freelancer" }),
        User.countDocuments({ isSuspended: true }),
        Gig.countDocuments(),
        Gig.countDocuments({ isDisabled: { $ne: true } }),
        Gig.countDocuments({ isDisabled: true }),
        Proposal.countDocuments(),
        Project.countDocuments({ status: "active" }),
        Project.countDocuments({ status: { $in: ["in_progress", "revision"] } }),
        Project.countDocuments({ status: "completed" }),
        Review.countDocuments(),
        Review.countDocuments({ isHidden: { $ne: true } }),
        Review.countDocuments({ isHidden: true }),
        Deliverable.countDocuments(),
        Deliverable.countDocuments({ status: "submitted" }),
        Deliverable.countDocuments({ status: "approved" }),
        Deliverable.countDocuments({ status: "rejected" }),
        Review.aggregate([
            { $match: { reviewType: "client_to_freelancer", isHidden: { $ne: true } } },
            { $group: { _id: null, avg: { $avg: "$overallRating" } } }
        ]),
        Review.aggregate([
            { $match: { reviewType: "freelancer_to_client", isHidden: { $ne: true } } },
            { $group: { _id: null, avg: { $avg: "$overallRating" } } }
        ])
    ]);

    res.status(200).json({
        success: true,
        data: {
            users: { totalUsers, totalClients, totalFreelancers, suspendedUsers },
            marketplace: { totalGigs, activeGigs, disabledGigs, totalProposals },
            projects: { openProjects, inProgressProjects, completedProjects },
            reviews: {
                totalReviews,
                visibleReviews,
                hiddenReviews,
                averageFreelancerRating: Number((freelancerRatingStats[0]?.avg || 0).toFixed(2)),
                averageClientRating: Number((clientRatingStats[0]?.avg || 0).toFixed(2))
            },
            deliverables: { totalDeliverables, pendingDeliverables, approvedDeliverables, rejectedDeliverables }
        }
    });
});

module.exports = {
    getAdminUsers,
    getAdminUserDetails,
    suspendUser,
    unsuspendUser,
    getAdminGigs,
    getAdminGigDetails,
    disableGig,
    enableGig,
    getAdminProjects,
    getAdminProjectDetails,
    getAdminReviews,
    getAdminReviewDetails,
    hideReview,
    restoreReview,
    getAdminDeliverables,
    getAdminDeliverableDetails,
    getAdminAnalytics
};
