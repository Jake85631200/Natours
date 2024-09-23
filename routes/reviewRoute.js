const express = require("express");

// mergeParams: Let child route be able to access params of parent route
const router = express.Router({ mergeParams: true });

const {
  getReview,
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
  setTourUserIds,
} = require("../controllers/reviewController");

const { protect, restrictTo } = require("../controllers/authController");

router.use(protect);

router
  .route("/")
  .get(getAllReviews)
  .post(restrictTo("user"), setTourUserIds, createReview);

router
  .route("/:id")
  .get(getReview)
  .delete(restrictTo("admin", "user"), deleteReview)
  .patch(restrictTo("admin", "user"), updateReview);

module.exports = router;
