const mongoose = require("mongoose");
const Tour = require("./tourModel");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      require: [true, "A review must have content."],
      maxlength: [50, "A review must less or equal to 50 characters."],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour."],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong a user."],
    },
  },
  // Virtual Property
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Each combination of tour and user has always to be unique
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// MIDDLEWARE

// QUERY MIDDLEWARE
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: ["name", "photo"],
  });
  next();
});

// AGGREGATION PIPELINE
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: "$tour",
        // add one for each document that was matched  ex. five doc -> numRating: 5
        numRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);
  // console.log(stats);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].numRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post("save", function () {
  // this -> current review
  // constructor -> Review (the model who created that document)
  this.constructor.calcAverageRatings(this.tour);
});

// GOAL: Implement update rating statistics as review rating update  delete.
// In order to use calcAverageRatings function, we need to use query middleware instead of document middleware.

// But we can't directly to access the current doc, so we need to use .clone to copy the query and use .fineOne to retrieving the current doc form the DB

//findByIdAndUpdate
//findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // Use .clone(): mongoose doesn't allow executing the same query object twice
  // Store it on the current query variable: "this"
  this.r = await this.clone().findOne();
  next();
});

// Then get access to it in the post middleware, where the calculate the statistic for reviews
reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

// The reason we don't process the whole works in the query middleware is because at the point of this middleware functioning the underlying data (基礎數據) would not have been updated, so the calculate statistics would not be up to date, that's why we using two-step process.

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
