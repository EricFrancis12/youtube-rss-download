const DOWNLOADS_ = './resources/videos/downloads/';

require('dotenv').config();
const fs = require('fs');

const axios = require('axios');
const ytdl = require('ytdl-core');

const express = require('express');
const app = express();
app.set('view engine', 'ejs');
app.use(express.json());

const xml2js = require('xml2js');
const parser = new xml2js.Parser();

const brands = require('./brands/brands');
const brandsJSON = require('./brands/brandsJSON');
const telegram = require('./telegram/telegram');
const utils = require('./utils/utils');



app.get('/', (req, res) => {
    const brandsData = brandsJSON.getBrandsJSON();

    res.status(200).render('index', {
        brandsData: brandsData
    });
});

app.get('/resources/videos/downloads/:folder/:file', (req, res) => {
    res.status(200).download(`${DOWNLOADS_}${req.params.folder}/${req.params.file}`);
});





function main() {
    const date = utils.formatDate(Date.now());
    console.log(date + ' -- running main()');

    brands.forEach(brand => {

        brand.sources.YT.forEach(channel => {
            const rssFeedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.channel_id}`;
            getnewItems(rssFeedUrl, channel, brand);
        });
    });

    handleQueue();



    // randomly set up next pass, so YouTube is less likely to detect pattern:
    const baseTimeout = oneHour;
    const minTimeout = oneHour / 2;

    let timeout = Math.random().toFixed(2) * baseTimeout;
    if (!utils.isEmpty(minTimeout) && minTimeout > timeout) timeout += minTimeout;

    setTimeout(main, timeout);
}

const oneHour = 1000 * 60 * 60;





function getnewItems(rssFeedUrl, channel, brand) {
    axios.get(rssFeedUrl)
        .then(response => {
            const data = response.data;

            parser.parseString(data, async (parseErr, result) => {
                if (parseErr) {
                    console.err(parseErr);
                    return;
                }

                const newestV = result.feed.entry[0].id[0].split(':')[2];

                if (newestV === channel.lastKnownV) return;
                channel.lastKnownV = newestV;

                const queueItem = {
                    v: newestV,
                    url: `https://youtube.com/watch?v=${newestV}`,
                    title: result.feed.entry[0].title[0],
                    channel: channel,
                    published: result.feed.entry[0].published[0],
                    brand: brand
                }

                queue.push(queueItem);
                handleQueue();
            });
        });
}



const queue = [];
let handlingQueue = false;

function handleQueue() {
    const date = utils.formatDate(Date.now());
    console.log(date + ' -- running handleQueue()');
    if (queue.length === 0 || handlingQueue) return;

    handlingQueue = true;

    const dir = `${DOWNLOADS_}${queue[0].channel.channel_id}`;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);

    const outputPath = `${dir}/${queue[0].v}.mp4`;
    if (fs.existsSync(outputPath)) {
        queue.shift();
        handlingQueue = false;
        return;
    }



    // randomly set up next call:
    const baseTimeout = 75_000;
    const minTimeout = 45_000;

    let timeout = Math.random().toFixed(2) * baseTimeout;
    if (!utils.isEmpty(minTimeout) && minTimeout > timeout) timeout += minTimeout;

    console.log(timeout);
    setTimeout(() => {

        try {
            console.log(`***** starting download: ${outputPath}`);
            ytdl(queue[0].url, { quality: '22' })
                .pipe(fs.createWriteStream(outputPath))
                .on('close', () => {

                    const item = queue.shift();

                    const timestamp = Date.now();
                    const timestampFormated = utils.formatDate(timestamp);
                    const downloadUrl = `${process.env.PROTOCOL__}${process.env.DOMAIN}/resources/videos/downloads/${item.channel.channel_id}/${item.v}.mp4`;

                    const pathTo_brandJSON = `./brands/${item.brand.name}/${item.brand.name}.json`;
                    const brandJSON = require(pathTo_brandJSON);

                    if (!brandJSON) brandJSON = {};
                    if (!brandJSON.outputArr) brandJSON.outputArr = [];

                    brandJSON.outputArr.push({
                        v: item.v,
                        url: item.url,
                        title: item.title,
                        channel: item.channel,
                        published: item.published,
                        brand: item.brand,
                        timestamp: timestamp,
                        timestampFormated: timestampFormated,
                        outputPath: outputPath,
                        downloadUrl: downloadUrl
                    });

                    fs.writeFileSync(pathTo_brandJSON, JSON.stringify(brandJSON));

                    telegram.sendMessage(`
                        New video from ${item.channel.name}
                        \n
                        Download: ${downloadUrl}
                        \n
                        Title: ${item.title}
                        \n
                        Published: ${item.published}
                        \n
                        Original YT Url: https://youtube.com/watch?v=${item.v}
                        \n
                        Creator handle: ${item.channel.handle}
                    `);

                    handlingQueue = false;

                    handleQueue();

                    console.log(`***** download completed: ${outputPath}`);
                    console.log('current queue length: ' + queue.length);
                })
                .on('error', (err) => {
                    console.error(err);
                })
                ;

        } catch (err) {
            console.error(err);
        }
    }, timeout);

}





app.listen(process.env.PORT, () => {
    console.log(`~ Server running at ${process.env.DOMAIN}`);

    handleQueue();
    main();
});
