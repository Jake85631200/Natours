// 1) IMPORT MODULES
const path = require("path");
const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const cors = require("cors");

const AppError = require("./utils/appError");
const globeErrorHandler = require("./controllers/errorController");
const tourRouter = require("./routes/tourRoute");
const userRouter = require("./routes/userRoute");
const reviewRouter = require("./routes/reviewRoute");
const viewRouter = require("./routes/viewRoute");
const bookingRouter = require("./routes/bookingRoute");
const { webhookCheckout } = require("./controllers/bookingController");

const app = express();

// set up to enable trust proxy (heroku) in order to accept requests from proxy

app.enable("trust proxy");

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// 2) GLOBAL MIDDLEWARES
// Implement CORS
app.use(cors());
// Access-Control-Allow-Origin *

// If we want to only allow specific URL to create request to this api:
// app.use(
//   cors({
//     origin: "https://www.natours.com",
//   }),
// );

// allow all method to request
app.options("*", cors());
// // allow /api/v1/tours/:id to request
// app.options("/api/v1/tours/:id", cors());

// Serving static files
app.use(express.static(path.join(__dirname, "public")));

// Set security HTTP headers
// helmet: A collection of many smaller middleware that set HTTP headers.
// app.use(helmet());
// app.use(helmet({ contentSecurityPolicy: false }));

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"], // allowed source
      connectSrc: [
        "'self'",
        "https://natours20240927-919f1ebf30df.herokuapp.com", // allowed url
      ],
      scriptSrc: [
        "'self'", // 當前網域的腳本
        "https://js.stripe.com", // 允許來自 Stripe 的腳本
      ],
      frameSrc: ["'self'", "https://js.stripe.com"],
    },
  }),
);

// console.log("NODE_ENV:", process.env.NODE_ENV);

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100, // 100 request from same IP
  windowMs: 60 * 60 * 1000,
  message: "Too many request from this IP, please try again in an hour!",
});
// Let all the route starts wit this
app.use("/api", limiter);

// Why put webhookCheckout here: Stripe need the req.body in raw, not JSON
app.post(
  "/webhook-checkout",
  express.raw({ type: "application/json" }),
  webhookCheckout,
);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
// Check req.body, req.queryString and req.params, then filter out all the "$"" and "."" sign
app.use(mongoSanitize());

// Data sanitization against XSS
// Clean any user input form malicious HTML code, convert all these HTML symbols
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  }),
);

// this will return a middleware, compress all the text that sent to clients, images not included.
app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log("cookies: ", req.cookies);
  next();
});

// 3) ROUTES
app.use("/", viewRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);

// 4) ERROR HANDLING MIDDLEWARE

// All of the HTTP method
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globeErrorHandler); // All of the error will be transfer to here by next(error).

module.exports = app;
