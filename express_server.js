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

// Set a couple things for the app
app.use(bodyParser.urlencoded({ extended: true }))
app.set('view engine', 'ejs')
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

app.get('/', (req, res) => {
  if (req.session['user_id']) {
    res.redirect('/urls')
  } else {
    res.redirect('/login')
  }
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})

// Make the Database readable via a webpage.
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase)
})

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n')
})

app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase, user: usersDatabase[req.session['user_id']] }
  if (templateVars.user) {
    res.render('urls_index', templateVars)
  } else {
    res.redirect('/login')
  }
})

app.get('/register', (req, res) => {
  if (!req.session['user_id']) {
    let templateVars = { urls: urlDatabase, user: usersDatabase[req.session['user_id']] }
    res.render('registration', templateVars)
  } else {
    res.redirect('/urls')
  }
})

app.get('/login', (req, res) => {
  let templateVars = { urls: urlDatabase, user: usersDatabase[req.session['user_id']] }
  res.render('login', templateVars)
})

app.get('/urls/new', (req, res) => {
  let templateVars = { user: usersDatabase[req.session['user_id']] }
  if (!req.session['user_id']) {
    res.redirect('/login')
  } else {
    res.render('urls_new', templateVars)
  }
})

app.get('/urls/:shortURL', (req, res) => {
  let shortURLRef = req.params.shortURL
  console.log('short', shortURLRef)
  console.log('params', urlDatabase)
  let templateShowVars = { shortURL: shortURLRef, longURL: urlDatabase[shortURLRef].longURL, user: usersDatabase[req.session['user_id']] }
  res.render('urls_show', templateShowVars)
})

app.post('/urls', (req, res) => {
  var getShortURL = generateRandomString()
  urlDatabase[getShortURL] = {}
  urlDatabase[getShortURL]['longURL'] = req.body['longURL']
  urlDatabase[getShortURL]['userID'] = req.session.user_id
  res.redirect('/urls/' + getShortURL)
})

app.post('/login', (req, res) => {
  let emailEntry = req.body.email
  let passwordEntry = req.body.password
  let keyEntry = lookupByEmail(emailEntry)
  // const errorCall = (errorCode) => { res.sendStatus(errorCode) }
  if (keyEntry === undefined) {
    // errorCall(403)
    res.send('Your user does not exist. Please try again.')
  } else if (keyEntry && bcrypt.compareSync(passwordEntry, usersDatabase[keyEntry]['password'])) {
    req.session['user_id'] = keyEntry
    res.redirect('/urls/')
  } else {
    // errorCall(403)
    res.send('Your Please try again.')
  }
})

app.post('/logout', (req, res) => {
  req.session = null
  res.redirect('/urls')
})

app.post('/register', (req, res) => {
  // Set variables From the response.
  let regVars = usersDatabase
  const usernameEntry = req.body['email']
  const passwordEntry = req.body['password']
  const hashedPassword = bcrypt.hashSync(passwordEntry, 10)
  var randomiD = generateRandomString()
  const errorCall = (errorCode) => { res.sendStatus(errorCode) }

  // IF either filed is emtpy return 400.
  if (usernameEntry === '' || hashedPassword === '') {
    errorCall(404)
  }
  for (user in usersDatabase) {
    if (usersDatabase[user]['email'] === usernameEntry) {
      return errorCall(400)
    }
  }
  // Else add info to database
  regVars[randomiD] = {}
  regVars[randomiD]['id'] = randomiD
  regVars[randomiD]['email'] = usernameEntry
  regVars[randomiD]['password'] = hashedPassword
  res.redirect('/urls')
})

app.post('/urls/:shortURL/update', (req, res) => {
  let shortURLRef = req.params.shortURL
  urlDatabase[shortURLRef].longURL = req.body.longURL
  console.log('body', req.body)
  res.redirect('/urls/')
})

app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL]
  res.redirect('/urls')
})

app.get('/u/:shortURL', (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL]['longURL']
    res.redirect(longURL)
  } else {
    res.send('That url has not been shortened with this service')
  }
})

// Functions
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
