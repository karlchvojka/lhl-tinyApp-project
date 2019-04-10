const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const PORT = 8080
var urlDatabase = require('./database')

app.use(bodyParser.urlencoded({ extended: true }))
app.set('view engine', 'ejs')
app.use(cookieParser())

app.get('/', (req, res) => {
  res.send('Hello!')
  console.log('Cookies: ', req.cookies)

  // Cookies that have been signed
  console.log('Signed Cookies: ', req.signedCookies)
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase)
})

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n')
})

app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies['username'] }
  res.render('urls_index', templateVars)
})

app.get('/urls/new', (req, res) => {
  let templateVars = { username: req.cookies['username'] }
  res.render('urls_new', templateVars)
})

app.get('/urls/:shortURL', (req, res) => {
  let shortURLRef = req.params.shortURL
  let templateShowVars = { shortURL: shortURLRef, longURL: urlDatabase[shortURLRef], username: req.cookies['username'] }
  res.render('urls_show', templateShowVars)
})

app.post('/urls', (req, res) => {
  var getShortURL = generateRandomString()
  urlDatabase[getShortURL] = req.body['longURL']
  console.log('database: ', urlDatabase)
  res.redirect('/urls/' + getShortURL)
})

app.post('/login', (req, res) => {
  console.log(req.body)
  res.cookie('username', req.body.username)
  res.redirect('/urls/')
})

app.post('/logout', (req, res) => {
  res.clearCookie('username')
  res.redirect('/urls')
})

app.post('/urls/:shortURL/update', (req, res) => {
  urlDatabase[req.params.shortURL] = req.body['longURL']
  console.log('database ', urlDatabase)
})

app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL]
  console.log(urlDatabase)
  res.redirect('/urls')
})

app.get('/u/:shortURL', (req, res) => {
  console.log('req: ', req)
  const longURL = urlDatabase[req.params.shortURL]
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
