const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Pizza Delivery API is running",
  });
});

app.use("/api/auth", authRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;