const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// Get list of branches
app.post("/api/branches", async (req, res) => {
  const { businessId, username, password } = req.body;
  if (!businessId || !username || !password) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  const auth = Buffer.from(`${username}:${password}`).toString("base64");

  try {
    const response = await axios.get(
      `https://api.phorest.com/third-party-api-server/api/business/${businessId}/branch`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      },
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch branches" });
  }
});

// Get list of reviews for selected branch
app.post("/api/reviews", async (req, res) => {
  const { businessId, branchId, username, password } = req.body;
  if (!businessId || !branchId || !username || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const auth = Buffer.from(`${username}:${password}`).toString("base64");

  try {
    const response = await axios.get(
      `https://api.phorest.com/third-party-api-server/api/business/${businessId}/review?branchId=${branchId}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      },
    );
    res.json(response.data.reviews || []);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

app.listen(PORT, () => {
  console.log(`Phorest proxy server running on http://localhost:${PORT}`);
});
