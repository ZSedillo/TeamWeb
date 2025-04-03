// const { PutObjectCommand } = require("@aws-sdk/client-s3")

// exports.putObject = async(file,fileName) => {
//     try{
//         const params = {
//             Bucket: process.env.AWS_S3_BUCKET,
//             Key: `${fileName}`,
//             Body: file.data,
//             ContentType: file.mimetype, // Automatically assigns correct MIME type
//         };
//         // const params = {
//         //     Bucket: process.env.AWS_S3_BUCKET,
//         //     Key: `${fileName}`,
//         //     Body: file,
//         //     ContentType: "image/jpg,jpeg,png",
//         //     // ContentType: "video/mp3,mp4",
//         //     // ContentType: "application/pdf,docx,xlx",
//         // }
//         const command = new PutObjectCommand(params);
//         const data = await s3Client.send(command);

//         if(data.$metadata.httpStatusCode != 200){
//             return;
//         }
//         let url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`
//         console.log(url);
//         return { url, key: params.Key };
//     }catch(err){
//         console.log(err)
//     }
// }

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

exports.putObject = async (file, fileName) => {
    try {
        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: fileName,
            Body: file,
            ContentType: "image/jpg,jpeg,png",
        };

        const command = new PutObjectCommand(params);
        const data = await s3Client.send(command);

        if (data.$metadata.httpStatusCode !== 200) {
            return;
        }

        let url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
        console.log(url);
        return { url, key: params.Key };
    } catch (err) {
        console.log(err);
    }
};
