const { ListObjectsV2Command } = require("@aws-sdk/client-s3");
const { s3Client } = require("./s3-credentials"); // Ensure this is where your S3 client is initialized

exports.getObjectAnnouncement = async () => {
    try {
        const params = {
            Bucket: process.env.AWS_SW_BUCKET1, // Your S3 Bucket name
        };

        const command = new ListObjectsV2Command(params);
        const data = await s3Client.send(command);

        if (data.Contents) {
            // Return the keys of all images in the bucket
            const imageKeys = data.Contents.map((item) => item.Key);
            return imageKeys; // You can also include other metadata like LastModified, Size, etc.
        } else {
            return []; // No objects found
        }
    } catch (err) {
        console.error("Error fetching image list:", err);
        throw err;
    }
};
