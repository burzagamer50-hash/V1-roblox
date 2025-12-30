const cors = require("cors");
app.use(cors());
const express = require("express");
const app = express();

app.use(express.json());
const fs = require("fs");
const path = require("path");
const staffPath = path.join(__dirname, "staff.json");

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  const staffData = JSON.parse(fs.readFileSync(staffPath, "utf8"));
  const user = staffData.staff.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: "Invalid login" });
  }

  res.json({
    user: {
      username: user.username,
      rank: user.rank
    }
  });
});

// نخزن آخر رسالة
let lastMessage = null;

// الموقع يرسل
app.post("/test", (req, res) => {
  lastMessage = {
    message: req.body.message,
    action: req.body.action,
    time: Date.now()
  };

  console.log("📩 From Website:", lastMessage);
  res.json({ success: true });
});

// روبلوكس يسحب
app.get("/poll", (req, res) => {
  res.json(lastMessage || {});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
