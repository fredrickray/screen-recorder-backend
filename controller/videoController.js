// In videoController.js
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { Deepgram } = require("@deepgram/sdk");
const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);

const handleVideoUpload = async (req, res) => {
    try {
        // console.log(req)
        // const { file } = req
        if (!req.file || !req.file.buffer) {
            return res.status(400).send('No video file uploaded');
        }

        // Generates a unique filename
        const fileName = `video_${Date.now()}.mp4`;

        // Create a write stream to save the video to the 'videos' folder
        const filePath = path.join(__dirname, '../videos', fileName);
        const writeStream = fs.createWriteStream(filePath);

        // Pipe the file buffer to the write stream
        writeStream.write(req.file.buffer);


          // Extract audio from the video using ffmpeg
          const audioPath = path.join(__dirname, '../videos', `audio_${Date.now()}.mp3`);
          let transcription;

        ffmpeg(filePath)
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
                        transcription = response.results.channels[0].alternatives[0].transcript
                        res.send({
                            message: "Video uploaded and saved successfully",
                            transcription
                        })
                    } catch (error) {
                        console.log(error)
                    }
                }
                submitAsyncRequest()
                
              })
              .save(audioPath);

        // When the stream is closed, it means the file is saved
        writeStream.end(() => {
            console.log('Video saved to disk:', fileName);
            // res.status(206).send({
            //     message: "Video uploaded and saved successfully",
            //     // transcription
            // });
        });
    } catch (error) {
        console.error('Error handling video upload:', error);
        res.status(500).send('Error handling video upload');
    }
};


const streamVideo = async (req, res) => {
    try {
        // Get the video file name from a parameter in the request
        const { fileName } = req.params;

        if(fileName === '') {
            return res.status(400).json({ message: "Please provide a valid video ID" })
        }

        // Define the directory where video files are stored
        const videoDirectory = '/Users/fredrickanyanwu/Documents/screen-recorder-backend/videos';

        // Check if the file exists in the directory
        const videoPath = path.join(videoDirectory, fileName);

        if (!fs.existsSync(videoPath)) {
            return res.status(404).send('Video not found');
        }

        // Get the size of the video file
        const size = fs.statSync(videoPath).size;

        // Get the range header from the request
        const { range } = req.headers;

        if (!range) {
            return res.status(416).send('Range header needed');
        }

        // Parse the range header
        const [start, end] = range.replace(/bytes=/, '').split('-');
        const chunkSize = (end - start) + 1;

        // Set headers for the response
        const headers = {
            'Content-Range': `bytes ${start}-${end}/${size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': 'video/mp4',
        };

        // Send 206 Partial Content status code
        res.writeHead(206, headers);

        // Create a read stream for the video file and pipe it to the response
        const stream = fs.createReadStream(videoPath, { start: Number(start), end: Number(end) });
        stream.pipe(res);
    } catch (error) {
        console.error('Error streaming video:', error);
        res.status(500).send('Error streaming video');
    }
};

const fileName = '/Users/fredrickanyanwu/Documents/screen-recorder-backend/videos/video_1696206052687.mp4';
const streamVideos = async (req, res) => {
  const range = req.headers.range;
  if (!range) {
    return res.send('Range header needed');
  }
  console.log(range);
  const size = fs.statSync(fileName).size;
  console.log(size);
  const CHUNCK_SIZE = 2 * (1000 * 100);
  const start = Number(range.replace(/\D/g, ''));
  const end = Math.min(start + CHUNCK_SIZE + 1, size);
  const rangeHeader = `bytes ${start}-${end}/${size}`;
  const contentLength = end - start + 1;

  const headers = {
    'Content-Range': rangeHeader,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': 'video/mp4',
  };

  res.writeHeader(206, headers);
  const stream = fs.createReadStream(fileName, { start, end });
  console.log('here');
  stream.pipe(res);
};


const getAllVideos = async (req, res) => {

}


module.exports = {
    handleVideoUpload,
    streamVideo,
    streamVideos
};
