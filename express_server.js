// Include modules
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cookieSession = require('cookie-session')
const bcrypt = require('bcrypt')

// Set Port
const PORT = 8080

// Include Databases
var urlDatabase = require('./database')
var usersDatabase = require('./users')

app.use(bodyParser.urlencoded({ extended: true }))

// Set EJS as the view engine for the app.
app.set('view engine', 'ejs')

// Set the cookie session, keys, and max age of said cookie.
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  maxAge: 24 * 60 * 60 * 1000
}))

// GET declaration for the homepage.
// If user is logged in, redirect to urls, if not, redirect to login. This is done via checking for a session ID
app.get('/', (req, res) => {
  if (req.session['user_id']) {
    res.redirect('/urls')
  } else {
    res.redirect('/login')
  }
})

// GET declaration for the /urls page
app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase, user: usersDatabase[req.session['user_id']] }
  if (templateVars.user) {
    res.render('urls_index', templateVars)
  } else {
    res.send('Please log in <a href="/login"> here</a>')
  }
})

// GET declaration for the /register page
app.get('/register', (req, res) => {
  if (!req.session['user_id']) {
    let templateVars = { urls: urlDatabase, user: usersDatabase[req.session['user_id']] }
    res.render('registration', templateVars)
  } else {
    res.redirect('/urls')
  }
})

// GET declaration for the /login page
app.get('/login', (req, res) => {
  if (!req.session['user_id']) {
    let templateVars = { urls: urlDatabase, user: usersDatabase[req.session['user_id']] }
    res.render('login', templateVars)
  } else {
    res.redirect('/urls')
  }
})

// GET declaration for the /new page
app.get('/urls/new', (req, res) => {
  let templateVars = { user: usersDatabase[req.session['user_id']] }
  if (!req.session['user_id']) {
    res.redirect('/login')
  } else {
    res.render('urls_new', templateVars)
  }
})

// GET declaration for each individual short URL page.
app.get('/urls/:shortURL', (req, res) => {
  // If user is not signed in, send message to login
  if (!req.session['user_id'] || !usersDatabase[req.session['user_id']]) {
    res.send('Please sign in <a href="/login">here</a>')
    return
  }
  // If the shortURL cannot be found in the database flag an error.
  if (!urlDatabase[req.params.shortURL]) {
    res.send('That url has not been shortened. Please add it and try again.')
    return
  }
  // if the current logged in user doesnt match the user ID tied to the url your looking at.
  if (usersDatabase[req.session['user_id']].id !== urlDatabase[req.params.shortURL].userID) {
    res.send('Not you url! <a href="/urls">Choose another</a>')
    return
  }
  // Set variables to be passed through to the view.
  let shortURLRef = req.params.shortURL
  let templateShowVars = { shortURL: shortURLRef, longURL: urlDatabase[shortURLRef].longURL, user: usersDatabase[req.session['user_id']].id }
  res.render('urls_show', templateShowVars)
})

// POST Declaration for the endpoint /urls
// Handles submission of new URLs to be shortened.
// 1. Generates unique ID for the entry.
// 2. Confirms the submission of the url from the form.
// 3. Attaches the current viewer ID to the submission.
// Redirects to the /urls page after successful submission.
app.post('/urls', (req, res) => {
  var getShortURL = generateRandomString()
  urlDatabase[getShortURL] = {}
  urlDatabase[getShortURL]['longURL'] = req.body['longURL']
  urlDatabase[getShortURL]['userID'] = req.session.user_id
  res.redirect('/urls/' + getShortURL)
})

// POST Declaration for the endpoint /login
// Handles process of a user logging in.
app.post('/login', (req, res) => {
  // Set variables to be used.
  let emailEntry = req.body.email
  let passwordEntry = req.body.password
  let keyEntry = lookupByEmail(emailEntry)

  // IF the email, or password entry field are falsy
  if (!req.body.email || !req.body.password) {
    res.send('You have not entered a username or password. Please try again.')
  }

  // Check if user is registered.
  // Else if the encrypted password field entry matches that of the user looked up.
  // Else pass error.
  if (keyEntry === undefined) {
    res.send('Your user does not exist. Please try again.')
  } else if (keyEntry && bcrypt.compareSync(passwordEntry, usersDatabase[keyEntry]['password'])) {
    req.session['user_id'] = keyEntry
    res.redirect('/urls/')
  } else {
    res.send('Your username and password dont match. Please try again.')
  }
})

// POST Declaration for the /logout endpoint.
// Deletes session cookie and redirects.
app.post('/logout', (req, res) => {
  req.session = null
  res.redirect('/login')
})

// POST Declaration for the /register endpoint.
// Handles registration of a new user.
app.post('/register', (req, res) => {
  // Set variables to be used in the process.
  let regVars = usersDatabase
  const usernameEntry = req.body['email']
  const passwordEntry = req.body['password']
  const hashedPassword = bcrypt.hashSync(passwordEntry, 10)
  var randomiD = generateRandomString()

  // Check if either username or password is empty.
  if (!usernameEntry || !passwordEntry) {
    res.send('You have not entered a username or password. Please try again.')
    return
  }
  // Check if username submitted exists in users db.
  for (let user in usersDatabase) {
    if (usersDatabase[user]['email'] === usernameEntry) {
      res.send('That user already exists. Please try again.')
    }
  }

  // Set variables to be used
  regVars[randomiD] = {}
  regVars[randomiD]['id'] = randomiD
  regVars[randomiD]['email'] = usernameEntry
  regVars[randomiD]['password'] = hashedPassword
  let emailEntry = req.body.email
  let keyEntry = lookupByEmail(emailEntry)

  if (keyEntry === undefined) {
    res.send('Your user does not exist. Please try again.')
  } else if (keyEntry && bcrypt.compareSync(passwordEntry, usersDatabase[keyEntry]['password'])) {
    req.session['user_id'] = keyEntry
    res.redirect('/urls/')
  } else {
    res.send('Your username and password dont match. Please try again.')
  }
})

// POST Declaration for the /update endpoint found for each short URL after creation.
app.post('/urls/:shortURL/update', (req, res) => {
  let shortURLRef = req.params.shortURL
  urlDatabase[shortURLRef].longURL = req.body.longURL
  res.redirect('/urls/')
})

// POST Declaration to handle deleting of a url.
app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL]
  res.redirect('/urls')
})

// GET Declaration to handle incoming requests from the outside.
// Looks for the record of the short url being requested.
// Forwards viewer to applicalble longURL.
app.get('/u/:shortURL', (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL]['longURL']
    res.redirect(longURL)
  } else {
    res.send('That url has not been shortened with this service')
  }
})

/* ---------------- */
// Helper Functions.//
/* ---------------- */

// Helper function to generate strings of 6 characters to use as the 'short' URL
function generateRandomString () {
  let finalStr = ''
  const possibleChar = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const length = 6

  for (let i = 0; i < length; i++) {
    let random = Math.floor(Math.random() * possibleChar.length)
    finalStr += possibleChar.substring(random, random + 1)
  }

  return finalStr
}

// Helper function to identify current users by crossreferencing current user with ID passed in via form.
function lookupByEmail (inputUserEntry) {
  var responseID = ''
  Object.keys(usersDatabase).forEach(function (key) {
    if (usersDatabase[key]['email'] === inputUserEntry) {
      responseID = usersDatabase[key]['id']
    } else {
      responseID = undefined
    }
  })
  return responseID
}

// Reflect back the port on the server side.
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})
