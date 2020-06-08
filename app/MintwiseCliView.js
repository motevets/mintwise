//@flow

const readLine = require('readline-sync');
const Table = require('cli-table');
const columnify = require('columnify');
const colors = require('colors/safe')
/*:: import type {MintTransaction} from '../lib/MintRepository' */
/*:: import type {SplitwiseCategory, SplitwiseTopLevelCategory} from '../lib/SplitwiseRepository' */
/*:: import type {SplitwiseExpense} from '../lib/transformMintExportIntoSplitwiseExpense' */

/*::
  type MintwiseCliViewConstructorParams = {|
    print: function,
    log: function,
  |}
*/

/*::
  type confirmTransactionsToSplitParams = {|
    selectedTransactions: MintTransaction[],
    selectedExpensesCategoryLabels: string[],
    unselectedTransactions: MintTransaction[],
  |}
*/

class MintwiseCliView {
  /*:: _print: function */
  /*:: _log: function */

  constructor(options /*:MintwiseCliViewConstructorParams*/) {
    this._print = options.print;
    this._log = options.log
  }

  askUserWhetherToIncludeTransaction(transaction /*:MintTransaction*/) {
    this._showTransactionInTable(transaction);
    return askYesOrNo('Split this transaction?');
  }

  showTransactionWithMessage(transaction /*:MintTransaction*/, message /*:string*/) {
    this._showTransactionInTable(transaction);
    const prompt = message + ' (press Enter to continue) ';
    readLine.question(prompt, {hideEchoBack: true, mask: ''});
  }

  askUserForCorrespondingSplitwiseCategory(mintCategory /*:string*/, categories /*:SplitwiseTopLevelCategory[]*/) /*:SplitwiseCategory*/ {
    const flattenedCategories = [];
    const categoryStartIndices = [];
    categories.forEach(cat => {
      categoryStartIndices.push(flattenedCategories.length);
      flattenedCategories.push({id: cat.id, name: cat.name});
      cat.subcategories.forEach(subCat => {
        flattenedCategories.push({id: subCat.id, name: `${cat.name} > ${subCat.name}`});
      })
    });

    const numCategories = flattenedCategories.length;
    const secondColStart = Math.ceil(numCategories / 3)
    const thirdColStart = Math.ceil(2 * numCategories / 3);

    const rows = [];

    for (let firstColIndex = 0; firstColIndex < secondColStart; firstColIndex++) {
      let secondColIndex = secondColStart + firstColIndex;
      let thirdColIndex = thirdColStart + firstColIndex;
      let firstColCategory = flattenedCategories[firstColIndex];
      let secondColCategory = flattenedCategories[secondColIndex] || '';
      let thirdColCategory = flattenedCategories[thirdColIndex] || '';
      rows.push({
        firstColSelectionNumber: firstColIndex + 1,
        firstColCategoryName: firstColCategory.name,
        secondColSelectionNumber: secondColIndex + 1,
        secondColCategoryName: secondColCategory.name,
        thirdColSelectionNumber: thirdColIndex + 1,
        thirdColCategoryName: thirdColCategory.name,
      });
    }

    const columns = columnify(rows, {
      showHeaders: false,
      columnSplitter: ' | ',
      config: {
        firstColSelectionNumber: {columnSplitter: ' | '},
        secondColSelectionNumber: {columnSplitter: ' | '},
        thirdColSelectionNumber: {columnSplitter: ' | '},
        firstColCategoryName: {minWidth: 35},
        secondColCategoryName: {minWidth: 35},
        thirdColCategoryName: {minWidth: 35},
      }
    });

    this._print(`The Mint category "${mintCategory}" hasn't been mapped to a Splitwise category.`);

    this._print(columns);

    const selection = readLine.question(`To which Splitwise category do you want to map "${mintCategory}"? [1–${numCategories}] `, {
      limit: val => val >= 1 && val <= numCategories,
      limitMessage: `Select a category between 1 and ${numCategories}.`,
    });

    const categoryIndex = selection - 1;

    const chosenCategory = flattenedCategories[categoryIndex];
    return chosenCategory;
  }

  confirmTransactionsToSplit(params /*:confirmTransactionsToSplitParams*/) /*:boolean*/ {
    const { selectedTransactions, selectedExpensesCategoryLabels, unselectedTransactions } = params;

    const selectedTransactionData = selectedTransactions.map((transaction, index) => ({
      action: colors.green('SPLIT'),
      date: colors.green(transaction.date),
      type: colors.green(transaction.type),
      "mint label": colors.green(transaction.category),
      "splitwise category": colors.green(selectedExpensesCategoryLabels[index]),
      amount: colors.green('$' + transaction.amount),
      description: colors.green(transaction.description),
      notes: colors.green(transaction.notes),
    }));

    const unselectedTransactionData = unselectedTransactions.map((transaction) => ({
      action: colors.red("DON'T SPLIT"),
      date: colors.red(transaction.date),
      type: colors.red(transaction.type),
      "mint label": colors.red(transaction.category),
      "splitwise category": '',
      amount: colors.red('$' + transaction.amount),
      description: colors.red(transaction.description),
      notes: colors.red(transaction.notes),
    }));

    const columns = columnify(selectedTransactionData.concat(unselectedTransactionData));

    this._notifyInfo('Please review your selections:')
    this._print(columns);
    return askYesOrNo('Do you want to upload the transactions in green labeled "SPLIT" to Splitwise?');
  }

  notifyOfStartingOver() {
    this._notifyInfo("Resetting selections. Let's take it from the top...");
  }

  notifyOfDryRun() {
    this._notifyInfo("I didn't save anything because you didn't specify the -s or --save flag.");
  }

  notifyOfSuccessfulSplitwiseSave() {
    this._notifySuccess("Successfully saved expenses to Splitwise.");
  }

  _showTransactionInTable(transaction /*:MintTransaction*/) {
    const table = new Table({
      head: [
        'date',
        'type',
        'mint category',
        'amount',
        'description',
        'notes',
      ],
      style: {head: ['cyan']},
      colWidths: [
        13,
        10,
        20,
        15,
        30,
        40,
      ]
    });

    table.push([
      transaction.date,
      transaction.type,
      transaction.category,
      `${transaction.currency} ${transaction.amount}`,
      transaction.description,
      transaction.notes,
    ]);

    this._print(table.toString());
  }

  _printBlankLine(){
    this._print('');
  }

  _notifyInfo(msg /*:string*/) {
    this._printBlankLine();
    this._print(colors.cyan.bold(msg));
  }

  _notifySuccess(msg /*:string*/) {
    this._printBlankLine();
    this._print(colors.green.bold(msg));
  }
}

function askYesOrNo(question) {
  return readLine.question(`${question} [y/n] `, {
    trueValue: ['y', 'Y'],
    falseValue: ['n', 'N'],
    limit: ['y', 'Y', 'n', 'N'],
    limitMessage: 'Please enter "y" or "n"',
  });
}

module.exports = MintwiseCliView;
