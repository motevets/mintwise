//@flow

const CategoryMapRepository = require('../lib/CategoryMapRepository');
const SplitwiseRepository = require('../lib/SplitwiseRepository');
const MintRepository = require('../lib/MintRepository');
const transformMintExportIntoSplitwiseExpense = require('../lib/transformMintExportIntoSplitwiseExpense.js');
const AssertionError = require("assert").AssertionError;

/*:: import type {MintTransaction} from '../lib/MintRepository' */
/*:: import type {SplitwiseTopLevelCategory} from '../lib/SplitwiseRepository' */
/*:: import type {SplitwiseExpense} from '../lib/transformMintExportIntoSplitwiseExpense' */
/*:: import type MintwiseCliView from '../app/MintwiseCliView' */

/*:: type MintwiseControllerConstructorParameters = {|
    offline: boolean,
    save: boolean,
    exportFile: string,
    splitwiseGroupId: string,
    splitwisePayerId: number,
    splitwiseBorrowerId: number,
    splitwiseConsumerKey: string,
    splitwiseConsumerSecret: string,
    mintUsername: string,
    mintPassword: string,
    startDate: string,
    endDate: string,
    log: function,
    view: MintwiseCliView,
    canadianAccounts: string[],
  |}
*/

class MintSplitwiseController {
  /*:: _view: MintwiseCliView */
  /*:: _save: boolean */
  /*:: _exportFile: string */
  /*:: _splitwiseGroupId: string */
  /*:: _splitwisePayerId: number */
  /*:: _splitwiseBorrowerId: number */
  /*:: _log: function */

  /*:: _splitwiseRepository: SplitwiseRepository */
  /*:: _mintRepository: MintRepository */
  /*:: _transactions: Promise<MintTransaction[]> */
  /*:: _expenses: SplitwiseExpense[] */
  /*:: _categories: Promise<SplitwiseTopLevelCategory[]> */
  /*:: _splitExpense: boolean[] */

  constructor(options /*:MintwiseControllerConstructorParameters*/) {
    this._view = options.view;
    this._log = options.log;
    this._save = options.save;
    this._splitwiseGroupId = options.splitwiseGroupId;
    this._splitwisePayerId = options.splitwisePayerId;
    this._splitwiseBorrowerId = options.splitwiseBorrowerId;

    this._splitwiseRepository = new SplitwiseRepository({
      consumerKey: options.splitwiseConsumerKey,
      consumerSecret: options.splitwiseConsumerSecret,
      groupId: options.splitwiseGroupId,
      log: this._log,
      offline: options.offline,
    });

    this._mintRepository = new MintRepository({
      username: options.mintUsername,
      password: options.mintPassword,
      offline: options.offline,
      exportFile: options.exportFile,
      startDate: options.startDate,
      endDate: options.endDate,
      canadianAccounts: options.canadianAccounts,
    });

    this._expenses = [];
    this._splitExpense = [];
  }

  async init(){
    await this.selectTransactionsToSplit();
    await this.confirmTransactionsToSplit();
    this.saveExpensesIfRequested();
  }

  async selectTransactionsToSplit() {
    const transactions = await this.transactions;
    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      this._splitExpense[i] = false;
      if (transaction.isCredit) {
        this._view.showTransactionWithMessage(transaction, 'Skipping. MintWise does not currently support credit transactions.');
        continue;
      }
      if (! await this._view.askUserWhetherToIncludeTransaction(transaction)) {
        continue;
      }
      this._splitExpense[i] = true;
      const mintCategory = transaction.category;
      let categoryId = CategoryMapRepository.getSplitwiseCategoryId(mintCategory);
      if (!categoryId) {
        const chosenCategory = this._view.askUserForCorrespondingSplitwiseCategory(mintCategory, await this.categories);
        CategoryMapRepository.saveMintToSplitwiseMapping(mintCategory, chosenCategory.id, chosenCategory.name);
        categoryId = chosenCategory.id;
      }

      this._expenses[i] = (transformMintExportIntoSplitwiseExpense(transaction, {
        payerId: this._splitwisePayerId,
        borrowerId: this._splitwiseBorrowerId,
        groupId: this._splitwiseGroupId,
        categoryId,
        log: this._log
      }));
    }
  }

  async confirmTransactionsToSplit(){
    const selectedExpensesCategoryLabels = this.selectedExpenses.map(expense => (
      CategoryMapRepository.getSplitwiseNameFromSplitwiseId(expense.category_id) || ''
    ));

    const confirmed = this._view.confirmTransactionsToSplit({
      selectedTransactions: await this.selectedTransactions,
      selectedExpensesCategoryLabels: selectedExpensesCategoryLabels,
      unselectedTransactions: await this.unselectedTransactions
    });

    if(!confirmed) {
      this._view.notifyOfStartingOver();
      await this.selectTransactionsToSplit();
      await this.confirmTransactionsToSplit();
    }
  }

  async saveExpensesIfRequested(){
    if (this._save) {
      await this._splitwiseRepository.saveExpenses(this.selectedExpenses);
      this._view.notifyOfSuccessfulSplitwiseSave();
    } else {
      this._view.notifyOfDryRun();
    }
  }

  get selectedTransactions() /*:Promise<MintTransaction[]>*/ {
    return this._transactions
      .then(transactions => transactions.filter((_transaction, index) => this._splitExpense[index]));
  }

  get unselectedTransactions() /*:Promise<MintTransaction[]>*/ {
    return this._transactions
      .then(transactions => transactions.filter((_transaction, index) => !this._splitExpense[index]));
  }

  get selectedExpenses() /*:SplitwiseExpense[]*/ {
    return this._expenses.filter((_expense, index) => this._splitExpense[index]);
  }

  get transactions() /*: Promise<MintTransaction[]> */ {
    if (!this._transactions) {
      this._transactions = this._mintRepository.fetchTransactions();
    }
    return this._transactions;
  }

  get categories() {
    if (!this._categories) {
      this._categories = this._splitwiseRepository.fetchCategories();
    }
    return this._categories;
  }
}

module.exports = MintSplitwiseController;
