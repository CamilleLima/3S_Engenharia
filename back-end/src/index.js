const express = require('express');
const app = express();

const port = 3000;

app.get('/', function (req, res) {
  res.send("Primeiro teste");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});