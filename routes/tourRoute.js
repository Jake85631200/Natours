const express = require("express");
const {
  getAllTours,
  aliasTopFiveTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  resizeTourImages,
  uploadTourImages,
} = require("../controllers/tourController");

const { protect, restrictTo } = require("../controllers/authController");

const reviewRouter = require("./reviewRoute");

const router = express.Router();

// router
//   .route("/:tourId/reviews")
//   .post(protect, restrictTo("user"), createReview);

// use reviewRouter instead when /:tourId/reviews
router.use("/:tourId/reviews", reviewRouter);

router.route("/top-5-cheap").get(aliasTopFiveTours, getAllTours);

router.route("/tour-stats").get(getTourStats);

router
  .route("/monthly-plan/:year")
  .get(restrictTo("admin, lead-guide", "guide"), getMonthlyPlan);

router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(getToursWithin);

router.route("/distances/:latlng/unit/:unit").get(getDistances);

router
  .route("/")
  .get(getAllTours)
  .post(protect, restrictTo("admin", "lead-guide"), createTour);

router
  .route("/:id")
  .get(getTour)
  .patch(
    protect,
    restrictTo("admin", "lead-guide"),
    uploadTourImages,
    resizeTourImages,
    updateTour,
  )
  .delete(protect, restrictTo("admin", "lead-guide"), deleteTour);

module.exports = router;
