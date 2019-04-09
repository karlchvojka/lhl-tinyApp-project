const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const PORT = 8080

var urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xk': 'http://www.google.com'
}

app.use(bodyParser.urlencoded({ extended: true }))
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
  res.send('Hello!')
})

// app.listen(PORT, () => {
//   console.log(`Example app listening on port ${PORT}`)
// })

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase)
})

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n')
})

app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase }
  res.render('urls_index', templateVars)
})

app.get('/urls/new', (req, res) => {
  res.render('urls_new')
})

app.get('/urls/:shortURL', (req, res) => {
  let shortURLRef = req.params.shortURL
  let templateShowVars = { shortURL: shortURLRef, longURL: urlDatabase[shortURLRef] }
  res.render('urls_show', templateShowVars)
})

app.post('/urls', (req, res) => {
  console.log(req.body)
  res.send('ok')
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
