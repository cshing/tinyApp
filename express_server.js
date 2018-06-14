const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cookieParser = require('cookie-parser')

const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
    username: req.cookies["username"],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { 
    username: req.cookies["username"]
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
    username: req.cookies["username"],
    shortURL: req.params.id, 
    longURL: urlDatabase[req.params.id]
  };      
  res.render("urls_show", templateVars);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  // res.send("ok")  // to check if can get to /urls/:id/delete
  res.redirect("/urls")
});

app.post("/urls/:id/edit", (req, res) => {
  // console.log(urlDatabase[req.params.id]);
  // console.log(req.body.longURL);
  urlDatabase[req.params.id] = req.body.longURL;
  // res.send("ok");  // to check if can get to /urls/:id/edit
  res.redirect("/urls")
});

app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect("/urls")
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect("/urls")
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});