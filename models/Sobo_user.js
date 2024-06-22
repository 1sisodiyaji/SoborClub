const mongoose = require('mongoose');

const SoboUsers = new mongoose.Schema({
  name: { type: String},
  email: { type: String, required: true, unique: true },
  password: { type: String},
  isrole : { type: String, required: true}
});

const SoboUser = mongoose.model('SoboUser', SoboUsers);

module.exports = SoboUser;