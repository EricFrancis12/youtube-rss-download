const fs = require('fs');



const brands = [];

const brandsFolderContents = fs.readdirSync('./brands');
brandsFolderContents.forEach(item => {
    const stats = fs.statSync(`./brands/${item}`);
    if (stats.isDirectory && item !== 'brands.js') {
        //const files = fs.readdirSync(`./brands/${item}`);
        
        try {
            const result = require(`./${item}/${item}.js`);
            brands.push(result);
        } catch (err) {
            console.error(err);
        }
    }
});



module.exports = brands;