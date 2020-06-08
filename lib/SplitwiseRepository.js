//@flow

const Splitwise = require('splitwise');
const fs = require('fs');
const path = require('path');

/*:: import type {SplitwiseExpense} from './transformMintExportIntoSplitwiseExpense' */
/*::
type SplitwiseRepositoryConstructorParams = {|
  consumerKey: string,
  consumerSecret: string,
  groupId: string,
  log: function,
  offline: boolean,
|}
 */

/*::
  export type SplitwiseCategory = SplitwiseTopLevelCategory | SplitwiseSubcategory;
*/

/*::
  export type SplitwiseTopLevelCategory = {
    id: number,
    name: string,
    subcategories: SplitwiseSubcategory[]
  };
*/

/*::
  type SplitwiseSubcategory = {
    id: number,
    name: string,
  };
*/

class SplitwiseRepository {
  /*:: sw : Splitwise*/
  /*:: log: function */

  /*:: offline: boolean */

  constructor(options /*:SplitwiseRepositoryConstructorParams*/) {
    this.sw = Splitwise({
      consumerKey: options.consumerKey,
      consumerSecret: options.consumerSecret,
      group_id: options.groupId,
      logger: options.log
    });
    this.log = options.log;
    this.offline = options.offline;
  }

  saveExpenses(expenses /*:SplitwiseExpense[]*/) {
    expenses.forEach(expense => {
      this.sw.createExpense(expense)
        .then((result) => {
          this.log('===SUCCESS====');
          this.log(expense);
          this.log('---response---');
          this.log(result);
          this.log();
        })
        .catch((error) => {
          this.log('!~~~ERROR~~~~!');
          this.log(expense);
          this.log('---response---');
          this.log(error);
          this.log();
        });
    });
  }

  async fetchCategories() /*: Promise<SplitwiseTopLevelCategory[]> */ {
    const relativeCachePath = '../data/splitwiseCategories.json';
    if (!this.offline) {
      //$FlowFixMe
      return require(relativeCachePath);
    }

    const categories = await this.sw.getCategories();
    fs.writeFileSync(__dirname + '/' + relativeCachePath, JSON.stringify(categories, null, 2));
    return categories;
  }
}

module.exports = SplitwiseRepository;
