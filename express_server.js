const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session')
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}))

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


// Url Database
const urlDatabase = {
  "b2xVn2": {
    url: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    url: "http://www.google.com",
    userID: "user2RandomID"
  }
};

// User Database
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: bcrypt.hashSync("1111", 10)
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: bcrypt.hashSync("2222", 10)
  }
};


// Function to generate 6 digit random userID
function generateRandomString() {
  let randomString = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) 
    randomString += possible.charAt(Math.floor(Math.random() * possible.length));
  
  return randomString;
};

// Function to add shortURL/:id to the right user
function urlsForUser(userID) {
  const userURLs = {}
  for (let shortURL in urlDatabase) {
    if(urlDatabase[shortURL].userID === userID) {
      userURLs[shortURL] = urlDatabase[shortURL]
    }
  }
  return userURLs;
}

// Function to check if shortURL belongs to user's own database
function checkCorrectURL (short, userID) {
  console.log(short)
  for (const shortURL in urlDatabase) {
    if (short === shortURL && userID === urlDatabase[shortURL].userID) {
      return true;
    }
  }
  return false;
}

// Function to check if registration email/password are valid and if it's been registered before
function validateData(data) {
  if (data.email && data.email.length > 0 && data.password && data.password.length > 0) {
    for (let userID in users) {
      if (data.email === users[userID].email) {
        return false;
      }
    }
    return true;
  }
  return false;
}

// Function to get userID by checking email
function getUserByEmail (email) {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return null;
}


// Practices
app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});


// Main page
app.get("/urls", (req, res) => {
  const userID = req.session.user_ID;
  let templateVars = { 
    user: users[userID],
    urls: urlsForUser(userID)  //urlDatabase 
  };

  res.render("urls_index", templateVars);
});

// If logged-in, show the add new url page
app.get("/urls/new", (req, res) => {
  const userID = req.session.user_ID;
  let templateVars = { 
    user: users[userID],
    urls: urlsForUser(userID)
  };

  if(!userID) {
    res.redirect("/login");
  } else {
  res.render("urls_new", templateVars);
  }
});

// Add new url
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;

  let newURL = {
    url: longURL,
    userID: req.session.user_ID
  }

  urlDatabase[shortURL]= newURL; //add key-value pairs to database
  res.redirect("/urls")
});

// Use id/shortURL to get redirect to longURL
app.get("/u/:id", (req, res) => {
    const longURL = urlDatabase[req.params.id].url;
    res.redirect(longURL)
});

// If logged-in and with correct shortURL, show the edit page for that shortURL
app.get("/urls/:id", (req, res) => {
  const userID = req.session.user_ID;
  const shortURL = req.params.id;
  const correct = checkCorrectURL(shortURL, userID)

  if(!userID) {
    res.redirect("/login");
    return;
  }
  if(correct) {
    let templateVars = {
      user: users[userID],
      shortURL: req.params.id, 
      longURL: urlDatabase[req.params.id].url
    };
    res.render("urls_show", templateVars);
  } else {
    res.send("Sorry, your shortened URL is wrong!")
  } 
});

// if logged-in, can delete url by clicking delete button
app.post("/urls/:id/delete", (req, res) => {
  const userID = req.session.user_ID;

  if(!userID) {
    res.redirect("/login");
  } else {
  delete urlDatabase[req.params.id];
  res.redirect("/urls")
  }
});

// if logged-in, can update the url
app.post("/urls/:id/edit", (req, res) => {
  const userID = req.session.user_ID;

  if(!userID) {
    res.redirect("/login");
  } else {
  urlDatabase[req.params.id].url = req.body.longURL;
  res.redirect("/urls")
  }
});

// Register button in _header
app.get("/register", (req, res) => {
  res.render("register");
});

// Registration page (register.ejs)
app.post("/register", (req, res) => {
  const userID = `user${generateRandomString()}RandomID`
  const registerEmail = req.body.email;
  const registerPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(registerPassword, 10);

// Handle registration errors
  const valid = validateData(req.body)
  if (valid) {
      users[userID] = {
      id: userID,
      email: registerEmail,
      password: hashedPassword
    } 

    req.session.user_ID = users[userID].id;
    res.redirect("/urls");
  } else {
      res.status(400).send("400: Opps... you are missing email/password or user existed already");
    } 
});

// Login button in _header
app.get("/login", (req, res) => {
  res.render("login");
});

// Login page
app.post("/login", (req, res) => {
  const loginEmail = req.body.email;
  const loginPassword = req.body.password;
  const loginUser = getUserByEmail(loginEmail)

  if (loginUser) {
    if (bcrypt.compareSync(loginPassword, loginUser.password)){
      req.session.user_ID = loginUser.id;
      res.redirect("/urls");
    } else {
      res.status(403).send("403: Password is incorrect")
    }
  } else {
    res.status(403).send("403: User not registered")
  }
});

// Log-out button in _header
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls")
});
