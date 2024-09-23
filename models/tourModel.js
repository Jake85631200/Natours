const mongoose = require("mongoose");
// slugify converts string into URL friendly format
const slugify = require("slugify");
// const validator = require("validator");
// const User = require("./userModel");

const tourSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
    },
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true,
      max_length: [40, "A Tour name must be less or equal than 40 characters"],
      minlength: [10, "A Tour name must be more or equal than 10 characters"],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either: Easy, Medium, Difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // "this" only points to  current doc on NEW document creation.
          return val < this.price;
        },
        message: "Discount price ({VALUE}) should be lower than regular price.",
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have a summary"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    premiumTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //  GeoJSON
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      // 座標
      coordinates: [Number],
      address: String,
      description: String,
    },
    // Embedded Document -> Always use the array, by specifying an array of objects, this will create new documents inside of the parent document
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // ref: "User" -> Create relationship between guides and User fro m userSchema
    guides: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
// index(索引): Enhance efficiency of querying
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

tourSchema.index({ startLocation: "2dsphere" });

// Virtual Properties: doesn't stored in DB, dynamically generated when app is running.
tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

// Virtual Populate
tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour", // The tour field array inside Reviews
  localField: "_id", // The _id of the foreignField
});

// DOCUMENT MIDDLEWARE: runs before .save() command and .create() command
tourSchema.pre("save", function (next) {
  // slugify converts string into URL friendly format
  this.slug = slugify(this.name, { lower: true });
  next();
});

// EMBEDDING USERS INTO TOUR GUIDES ARRAY
// tourSchema.pre("save", async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// QUERY MIDDLEWARE:
// DON'T SHOW PREMIUM TOURS WHEN SEARCH
//  ^ is a regular expression that means all the strings start with "find"
tourSchema.pre(/^find/, function (next) {
  // "this" stands for query in Query Middleware
  this.find({ premiumTour: { $ne: true } }); // ne: not equal

  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: "guides",
    select: ["-__v", "-passwordChangedAt"],
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  next();
});

// AGGREGATION MIDDLEWARE
// DON'T SHOW PREMIUM TOURS WHEN AGGREGATE FILTER
// tourSchema.pre("aggregate", function (next) {
//   this.pipeline().unshift({ $match: { premiumTour: { $ne: true } } });

//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
