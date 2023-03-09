// Required modules
require("dotenv").config();
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

// Create the express app and port connection
const app = express();
const port = 3000;

// Set ejs
app.set("view engine", "ejs");

// Use body-parser and express in the app
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Open the connection to MongoDB Atlas and create the database
const main = async () => {
  mongoose.set("strictQuery", false);
  // Create a connection string for Mongo Atlas
  const connectionURI =
    "mongodb+srv://admin-rebecca:" +
    process.env.MONGO_ATLAS_ADMIN_PASSWORD +
    "@cluster0.swlgzsc.mongodb.net/userDB";

  // Mongo Atlas connection
  await mongoose.connect(connectionURI);
  console.log("Connected to MongoDB server.");

  // Tells express server to start listening for HTTP connects
  app.listen(port, () => {
    console.log("Server is running on port " + port + ".");
  });
};

// Create Mongoose Schema for user login information
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

// Password Encryption
const secret = process.env.ENCRYPTION_KEY;
userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]});

// Create a Mongoose Model using userSchema.
const User = new mongoose.model("User", userSchema);

// Route Handlers
app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const newUser = new User({
    email: req.body.username,
    password: req.body.password,
  });

  newUser
    .save()
    .then(() => {
      res.render("secrets");
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({ email: username })
    .then((foundUser) => {
      if (foundUser) {
        if (foundUser.password === password) {
          res.render("secrets");
        }
      }
    })

    //When there are errors we handle them here
    .catch((err) => {
      console.log(err);
    });
});

// Start mongoose connection
main().catch((err) => console.log(err));
