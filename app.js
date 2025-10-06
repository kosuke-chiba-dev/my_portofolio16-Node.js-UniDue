const express = require("express");
require("dotenv").config();
const path = require("path");

const taskRouter = require("./routes/tasks");
const connectDB = require("./db/connect");

const app = express();
const PORT = 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/api/tasks", taskRouter);


app.use(express.static(path.join(__dirname, "public")));

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URL);
    app.listen(PORT, () => console.log(`サーバーが起動しました。(http://localhost:${PORT})`));
  } catch (err) {
    console.log(err);
  }
};
start();
