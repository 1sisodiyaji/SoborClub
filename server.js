const express = require('express');
const Database = require('./Database');
require("dotenv").config(); 
const app = express();
const userRoutes = require("./routes/user");
// Middleware to parse JSON
app.use(express.json());
const cors = require('cors');

Database();

app.use("/api/", userRoutes);
app.use(cors());
app.get('/', (req, res) => {
  res.send('Hello World!');
});

const PORT = process.env.PORT || 8088;
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
