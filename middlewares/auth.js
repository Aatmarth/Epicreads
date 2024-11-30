const User = require("../models/userSchema");

const userAuth = (req, res, next) => {
  if (req.session.user) {
    User.findById(req.session.user)
      .then((data) => {
        if (data && data.isBlocked != 0) {
          next();
        } else {
          res.redirect("/login");
        }
      })
      .catch((error) => {
        console.log(error.message, "Error in user auth middleware");
        res.status(500).send("Internal server error");
      });
  } else {
    res.redirect("/login");
  }
};

const isBlocked = (req, res, next) => {
  const userId =req.session.user;

  if (!userId) {
    next();
    return;
  }

  User.findById(userId)
    .then((user) => {
      if (user) {

        if (!user.isBlocked) {
          next();
        } else {
          res.render("logIn", { message: "User is blocked by admin" });
        }
      } else {
        res.redirect("/login", { message: "User not found" });
      }
    })


    .catch((error) => {
      console.log(error.message, "Error in user auth middleware");
      res.status(500).send("Internal server error");
    });
};

const adminAuth = (req, res, next) => {
  try {
    if (req.session.admin) {
      User.findOne({ isAdmin: 1 }).then((data) => {
        if (data) {
          next();
        } else {
          res.redirect("/admin/login");
        }
      });
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.log(error.message, "Error in admin auth middleware");
    res.status(500).send("Internal server error");
  }
};

module.exports = {
  userAuth,
  adminAuth,
  isBlocked,
};
