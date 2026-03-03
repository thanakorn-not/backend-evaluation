const jwt = require('jsonwebtoken');
const prisma = require('../utils/db');
const AppError = require('../utils/AppError');

exports.protect = async (req, res, next) => {
    try {
        let token;
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(new AppError('You are not logged in! Please log in to get access.', 401));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const currentUser = await prisma.user.findUnique({
            where: { id: decoded.id }
        });

        if (!currentUser) {
            return next(new AppError('The user belonging to this token does no longer exist.', 401));
        }

        req.user = currentUser;
        next();
    } catch (err) {
        return next(new AppError('Invalid token or token has expired', 401));
    }
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};
