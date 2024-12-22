const ytdl = require('ytdl-core');
const fs = require('fs');
const {readFileSync, promises: fsPromises} = require('fs');
const path = require('path');
const ytsr = require('ytsr');

//=======================================================================================
//                               CUSTOMIZABLES
const songListFile = "shortlist";
const directory = __dirname + '/' + songListFile + "PLAYLIST";
//=======================================================================================

const songs = readFileSync(songListFile, 'utf-8').split(/\r?\n/);
downloadPlaylist();

async function downloadPlaylist(){
    //create folder to store playlist
    if(!fs.existsSync(directory)){
        fs.mkdirSync(directory);
    }

    let success = 0;
    let fail = 0;

    for(let i = 0; i < songs.length; i ++){
        //get each song file
        if(songs[i].length < 2){
            console.log("[" + i + "]: SKIPPED.   (" + songs[i] + ")");
            continue;
        }
        let status = await getSongFile(songs[i], directory, i);
        if(status == 0){
            console.log(">> [" + i + "]: Success.");
            success += 1;
        }
        else{
            failure += 1;
        }
    }

    console.log("=============================================================");
    console.log("Downloaded: " + success + "      Failed: " + fail);
}

//unratelimited string to url function
async function getUrl2(ind, str){
    console.log("[" + ind + "]: Started. Fetching URL: " + "("+ str + ")");
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
}
