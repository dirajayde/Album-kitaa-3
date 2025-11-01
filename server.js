// server.js
const express = require('express');
const multer  = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // tempat file front-end (index.html)

// uploads di folder 'uploads/<albumKey>/<slot>.jpg'
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const key = req.params.key;
    const dir = path.join(UPLOADS_DIR, key);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // simpan berdasarkan slot index (mis. 0..17) atau timestamp
    const slot = req.params.slot || Date.now();
    // gunakan extension dari original name
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${slot}${ext}`);
  }
});
const upload = multer({ storage });

// Create new album (returns secret album key)
app.post('/create-album', (req, res) => {
  const key = uuidv4(); // unguessable id
  const dir = path.join(UPLOADS_DIR, key);
  fs.mkdirSync(dir, { recursive: true });
  // initialize empty slots file (optional)
  const meta = { created: new Date().toISOString(), slots: Array(18).fill(null) };
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta));
  res.json({ ok: true, key });
});

// Upload photo to album/key/slot (multipart form field name: photo)
app.post('/upload/:key/:slot', upload.single('photo'), (req, res) => {
  const key = req.params.key;
  const slot = Number(req.params.slot);
  const dir = path.join(UPLOADS_DIR, key);
  if (!fs.existsSync(dir)) return res.status(404).json({ ok:false, error:'album not found' });

  // update meta.json to point to file path for that slot
  const files = fs.readdirSync(dir).filter(f => f !== 'meta.json');
  const metaPath = path.join(dir, 'meta.json');
  let meta = { slots: Array(18).fill(null) };
  if (fs.existsSync(metaPath)) meta = JSON.parse(fs.readFileSync(metaPath));
  // store relative URL path to file
  const filename = req.file.filename;
  meta.slots[slot] = `/uploads/${key}/${filename}`;
  fs.writeFileSync(metaPath, JSON.stringify(meta));
  res.json({ ok: true, url: meta.slots[slot], slot });
});

// Get album metadata (slots array with urls or null)
app.get('/album/:key', (req, res) => {
  const key = req.params.key;
  const dir = path.join(UPLOADS_DIR, key);
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
