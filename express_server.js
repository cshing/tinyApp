const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cookieParser = require('cookie-parser')

const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

function generateRandomString() {
  let randomString = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) 
    randomString += possible.charAt(Math.floor(Math.random() * possible.length));
  
  return randomString;
};


app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = { 
    //username: req.cookies["username"],
    user: users[req.cookies[users.userID]],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { 
    //username: req.cookies["username"],
    user: users[req.cookies[users.userID]],
  };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  // console.log(req.body);  // debug statement to see POST parameters
  // res.send("Ok");         // Respond with 'Ok' (we will replace this)
  
  const shortURL = generateRandomString();
  const longURL = req.body.longURL

  urlDatabase[shortURL] = longURL //add key-value pairs to database
  res.redirect("/urls")
});

app.get("/u/:id", (req, res) => {
    const longURL = urlDatabase[req.params.id];
    res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { 
    //username: req.cookies["username"],
    user: users[req.cookies[users.userID]],
    shortURL: req.params.id, 
    longURL: urlDatabase[req.params.id]
  };      
  res.render("urls_show", templateVars);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls")
});

app.post("/urls/:id/edit", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls")
});

//Log-in
app.get("/login", (req, res) => {
  let templateVars = { 
    //username: req.cookies["username"],
    user: users[req.cookies[users.userID]]
  };
  res.render("login", templateVars);
});

// app.post("/login", (req, res) => {
//   const userID = `user${generateRandomString()}RandomID`
//   const email = req.body.email;
//   const password = req.body.password;

// // Handle errors
//   let valid = validateData(req.body)
//   if (valid) {
//     users[userID] = {
//       id: userID,
//       email: email,
//       password: password
//     } 
//     res.cookie("userID", users[userID].id);
//     res.redirect("/urls");
//   } else {
//       res.status(400).send("Opps, something went wrong...");
//       return;
//     } 
// });

app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect("/urls")
});

// Log-out
app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect("/urls")
});

//function to validate registration 
function validateData(data) {
  if (data.email && data.email.length > 0 && data.password && data.password.length > 0) {
    for (let userID in users) {
      if (data.email === users[userID].email) {
        return false;
      }
      return true;
    }
  return false;
  }
}

// Register button in _header
app.get("/register", (req, res) => {
  let templateVars = { 
    //username: req.cookies["username"],
    user: users[req.cookies[users.userID]]
  };
  res.render("register", templateVars);
});

// Registration page (rgister,ejs)
app.post("/register", (req, res) => {
  const userID = `user${generateRandomString()}RandomID`
  const email = req.body.email;
  const password = req.body.password;

// Handle registration errors
  let valid = validateData(req.body)
  if (valid) {
    users[userID] = {
      id: userID,
      email: email,
      password: password
    } 
    res.cookie("userID", users[userID].id);
    res.redirect("/urls");
  } else {
      res.status(400).send("Opps, something went wrong...");
      return;
    } 
});