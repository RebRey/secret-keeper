// Required modules
require("dotenv").config();
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const { nextTick } = require("process");
const { response } = require("express");
const FacebookStrategy = require("passport-facebook").Strategy;

// Create the express app and port connection
const app = express();
const port = 3000;

// use express
app.use(express.static("public"));

// Set ejs
app.set("view engine", "ejs");

// Use body-parser
app.use(bodyParser.urlencoded({ extended: true }));

// Use session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// Use passport and initialize it
app.use(passport.initialize());

// Authenticate the session
app.use(passport.session());

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
};

// Create Mongoose Schema for user login information
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  googleId: String,
  facebookId: String,
  secret: String,
  name: String,
});

// Use passport-local-mongoose package by plugging it into our userSchema
userSchema.plugin(passportLocalMongoose);

// Use mongoose-findorcreate package by plugging it into our userSchema
userSchema.plugin(findOrCreate);

// // Password Encryption
// const secret = process.env.ENCRYPTION_KEY;
// userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]});

// Create a Mongoose Model using userSchema.
const User = new mongoose.model("User", userSchema);

// Simplified Passport/Passport-Local Configuration
// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy());

// serialized and deserialized necessary when using sessions
passport.serializeUser((user, cb) => {
  process.nextTick(() => {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture,
    });
  });
});

passport.deserializeUser((user, cb) => {
  process.nextTick(() => {
    return cb(null, user);
  });
});

// Configure Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,

      callbackURL: "http://localhost:3000/auth/google/secrets",
      // retrieve userinfo
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    (accessToken, refreshToken, profile, cb) => {
      console.log(profile);

      // install and require("mongoose-findorcreate"); to make this function work
      User.findOrCreate({ googleId: profile.id }, (err, user) => {
        return cb(err, user);
      });
    }
  )
);

// Configure Facebook Login Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "http://localhost:3000/auth/facebook/secrets",
    },
    (accessToken, refreshToken, profile, cb) => {
      User.findOrCreate(
        { facebookId: profile.id, username: profile.displayName },
        (err, user) => {
          return cb(err, user);
        }
      );
    }
  )
);

// Route Handlers
app.get("/", (req, res) => {
  res.render("home");
});

// Authenticate Requests for Google
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // Successful authentication, secrets page.
    res.redirect("/secrets");
  }
);

// Authenticate Requests For Facebook
app.get("/auth/facebook", passport.authenticate("facebook"));

app.get(
  "/auth/facebook/secrets",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  (req, res) => {
    // Successful authentication, secrets home.
    res.redirect("/secrets");
  }
);

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/secrets", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/submit", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.post("/register", async (req, res) => {
  try {
    await User.register({ username: req.body.username }, req.body.password);
  } catch (err) {
    console.log(err);
    res.redirect("/register");
  }
  passport.authenticate("local")(req, res, () => {
    res.redirect("/secrets");
  });
});

app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, (err) => {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/submit", async (req, res) => {
  const submittedSecret = req.body.secret;
  try {
    const foundUser = await User.findById(req.user.id);

    if (foundUser) {
      foundUser.secret = submittedSecret;
      await foundUser.save();
      res.redirect("/secrets");
    }
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

// Tells express server to start listening for HTTP connects
app.listen(port, () => {
  console.log("Server is running on port " + port + ".");
});

// Start mongoose connection
main().catch((err) => console.log(err));
