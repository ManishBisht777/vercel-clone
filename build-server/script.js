const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const mime = require("mime-types");

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_ID,
    secretAccessKey: process.env.AWS_S3_ACCESS_SECRET,
  },
});

const PROJECT_ID = process.env.PROJECT_ID;

async function init() {
  console.log("Executing script.js");

  const outDirPath = path.join(__dirname, "output");

  const process = exec(`cd ${outDirPath} && npm install && npm run build`);

  process.stdout.on("data", function (data) {
    console.log(data.toString());
  });

  process.stderr.on("data", function (data) {
    console.log(data.toString());
  });

  process.on("close", async function () {
    console.log("Build completed");

    const distFolderPath = path.join(__dirname, "dist");

    const distFolderContents = fs.readdirSync(distFolderPath, {
      recursive: true,
    });

    for (const filePath of distFolderContents) {
      if (fs.lstatSync(filePath).isDirectory()) continue;

      console.log(`Uploading file: ${filePath}`);

      const command = new PutObjectCommand({
        Bucket: "manishbisht-vercel",
        Key: `__outputs/${PROJECT_ID}/${filePath}`,
        body: fs.createReadStream(filePath),
        ContentType: mime.lookup(filePath),
      });

      await s3Client.send(command);

      console.log(`File uploaded: ${filePath}`);
    }

    console.log("Files uploaded to S3 bucket...");
  });
}

init();
