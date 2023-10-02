require("dotenv").config()
const express = require('express');
const app = express();
const port = process.env.PORT || 9999;
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { Deepgram } = require("@deepgram/sdk");
const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);

const videoRoutes = require('./route/videoRoute');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up multer for video file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/api/videos/upload', upload.single('videoFile'), async(req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).send('No video file uploaded');
        }

        // Generate a unique filename for the video
        const fileName = `video_${Date.now()}.mp4`;

        // Create a write stream to save the video to the 'videos' folder
        const videoPath = path.join(__dirname, 'videos', fileName);
        const writeStream = fs.createWriteStream(videoPath);

        // Pipe the file buffer to the write stream
        writeStream.write(req.file.buffer);

          // Extract audio from the video using ffmpeg
          const audioPath = path.join(__dirname, 'videos', `audio_${Date.now()}.mp3`);

          // ffmpeg(`-hide_banner -y -i ${videoPath} ${videoPath}.mp3`);
        //   ffmpeg.setFfmpegPath()

          ffmpeg(videoPath)
              .audioCodec('pcm_s16le')
              .toFormat('wav')
              .on('end', async () => {

                // Sending the URL to a file
                const audioSource = {
                    stream: fs.createReadStream(audioPath),
                    mimetype: "audio.mp3",
                };

                async function submitAsyncRequest() {
                    try {
                        const response = await deepgram.transcription.preRecorded(audioSource, {
                            punctuate: true,
                            // other options are available
                        });
                        console.log(response.results)
                        res.send(response.results.channels[0].alternatives[0].transcript)
                    } catch (error) {
                        console.log(error)
                    }
                }
                submitAsyncRequest()
                
              })
              .save(audioPath);

        // When the stream is closed, it means the file is saved
        writeStream.end(async () => {
            console.log('Video saved to disk:', fileName);
            // console.log(response)

        });
    } catch (error) {
        console.error('Error handling video upload:', error);
        res.status(500).send('Error handling video upload');
    }
});


app.use('/', videoRoutes);

app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});