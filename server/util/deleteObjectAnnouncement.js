const { S3Client ,DeleteObjectCommand } = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");

dotenv.config();

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
    }
});

exports.deleteObject = async(key) => {
    try {
        const params = {
            Bucket: process.env.AWS_S3_BUCKET1,
            Key: key,
        };

        const command = new DeleteObjectCommand(params);
        const data = await s3Client.send(command);
        
        if(data.$metadata.httpStatusCode !== 204){
            return {status:400,data}
        }
        return {status:204};
    } catch (error) {
        console.error("Error deleting object:", error);
        return { success: false, message: error.message };
    }
}
