# Video Controller Documentation
## Introduction
The `videoController.js` file contains functions for handling video uploads and streaming video content. These functions are typically used in a Node.js web application to manage video files.

`handleVideoUpload(req, res)`
### Description
This function handles the upload of video files to the server. It generates a unique filename, saves the uploaded video to a specified directory, and responds with a success message.

### Parameters
. `req` (Request Object): Represents the HTTP request, which may include the uploaded video file in the request body.
. `res` (Response Object): Represents the HTTP response, used to send a response back to the client.

### Response Codes
400: Bad Request - If no video file is uploaded.
500: Internal Server Error - If an error occurs during the upload process.
200: OK - If the video is uploaded and saved successfully.

`streamVideo(req, res)`
### Description
This function streams video content to the client. It reads a video file from the server, processes range requests (for video seeking), and streams the appropriate video chunk to the client.

### Parameters
`req` (Request Object): Represents the HTTP request, which includes parameters such as the video file name and range headers.
`res` (Response Object): Represents the HTTP response, used to stream the video content back to the client.

### Response Codes
404: Not Found - If the requested video file does not exist on the server.
416: Range Not Satisfiable - If the "Range" header is missing from the request.
500: Internal Server Error - If an error occurs during the streaming process.
206: Partial Content - If the video is successfully streamed with a specified range.

### Headers
`Content-Range`: Specifies the range of bytes being sent.
`Accept-Ranges`: Indicates that the server supports byte range requests.
`Content-Length`: Specifies the length of the video chunk being sent.
`Content-Type`: Specifies that the content is in MP4 video format.