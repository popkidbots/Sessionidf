const mega = require("megajs");

// Use environment variables — NEVER hardcode credentials
const auth = {
  email: process.env.MEGA_EMAIL || "hostdeployment@gmail.com",
  password: process.env.MEGA_PASSWORD || "taracha2004?",
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

const upload = (data, name) => {
  return new Promise((resolve, reject) => {
    if (!auth.email || !auth.password) {
      return reject(new Error("MEGA_EMAIL or MEGA_PASSWORD env vars not set"));
    }

    const storage = new mega.Storage(auth);

    const timeout = setTimeout(() => {
      reject(new Error("Mega storage connection timed out"));
    }, 30000);

    storage.on("ready", () => {
      clearTimeout(timeout);
      console.log("📦 Mega storage ready — uploading...");

      const uploadStream = storage.upload({ name, allowUploadBuffering: true });

      uploadStream.on("complete", (file) => {
        file.link((err, url) => {
          if (err) {
            reject(err);
          } else {
            storage.close();
            resolve(url);
          }
        });
      });

      uploadStream.on("error", (err) => reject(err));
      data.pipe(uploadStream);
    });

    storage.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
};

module.exports = { upload };
