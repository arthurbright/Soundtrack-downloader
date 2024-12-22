const http = require('http');
const fs = require('fs');
const path = require('path');
const ytdl = require('@distube/ytdl-core');
const url = require('url');

// Server port
const PORT = 3000;

// Function to get the content type based on file extension
const getContentType = (filePath) => {
    const extname = path.extname(filePath);
    switch (extname) {
      case '.html':
        return 'text/html';
      case '.css':
        return 'text/css';
      case '.js':
        return 'application/javascript';
      case '.png':
        return 'image/png';
      case '.jpg':
        return 'image/jpeg';
      case '.ico':
        return 'image/x-icon';
      default:
        return 'application/octet-stream';
    }
};

ind = 1
download_dir = __dirname + "/fodder"
// clear the fodder directory
async function download_url(url) {
    // ind += 1
    str_ind = (ind - 1).toString()
    console.log('[' + str_ind + ']: Downloading: ' + url);
    dest = download_dir + "/" + str_ind + ".wav"
    try{
        // await ytdl(url, {filter: "audioonly"}).pipe(fs.createWriteStream(dest));
        stream =  ytdl(url, {filter: 'audio'})
        stream.pipe(fs.createWriteStream(dest));
        await new Promise(resolve => stream.on("finish", resolve));
        return dest;
    }
    catch(error){
        throw error;
    }
}

function filter_illegal_chars(input) {
    // Replace all characters that are NOT alphanumeric or spaces
    return input.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim();
  }

async function get_video_name(url){
    info = await ytdl.getBasicInfo(url)
    return info.videoDetails.title
}

// Create the server
const server = http.createServer(async (req, res) => {
    const parsed = url.parse(req.url, true);
    const pathname = parsed.pathname;
    const query = parsed.query;

    if (pathname === "/") {
        // Serve the HTML file
        const filePath = path.join(__dirname, 'public', 'main.html');
        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error 1');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(content);
            }
        });
    } else if (pathname=== "/download") {
        _url = query["url"]
        _url = decodeURIComponent(_url)
        console.log(_url)
        try{
            vid_name = await get_video_name(_url)
            vid_name = filter_illegal_chars(vid_name)

            const filePath = await download_url(_url)
            // Serve the file for download
            fs.access(filePath, fs.constants.F_OK, (err) => {
                if (err) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('File not found');
                } else {
                    res.writeHead(200, {
                    'Content-Type': getContentType(filePath),
                    'Content-Disposition': 'attachment; filename="' + vid_name + '.wav"',
                    });
                    const fileStream = fs.createReadStream(filePath);
                    fileStream.pipe(res);
                }
            });
        }
        catch(error){
            console.log("ERROR DOWNLOADING URL")
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end(error.toString());
        }
    } else {
        let filePath = path.join(__dirname, 'public', req.url);
        fs.readFile(filePath, (err, content) => {
            if (err) {
              if (err.code === 'ENOENT') {
                // File not found
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
              } else {
                // Other errors
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error 2');
              }
            } else {
              // Serve the file with the correct content type
              res.writeHead(200, { 'Content-Type': getContentType(filePath) });
              res.end(content);
            }
        });
    }
});


// Start the server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});