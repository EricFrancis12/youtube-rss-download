const fs = require('fs');


function getBrandsJSON() {
    const brandsJSON = [];

    const brandsFolderContents = fs.readdirSync('./brands');
    brandsFolderContents.forEach(item => {
        const stats = fs.statSync(`./brands/${item}`);
        if (stats.isDirectory && item !== 'brands.js' && item !== 'brandsJSON.js') {
            //const files = fs.readdirSync(`./brands/${item}`);

            try {
                const result = require(`./${item}/${item}.json`);
                brandsJSON.push(result);
            } catch (err) {
                console.error(err);
            }
        }
    });

    return brandsJSON;
}



module.exports = {
    getBrandsJSON
}