const mime = require("mime-types"); // Import mime-types package

exports.putObject = async (file, fileName) => {
    try {
        console.log("MIME Type:", file.mimetype); // Debugging: Check the MIME type

        const contentType = file.mimetype || mime.lookup(fileName) || "application/octet-stream"; // Ensure a valid MIME type

        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: fileName,
            Body: file.buffer || file, 
            ContentType: contentType, 
        };

        console.log("Uploading with ContentType:", contentType); // Debugging: See what content type is being sent to S3

        const command = new PutObjectCommand(params);
        const data = await s3Client.send(command);

        if (data.$metadata.httpStatusCode !== 200) {
            console.error("Upload failed:", data);
            return;
        }

        const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
        console.log("Uploaded URL:", url);
        return { url, key: params.Key };
    } catch (err) {
        console.error("Error uploading to S3:", err);
    }
};
