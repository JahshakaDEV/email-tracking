const express = require("express");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 3000;
const url = 'localhost'
const linksFile = path.join(__dirname, "links.json");
let links = {};

if (fs.existsSync(linksFile)) {
  links = JSON.parse(fs.readFileSync(linksFile, "utf-8"));
}

app.get("/new-signature", (req, res) => {
  const id = uuidv4(); // unique random string
  const filename = `${id}.png`;

  links[id] = { created: new Date().toISOString(), opens: 0 };
  fs.writeFileSync(linksFile, JSON.stringify(links, null, 2));

  const trackingUrl = `${url}:${PORT}/${filename}`;
  res.send(`New tracking signature created: <br><code>${trackingUrl}</code>`);
});

app.get("/new-pixel", (req, res) => {
  let id = uuidv4();
  id = 'px-' + id;
  const filename = `${id}.png`;

  links[id] = { created: new Date().toISOString(), opens: 0 };
  fs.writeFileSync(linksFile, JSON.stringify(links, null, 2));

  const trackingUrl = `${url}:${PORT}/${filename}`;
  res.send(`New tracking pixel created: ${trackingUrl}`);
})

app.get("/delete/:id.png", (req, res) => {
  const id = req.params.id;

  if (!links[id]) {
    return res.status(404).send("Not found");
  }

  delete links[id];
  fs.writeFileSync(linksFile, JSON.stringify(links, null, 2));
  res.send(`ID ${id} was deleted`);
})

app.get("/:id.png", (req, res) => {
  const id = req.params.id;

  if (!links[id]) {
    return res.status(404).send("Not found");
  }

  const logLine = `${new Date().toISOString()} | ID: ${id} | IP: ${req.ip} | UA: ${req.headers["user-agent"]}\n`;
  fs.appendFileSync("opens.log", logLine);

  links[id].opens += 1;
  fs.writeFileSync(linksFile, JSON.stringify(links, null, 2));

  let imgPath;
  if (id.startsWith('px-')) {
    imgPath = path.join(__dirname, "px.png")
  } else {
    imgPath = path.join(__dirname, "signature.png");
  }
  res.sendFile(imgPath);
});

app.get("/stats", (req, res) => {
  res.json(links);
});

app.listen(PORT, () => {
  console.log(`Tracker server running at http://${url}:${PORT}`);
});
