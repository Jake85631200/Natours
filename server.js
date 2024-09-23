const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });
const app = require("./app");

// Uncaught exception
process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  console.log("UNCAUGHT EXCEPTION!! Shutting down...");
  process.exit(1);
});

// Connecting to database

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD,
);

// mongoose.connect() returns a promise
mongoose.connect(DB).then(() => {
  console.log("DB connection successful!");
});

// Start server

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// Unhandled rejection
process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("UNHANDLED REJECTION!! Shutting down...");

  // call the call-back function after processing all the current connection request.
  server.close(() => {
    // 0 : success, 1: uncaught/handled bug
    process.exit(1);
  });
});
