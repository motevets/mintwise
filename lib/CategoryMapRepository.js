//@flow
const fs = require('fs');
const path = require('path');
const db = require('../data/mintAndSplitwiseCategories.json');

const absoluteDbPath = path.join(__dirname, '..', 'data', 'mintAndSplitwiseCategories.json');

module.exports = {
  getSplitwiseCategoryId: (mintCategory /*:string*/) /*:?number*/ => db.mintLabelToSplitwiseId[mintCategory],
  getSplitwiseNameFromSplitwiseId: (splitwiseId /*: number */) /*:?string*/ => db.splitwiseIdToLabel[splitwiseId.toString()],
  saveMintToSplitwiseMapping: (mintLabel /*:string*/, splitwiseId /*:number*/, splitwiseLabel /*:string*/) => {
    db.mintLabelToSplitwiseId[mintLabel] = splitwiseId;
    db.splitwiseIdToLabel[splitwiseId] = splitwiseLabel;
    fs.writeFileSync(absoluteDbPath, JSON.stringify(db, null, 2));
  }
};