const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const app = express();
const { authSocket, socketServer } = require("./socketServer");
const posts = require("./routes/posts");
const users = require("./routes/users");
const comments = require("./routes/comments");
const messages = require("./routes/messages");
const PostLike = require("./models/PostLike");
const Post = require("./models/Post");

dotenv.config();

const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "https://guard-connect-backend-z64c.vercel.app/"],
  },
});

io.use(authSocket);
io.on("connection", (socket) => socketServer(socket));
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;

// Tangani event error dari koneksi MongoDB
db.on('error', (err) => {
  console.error('Kesalahan koneksi MongoDB:', err);
  process.exit(1); // Keluar dari aplikasi jika terjadi kesalahan koneksi
});

// Tangani event berhasil terkoneksi ke MongoDB
db.once('open', () => {
  console.log('Terhubung ke MongoDB Atlas');
  startServer(); // Panggil fungsi untuk memulai server setelah terkoneksi ke MongoDB
});

// Fungsi untuk memulai server
function startServer() {
  app.get('/', (req, res) => {
    res.send('Hello, World!');
  });

  // Jalankan server
  const server = app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
  });

  // Tangani event ketika server ditutup
  process.on('SIGINT', () => {
    console.log('Menutup server...');
    server.close(() => {
      console.log('Server ditutup dengan benar');
      process.exit(0); // Keluar dari aplikasi setelah menutup server
    });
  });
}
// mongoose.connect(
//   process.env.MONGO_URI,
//   { useNewUrlParser: true, useUnifiedTopology: true },
//   () => {
//     console.log("MongoDB connected");
//   }
// );

// httpServer.listen(process.env.PORT || 4000, () => {
//   console.log("Listening");
// });

app.use(express.json());
app.use(cors());
app.use("/api/posts", posts);
app.use("/api/users", users);
app.use("/api/comments", comments);
app.use("/api/messages", messages);

if (process.env.NODE_ENV == "production") {
  app.use(express.static(path.join(__dirname, "/client/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client/build", "index.html"));
  });
}
