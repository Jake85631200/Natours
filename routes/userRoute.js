const express = require("express");

const router = express.Router();

const {
  getAllUsers,
  getUser,
  getMe,
  updateUser,
  deleteUser,
  createUser,
  updateMe,
  deleteMe,
  uploadUserPhoto,
  resizeUserPhoto,
} = require("../controllers/userController");

const {
  signup,
  login,
  logout,
  protect,
  forgotPassword,
  resetPassword,
  updatePassword,
  restrictTo,
} = require("../controllers/authController");

router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", logout);
router.post("/forgotPassword", forgotPassword);
router.patch("/resetPassword/:token", resetPassword);

// Apply protect middleware to upcoming routes and middleware below
router.use(protect);

router.patch("/updatePassword", updatePassword);
router.get("/me", getMe, getUser);
router.patch("/updateMe", uploadUserPhoto, resizeUserPhoto, updateMe);
router.delete("/deleteMe", deleteMe);

// Apply restrictTo middleware to upcoming routes and middleware below
router.use(restrictTo("admin"));

// 100% RESTful
router.route("/").get(getAllUsers).post(createUser);
router.route("/:id").get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
