import sdk from "@api/verbwire";
import { create } from 'ipfs-http-client';
import Express from 'express';
import cors from 'cors';
import fs from 'fs';
import bodyParser from 'body-parser';

const PORT = process.env.PORT || 3000;
const app = Express();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
const corsOptions = {
    origin: "https://briifee.vercel.app", // Adjust this as needed
};

app.use(Express.json());
app.use(cors(corsOptions));

const ipfsClient = create({
    host: "localhost",
    port: 5001,
    protocol: 'http',
});

const addFileToIPFS = async (file) => {
    try {
        const result = await ipfsClient.add(file);
        console.log(result);
        return result;
    } catch (error) {
        console.error('Error uploading file to IPFS:', error);
        throw error;
    }
};

const getFile = async (hash) => {
    try {
        const chunks = [];
        for await (const chunk of ipfsClient.cat(hash)) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    } catch (error) {
        console.error('Error fetching file from IPFS:', error);
        throw error;
    }
};

app.get('/img/:cid', async (req, res) => {
    try {
        const exampleCID = req.params.cid;
        console.log(`Fetching file with CID: ${exampleCID}`);

        const data = await getFile(exampleCID);
        const fileSignature = data.toString('hex', 0, 4);
        let filePath = '';

        if (fileSignature === '89504e47') {
            filePath = '../client/src/assets/img_file.png';
        } else if (fileSignature === 'ffd8ffe0' || fileSignature === 'ffd8ffe1') {
            filePath = '../client/src/assets/img_file.jpg';
        } else {
            console.log('File type: Unknown');
            res.status(400).json("File type is unknown.");
            return;
        }

        fs.writeFileSync(filePath, data);
        res.status(200).json("File fetched and saved successfully.");
    } catch (error) {
        console.error('Error fetching file:', error);
        res.status(500).json("Failed to fetch the file from IPFS.");
    }
});

app.post('/share', async (req, res) => {
    try {
        console.log("/share request received");

        const base64Data = req.body.fileData;
        const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return res.status(400).json({ error: 'Invalid base64 data format.' });
        }

        const [, mimeType, base64EncodedData] = matches;
        const fileExtension = mimeType.split('/')[1];
        const fileName = `output.${fileExtension}`;

        // Decode base64 and save the file locally
        const imageData = Buffer.from(base64EncodedData, 'base64');
        fs.writeFileSync(fileName, imageData);

        // Authenticate and upload the image to IPFS via Verbwire
        sdk.auth('pk_live_fe5b252a-ac8c-4882-a4b4-fdfb703af107');
        sdk.postNftStoreFile({ filePath: fileName })
            .then(({ data }) => {
                console.log('File uploaded to IPFS:', data.ipfs_storage.ipfs_url);
                res.status(200).json({ message: 'Image saved and uploaded to IPFS successfully', cid: data.ipfs_storage.ipfs_url });
            })
            .catch(err => {
                console.error('IPFS Upload Error:', err);
                res.status(500).json({ error: 'Error uploading to IPFS' });
            });

    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).send('Error processing request');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});
