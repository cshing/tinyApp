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
  "b2xVn2": {
    url: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    url: "http://www.google.com",
    userID: "user2RandomID"
  }
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "1111"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "2222"
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

function urlsForUser(userID) {
  const userURLs = {}
  for (let shortURL in urlDatabase) {
    if(urlDatabase[shortURL].userID === userID) {
      userURLs[shortURL] = urlDatabase[shortURL]
    }
  }
  return userURLs;
}

app.get("/urls", (req, res) => {
  const userID = req.cookies.user_ID;
  let templateVars = { 
    user: users[userID],
    urls: urlsForUser(userID)  //urlDatabase 
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userID = req.cookies.user_ID;
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

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;

  let newURL = {
    url: longURL,
    userID: req.cookies.user_ID
  }

  urlDatabase[shortURL]= newURL; //add key-value pairs to database
  res.redirect("/urls")
});

app.get("/u/:id", (req, res) => {
    const longURL = urlDatabase[req.params.id].url
    res.redirect(longURL)
});

app.get("/urls/:id", (req, res) => {
  const userID = req.cookies.user_ID;
  let templateVars = {
    user: users[userID],
    urls: urlsForUser(userID),
    shortURL: req.params.id, 
    longURL: urlDatabase[req.params.id]
  };
  if(!userID) {
    res.redirect("/login");
  } else {
  res.render("urls_show", templateVars);
  }
});


app.post("/urls/:id/delete", (req, res) => {
  const userID = req.cookies.user_ID;

  if(!userID) {
    res.redirect("/login");
  } else {
  delete urlDatabase[req.params.id];
  res.redirect("/urls")
  }
});

app.post("/urls/:id/edit", (req, res) => {
  const userID = req.cookies.user_ID;

  if(!userID) {
    res.redirect("/login");
  } else {
  urlDatabase[req.params.id].url = req.body.longURL;
  res.redirect("/urls")
  }
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
  res.render("register");
});

// Registration page (rgister,ejs)
app.post("/register", (req, res) => {
  const userID = `user${generateRandomString()}RandomID`
  const registerEmail = req.body.email;
  const registerPassword = req.body.password;

// Handle registration errors
  const valid = validateData(req.body)
  if (valid) {
    users[userID] = {
      id: userID,
      email: registerEmail,
      password: registerPassword
    } 
    res.cookie("user_ID", users[userID].id);
    res.redirect("/urls");
  } else {
      res.status(400).send("400: Opps, something went wrong...");
    } 
});

//Log-in
app.get("/login", (req, res) => {
  res.render("login");
});

function authenticateUser(email, password) {
  for (let userID in users) {
    if (users[userID].email === email) {
      if (users[userID].password === password) {
        return users[userID];
      }
    }
  }
}

app.post("/login", (req, res) => {
  const loginEmail = req.body.email;
  const loginPassword = req.body.password;

  let result = authenticateUser (loginEmail, loginPassword);
  if(result) {
    res.cookie("user_ID", result.id);
    res.redirect("/urls");
  } else {
    res.status(403).send("403: User not found or wrong password")
  }
});

// Log-out
app.post("/logout", (req, res) => {
  res.clearCookie('user_ID');
  res.redirect("/urls")
});
