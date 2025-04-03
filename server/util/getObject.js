const { GetObjectCommand } = require("@aws-sdk/client-s3")
const dotenv = require("dotenv");

dotenv.config();

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
    }
});

exports.getObject = async(key) => {
    try{
        const params = {
            Bucket: process.env.AWS_SW_BUCKET,
            Key: key
        }
        const command = new GetObjectCommand(params);
        const data = await s3Client.send(command);
        console.log(data);
    }catch(err){
        console.log(err);
    }
}
