const express        = require('express');
const router         = express.Router();
const jobsController = require('../../controllers/jobs.controller');

/* POST */
router.post('/', jobsController.create);

module.exports = router;
