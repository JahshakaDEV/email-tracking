const express = require("express");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 3000;
const linksFile = path.join(__dirname, "links.json");
let links = {};

if (fs.existsSync(linksFile)) {
  links = JSON.parse(fs.readFileSync(linksFile, "utf-8"));
}

app.get("/new", (req, res) => {
  const id = uuidv4(); // unique random string
  const filename = `${id}.png`;

  links[id] = { created: new Date().toISOString(), opens: 0 };
  fs.writeFileSync(linksFile, JSON.stringify(links, null, 2));

  const trackingUrl = `localhost:${PORT}/${filename}`;
  res.send(`New tracking signature created: <br><code>${trackingUrl}</code>`);
});

app.get("/:id.png", (req, res) => {
  const id = req.params.id;

  if (!links[id]) {
    return res.status(404).send("Not found");
  }

  const logLine = `${new Date().toISOString()} | ID: ${id} | IP: ${req.ip} | UA: ${req.headers["user-agent"]}\n`;
  fs.appendFileSync("opens.log", logLine);

  links[id].opens += 1;
  fs.writeFileSync(linksFile, JSON.stringify(links, null, 2));

  const imgPath = path.join(__dirname, "signature.png");
  res.sendFile(imgPath);
});

app.get("/stats", (req, res) => {
  res.json(links);
});

app.listen(PORT, () => {
  console.log(`Tracker server running at http://localhost:${PORT}`);
});
