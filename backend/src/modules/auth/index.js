const authRoutes = require('./routes/authRoutes');
const authController = require('./controllers/authController');
const authValidator = require('./validators/authValidator');

module.exports = {
  routes: authRoutes,
  controller: authController,
  validator: authValidator
};