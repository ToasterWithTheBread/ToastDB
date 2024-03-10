const express = require('express')
const app = express()

const functions = require('./functions')

app.use(express.json());

app.use('/', functions)

app.listen(9898, () => {
  console.log("ToastDB server is listening on port: 9898")
})