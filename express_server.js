// Include modules
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt')

// Set Port
const PORT = 8080

// Include Databases
var urlDatabase = require('./database')
var usersDatabase = {
  'userRandomID': {
    id: 'userRandomID',
    email: 'user@example.com',
    password: 'purple-monkey-dinosaur'
  },
  'user2RandomID': {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'dishwasher-funk'
  } // WHEN YOU UNCOMMENT BELOW REMEMBER TO ADD COMMA
  // 'karlsRandoKey': {
  //   id: 'karlsRandoKey',
  //   email: 'karl.chvojka@gmail.com',
  //   password: 'stuff'
  // }
}

// Set a couple things for the app
app.use(bodyParser.urlencoded({ extended: true }))
app.set('view engine', 'ejs')
app.use(cookieParser())

app.get('/', (req, res) => {
  res.send('Hello!')
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
  let templateVars = { urls: urlDatabase, user: usersDatabase[req.cookies['user_id']] }
  if (templateVars.user) {
    res.render('urls_index', templateVars)
  } else {
    res.redirect('/login')
  }
})

app.get('/register', (req, res) => {
  let templateVars = { urls: urlDatabase, user: usersDatabase[req.cookies['user_id']] }
  res.render('registration', templateVars)
})

app.get('/login', (req, res) => {
  let templateVars = { urls: urlDatabase, user: usersDatabase[req.cookies['user_id']] }
  res.render('login', templateVars)
})

app.get('/urls/new', (req, res) => {
  let templateVars = { user: usersDatabase[req.cookies['user_id']] }
  if (!req.cookies['user_id']) {
    res.redirect('/login')
  } else {
    res.render('urls_new', templateVars)
  }
})

app.get('/urls/:shortURL', (req, res) => {
  console.log('/urls/:shortURL =================================')
  console.log('params: ', req.params)
  console.log('urlDatabase', urlDatabase)
  let shortURLRef = req.params.shortURL
  console.log('long url', urlDatabase[shortURLRef].longURL)
  let templateShowVars = { shortURL: shortURLRef, longURL: urlDatabase[shortURLRef].longURL, user: usersDatabase[req.cookies['user_id']] }
  console.log('vars', templateShowVars)
  res.render('urls_show', templateShowVars)
})

app.post('/urls', (req, res) => {
  var getShortURL = generateRandomString()
  urlDatabase[getShortURL] = {}
  urlDatabase[getShortURL]['longURL'] = req.body['longURL']
  urlDatabase[getShortURL]['userID'] = req.cookies.user_id
  console.log('database: ', urlDatabase)
  res.redirect('/urls/' + getShortURL)
})

app.post('/login', (req, res) => {
  let emailEntry = req.body.email
  let passwordEntry = req.body.password
  let keyEntry = lookupByEmail(emailEntry)
  const errorCall = (errorCode) => { res.sendStatus(errorCode) }

  if (keyEntry === undefined) {
    errorCall(403)
  } else if (keyEntry && bcrypt.compareSync(passwordEntry, usersDatabase[keyEntry]['password'])) {
    res.cookie('user_id', keyEntry)
    res.redirect('/urls/')
  } else {
    errorCall(403)
  }
})

app.post('/logout', (req, res) => {
  res.clearCookie('user_id')
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
  console.log(regVars)
  res.redirect('/urls') // TODO: CHANGE BACK TO /urls
})

app.post('/urls/:shortURL/update', (req, res) => {
  console.log('/urls/:shortURL/update[ ==========================]')
  console.log(urlDatabase[req.params.shortURL])
  let shortURLRef = req.params.shortURL
  urlDatabase[req.params.shortURL]['userID'] = req.cookies.user_id
  urlDatabase[shortURLRef]['longURL'] = req.body['longURL']
  res.redirect('/urls/' + req.params.shortURL)
})

app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL]
  console.log(urlDatabase)
  res.redirect('/urls')
})

app.get('/u/:shortURL', (req, res) => {
  console.log('req: ', req)
  const longURL = urlDatabase[req.params.shortURL]['longURL']
  console.log(longURL)
  res.redirect(longURL)
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
