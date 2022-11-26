const ytdl = require('ytdl-core');
const https = require('https');
const apiKey = 'AIzaSyD' + 'xdDzdBsjewG' + 'AJB0m6kYWNV6ByXjc9yd' + 'I';
const fs = require('fs');
const {readFileSync, promises: fsPromises} = require('fs');
const path = require('path');
const ytsr = require('ytsr');


//=======================================================================================
//                               CUSTOMIZABLES
const songListFile = "jpop";
//=======================================================================================
const songs = readFileSync(songListFile, 'utf-8').split(/\r?\n/);
const directory = __dirname + '/' + songListFile + "PLAYLIST";

downloadPlaylist();



async function downloadPlaylist(){
    //create folder to store playlist
    if(!fs.existsSync(directory)){
        fs.mkdirSync(directory);
    }

    for(let i = 0; i < songs.length; i ++){
        //get each song file
        if(songs[i].length < 2){
            console.log("[" + i + "]: SKIPPED.   (" + songs[i] + ")");
            continue;
        }
        let status = await getSongFile(songs[i], directory, i);
        if(status == 0){
            console.log(">> [" + i + "]: Success.");
        }
        else if(status == 2){
            console.log("!! [" + i + "]: FAILURE: DOWNLOAD TIMED OUT.");
        }
    }
}

//unratelimited string to url function
async function getUrl2(ind, str){
    console.log("[" + ind + "]: Started. Fetching URL: " + "(str)");
    let filters = await ytsr.getFilters(str);
    let filter = filters.get('Type').get('Video');
    
    let res = await ytsr(filter.url, {limit: '1'});
    if(res.items.length > 0){
        return {url: res.items[0].url, name: res.items[0].title};
    }
    return {url : 0};
}

//retrieves song file
async function getSongFile(searchStr, dir, ind){
    let ress = await getUrl2(ind, searchStr);
    if(ress.url == 0){
        console.log("[" + ind + "]: FAILURE: VIDEO NOT FOUND FOR SEARCH STRING");
        return 1;
    }

    //trim ress.name of illegal characters
    let trimmed = ress.name.split("|").join('');
    trimmed = trimmed.split('/').join('');
    trimmed = trimmed.split('&quot;').join('');
    trimmed = trimmed.split("(").join('');
    trimmed = trimmed.split(")").join('');
    trimmed = trimmed.split("'").join('');
    trimmed = trimmed.split('"').join('');
    trimmed = trimmed.split('?').join('');
           
    try{
        console.log('[' + ind + ']: Downloading: ' + trimmed);
        await ytdl(ress.url, {filter: "audioonly"}).pipe(fs.createWriteStream(dir + "/" + trimmed + ".wav"));
        return 0;
    }catch(err){
        console.log(err);
        return 1;
    }
    
    //wait up to 15 seconds to finish downloading
    await new Promise(resolve => setTimeout(resolve, 15000));
    return 2;
}
