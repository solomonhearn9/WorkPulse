const express = require("express");
const router = express.Router();
const depController = require("../controllers/department");
const { validateSession } = require('../controllers/session'); 

router.use(validateSession);

router.post('', depController.createDep);

router.put('/:id', depController.updateDep);

router.get('/:id', depController.getDepById);

router.get('', depController.getDeps);

router.delete('/:id', depController.deleteDep);

module.exports = router;