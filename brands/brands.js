const fs = require('fs');



const brands = [];

const brandsFolderContents = fs.readdirSync('./brands');
brandsFolderContents.forEach(item => {
    const stats = fs.statSync(`./brands/${item}`);
    if (stats.isDirectory && item !== 'brands.js') {
        const files = fs.readdirSync(`./brands/${item}`);

        if (files.length > 1 || files[0].slice(-3) !== '.js') return;

        const result = require(`./${item}/${files[0]}`);
        brands.push(result);
    }
});



module.exports = brands;