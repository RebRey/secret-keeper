// Required modules
require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const https = require("https");
const _ = require("lodash");

// Create the app and port connection
const app = express();
const port = 3000;
app.listen(port, function () {
  console.log("Server is running on port " + port + ".");
});

// // Open the connection to MongoDB local server and create the database
// main().catch((err) => console.log(err));
// async function main() {
//   mongoose.set("strictQuery", false);
//   await mongoose.connect("mongodb://127.0.0.1/blogDB");
//   console.log("Connected to local MongoDB server.");
// }

// Open the connection to MongoDB Atlas and create the database
main().catch((err) => console.log(err));
async function main() {
  mongoose.set("strictQuery", false);
  // Create a connection string for Mongo Atlas
  const connectionURI =
    "mongodb+srv://admin-rebecca:" +
    process.env.MONGO_ATLAS_ADMIN_PASSWORD +
    "@cluster0.swlgzsc.mongodb.net/blogDB";
  // Mongo Atlas connection
  await mongoose.connect(connectionURI);

  console.log("Connected to MongoDB server.");
}