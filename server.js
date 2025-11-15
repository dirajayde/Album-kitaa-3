const express = require("express");
const path = require("path");
const app = express();

// PORT untuk Railway
const PORT = process.env.PORT || 8080;

// Folder public (tempat index.html)
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});  const dir = path.join(UPLOADS_DIR, key);
  const metaPath = path.join(dir, 'meta.json');
  if (!fs.existsSync(metaPath)) return res.status(404).json({ ok:false, error:'album not found' });
  const meta = JSON.parse(fs.readFileSync(metaPath));
  res.json({ ok:true, meta });
});

// Serve uploaded files statically at /uploads
app.use('/uploads', express.static(UPLOADS_DIR));

// simple viewer redirect (optional) - serve index.html which reads album key from URL
// e.g. https://yourdomain.com/view/ALBUM_KEY
app.get('/view/:key', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`Server ready on port ${PORT}`));
