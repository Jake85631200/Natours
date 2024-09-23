const mongoose = require("mongoose");
const validator = require("validator");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  // set fields
  name: {
    type: String,
    required: [true, "A User must have user name."],
  },
  email: {
    type: String,
    required: [true, "A User must have a email."],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email. "],
  },
  photo: { type: String, default: "default.jpg" },
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"], // enum: 枚舉
    default: "user",
  },
  password: {
    type: String,
    required: [true, "A User must have set a password."],
    minlength: [8, "A User password must be more than 8 characters"],
    select: false, // don't show up in output
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password!"],
    // Only works on CREATE and SAVE
    validate: {
      validator: function (el) {
        return el === this.password; // inputted password === password
      },
      message: "Password are not the same!",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// Password encryption middleware
userSchema.pre("save", async function (next) {
  // Only run this function when password has been modified.
  if (!this.isModified("password")) return next();

  // Store encrypted password into database
  this.password = await bcrypt.hash(this.password, 12);

  // We don't need passwordConfirm once the password has been encrypted.
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", async function (next) {
  // If password didn't changed
  if (!this.isModified("password") || this.isNew) return next();

  // - 1000: Sometimes the token is created before the passwordChangedAt time stamp
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

// This is an instanced method to compare if the logging password is existed.
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  // returns true or false
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );

    return JWTTimeStamp < changedTimeStamp;
  }
  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // Random generate resetToken
  const resetToken = crypto.randomBytes(32).toString("hex");

  // 1) Encrypted restToken and store into database
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  console.log({ resetToken }, this.passwordResetToken);
  // Set expiration of passwordResetExpires
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // 2) Send unencrypted token to email
  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
