const prisma = require('../utils/db');
const AppError = require('../utils/AppError');

// Helper to handle q=&page=&pageSize=&sort=
const buildQueryOptions = (req) => {
    let { q, page = 1, pageSize = 10, sort = 'createdAt:desc' } = req.query;
    page = parseInt(page);
    pageSize = parseInt(pageSize);

    // Sort parsing "field:order"
    const orderBy = {};
    if (sort) {
        const parts = sort.split(':');
        if (parts.length === 2) {
            orderBy[parts[0]] = parts[1].toLowerCase();
        } else {
            orderBy[sort] = 'asc';
        }
    }

    // Pagination
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    return { q, skip, take, orderBy, page, pageSize };
};

// Generic list with search
exports.list = (modelName, searchFields = ['name']) => async (req, res, next) => {
    try {
        const { q, skip, take, orderBy, page, pageSize } = buildQueryOptions(req);

        let where = {};
        if (q && searchFields.length > 0) {
            where.OR = searchFields.map(field => ({
                [field]: { contains: q }
            }));
        }

        // Special handling if some fields don't exist exactly or they want specific includes
        // But for generic, this is enough

        // Handle models that don't have createdAt (like Role enum, but we only list Prisma Models here)
        // Topic, Indicator, Assignment, Evidence, EvaluationResult, User, Evaluation

        const count = await prisma[modelName].count({ where });
        const data = await prisma[modelName].findMany({
            where,
            skip,
            take,
            orderBy: Object.keys(orderBy).length > 0 ? orderBy : undefined
        });

        res.status(200).json({
            status: 'success',
            meta: {
                total: count,
                page,
                pageSize,
                totalPages: Math.ceil(count / pageSize)
            },
            data: data
        });
    } catch (err) { next(err); }
};

exports.getOne = (modelName) => async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        const doc = await prisma[modelName].findUnique({ where: { id } });
        if (!doc) return next(new AppError(`No doc found with that id`, 404));
        res.status(200).json({ status: 'success', data: doc });
    } catch (err) { next(err); }
};

exports.create = (modelName) => async (req, res, next) => {
    try {
        const doc = await prisma[modelName].create({ data: req.body });
        res.status(201).json({ status: 'success', data: doc });
    } catch (err) { next(err); }
};

exports.update = (modelName) => async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        const doc = await prisma[modelName].update({
            where: { id },
            data: req.body
        });
        res.status(200).json({ status: 'success', data: doc });
    } catch (err) { next(err); }
};

exports.delete = (modelName) => async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        await prisma[modelName].delete({ where: { id } });
        res.status(204).json({ status: 'success', data: null });
    } catch (err) { next(err); }
};
