const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");

dotenv.config();

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
    }
});

exports.putObjectAnnouncement = async (file, fileName) => {
    try {
        const params = {
            Bucket: process.env.AWS_S3_BUCKET1,
            Key: fileName,
            Body: file,
            ContentType: "image/jpg,jpeg,png",
        };

        const command = new PutObjectCommand(params);
        const data = await s3Client.send(command);
        console.log("S3 Response:", data);  // Log response for debugging

        if (data.$metadata.httpStatusCode !== 200) {
            console.log(`Error: Failed to upload image. HTTP Status: ${data.$metadata.httpStatusCode}`);
            return;
        }

        let url = `https://${process.env.AWS_S3_BUCKET1}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
        console.log("Uploaded Image URL:", url);
        return { url, key: params.Key };
    } catch (err) {
        console.error("Error uploading to S3:", err);
    }
};
