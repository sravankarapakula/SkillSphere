const Gig = require("../models/Gig.models");
const asyncHandler = require("../utils/asynchandler");

const parseSkills = (skills) => {
    if (!skills) return [];

    return skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const textRegex = (value) => new RegExp(escapeRegex(value.trim()), "i");

const buildGigFilter = (query) => {
    const filter = {};
    const skills = parseSkills(query.skills);

    if (query.keyword) {
        const keyword = textRegex(query.keyword);
        filter.$or = [{ title: keyword }, { description: keyword }];
    }

    if (skills.length) {
        filter.skillsRequired = {
            $in: skills.map((skill) => textRegex(skill))
        };
    }

    if (query.minBudget || query.maxBudget) {
        if (query.minBudget) {
            filter.budgetMax = { $gte: Number(query.minBudget) };
        }

        if (query.maxBudget) {
            filter.budgetMin = {
                ...(filter.budgetMin || {}),
                $lte: Number(query.maxBudget)
            };
        }
    }

    if (query.location) {
        filter.location = textRegex(query.location);
    }

    if (query.experienceLevel) {
        filter.experienceLevel = query.experienceLevel;
    }

    return filter;
};

const getPagination = (query) => {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 9, 1), 30);

    return { page, limit, skip: (page - 1) * limit };
};

const createGig = asyncHandler(async (req, res) => {
    const gig = await Gig.create({
        ...req.body,
        client: req.user._id
    });

    await gig.populate("client", "name email");

    res.status(201).json({
        success: true,
        message: "Gig created",
        data: { gig }
    });
});

const getGigs = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const filter = buildGigFilter(req.query);

    const [gigs, total] = await Promise.all([
        Gig.find(filter)
            .populate("client", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Gig.countDocuments(filter)
    ]);

    res.status(200).json({
        success: true,
        data: {
            gigs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
});

const getGigById = asyncHandler(async (req, res) => {
    const gig = await Gig.findById(req.params.id).populate("client", "name email");

    if (!gig) {
        return res.status(404).json({
            success: false,
            message: "Gig not found"
        });
    }

    res.status(200).json({
        success: true,
        data: { gig }
    });
});

const getMyGigs = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { client: req.user._id };

    const [gigs, total] = await Promise.all([
        Gig.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Gig.countDocuments(filter)
    ]);

    res.status(200).json({
        success: true,
        data: {
            gigs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
});

const updateGig = asyncHandler(async (req, res) => {
    const gig = await Gig.findById(req.params.id);

    if (!gig) {
        return res.status(404).json({
            success: false,
            message: "Gig not found"
        });
    }

    if (gig.client.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "Only the gig owner can update it"
        });
    }

    [
        "title",
        "description",
        "skillsRequired",
        "budgetMin",
        "budgetMax",
        "location",
        "experienceLevel",
        "status"
    ].forEach((field) => {
        if (req.body[field] !== undefined) {
            gig[field] = req.body[field];
        }
    });

    if (gig.budgetMax < gig.budgetMin) {
        return res.status(400).json({
            success: false,
            message: "Maximum budget must be at least minimum budget"
        });
    }

    await gig.save();
    await gig.populate("client", "name email");

    res.status(200).json({
        success: true,
        message: "Gig updated",
        data: { gig }
    });
});

const deleteGig = asyncHandler(async (req, res) => {
    const gig = await Gig.findById(req.params.id);

    if (!gig) {
        return res.status(404).json({
            success: false,
            message: "Gig not found"
        });
    }

    if (gig.client.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "Only the gig owner can delete it"
        });
    }

    await gig.deleteOne();

    res.status(200).json({
        success: true,
        message: "Gig deleted"
    });
});

module.exports = {
    createGig,
    getGigs,
    getGigById,
    getMyGigs,
    updateGig,
    deleteGig
};
