const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/db');
const AppError = require('../utils/AppError');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    });
};

exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role, departmentId } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return next(new AppError('Email already in use', 400));
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role: role || 'EVALUATEE',
                departmentId: departmentId || null
            }
        });

        const token = signToken(newUser.id);

        newUser.passwordHash = undefined;
        res.status(201).json({
            status: 'success',
            token,
            data: { user: newUser }
        });
    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new AppError('Please provide email and password!', 400));
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return next(new AppError('Incorrect email or password', 401));
        }

        const token = signToken(user.id);
        user.passwordHash = undefined;

        res.status(200).json({
            status: 'success',
            token,
            data: { user }
        });
    } catch (err) {
        next(err);
    }
};

exports.getMe = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { department: true }
        });
        user.passwordHash = undefined;

        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (err) {
        next(err);
    }
};

exports.getDepartments = async (req, res, next) => {
    try {
        const departments = await prisma.department.findMany({
            orderBy: { name: 'asc' }
        });
        res.status(200).json({
            status: 'success',
            data: departments
        });
    } catch (err) {
        next(err);
    }
};
