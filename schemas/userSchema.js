const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  hashedPassword: { type: String, required: true }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  const user = this;
  if (!user.isModified('hashedPassword')) return next();

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(user.hashedPassword, saltRounds);
  user.hashedPassword = hashedPassword;
  next();
});


const User = mongoose.model('User', userSchema);

module.exports = User;