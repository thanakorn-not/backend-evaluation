const express = require('express');
const crudController = require('../controllers/crud.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect, restrictTo('ADMIN'));

const defineCrud = (path, model, searchFields) => {
    router.route(path)
        .get(crudController.list(model, searchFields))
        .post(crudController.create(model));

    router.route(`${path}/:id`)
        .get(crudController.getOne(model))
        .patch(crudController.update(model))
        .delete(crudController.delete(model));
};

// Map CRUD for all resources mentioned in check.txt requirement
defineCrud('/users', 'user', ['name', 'email']);
defineCrud('/topics', 'topic', ['name']);
defineCrud('/indicators', 'indicator', ['name']);
defineCrud('/periods', 'evaluation', ['name']); // Period = Evaluation? OK.
defineCrud('/evaluations', 'evaluation', ['name']);
defineCrud('/assignments', 'assignment', []);
defineCrud('/results', 'evaluationResult', []);
defineCrud('/evidence', 'evidence', ['filePath', 'mimeType']);

module.exports = router;
