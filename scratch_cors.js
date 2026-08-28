const express = require('express');
const cors = require('cors');

const app = express();

const corsOptions = {
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.get('/', (req, res) => res.json({ ok: true }));

app.listen(3001, () => console.log('listening'));
