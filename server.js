const express = require('express');
const { runBot, getChats, sendSpam } = require('./bot');
const app = express();
const port = 4000//process.env.PORT;

runBot();





app.use(express.json());

app.get('/', async (req, res) => {
  res.json({message: 'Hello from bot server'})    
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
