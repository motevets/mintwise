// @flow
const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const mintLogin = require('pepper-mint');
const AssertionError = require("assert").AssertionError;

/*::
type MintRepositoryConstructorParams = {
  username?: string,
  password?: string,
  exportFile?: string,
  offline: boolean,
  startDate?: string,
  endDate?: string,
  canadianAccounts: string[],
}
*/

/*::
type Currency = "USD" | "CAD"
*/

/*::
type PeppermintTransaction = {
  date: string,
  amount: string,
  note: string,
  omerchant: string,
  merchant: string,
  isDebit: bool,
  category: string,
  account: string
}
*/

class MintRepository {
  /*:: username : ?string */
  /*:: password : ?string */
  /*:: exportFile : ?string */
  /*:: offline : boolean */
  /*:: startDate : ?string */
  /*:: endDate : ?string */
  /*:: canadianAccounts: string[] */
  /*:: _pepperMintClient : any */

  /*:: _transactions : ?MintTransaction[] */

  constructor(params /*: MintRepositoryConstructorParams */) {
    const {username, password, exportFile, offline, startDate, endDate, canadianAccounts} = params;
    this.username = username;
    this.password = password;
    this.exportFile = exportFile;
    this.offline = offline;
    this.startDate = startDate;
    this.endDate = endDate;
    this.canadianAccounts = canadianAccounts;
  }

  async fetchTransactions() /*:Promise<MintTransaction[]>*/ {
    if (this._transactions) {
      return this._transactions;
    }
    if (!!this.exportFile) {
      const csvText = fs.readFileSync(this.exportFile);
      const rows = parse(csvText, {columns: true});
      return Promise.resolve(this.extractMintTransactionsFromCsvExport(rows));
    } else if (this.offline) {
      console.error('Cannot fetch transactions from mint.com while "offline" is set.');
      process.exit(1);
      throw new AssertionError();
    } else if (this.startDate && this.endDate) {
      return this.fetchTransactionsBetweenDates(this.startDate, this.endDate);
    } else {
      console.error('Either exportFile or startDate and endDate must be provided to fetch transactions');
      process.exit(1);
      throw new AssertionError();
    }
  }


  extractMintTransactionsFromCsvExport(data /*: any[] */)
  /*: MintTransaction[] */ {
    return data.map(row => new MintTransaction({
      date: row['Date'],
      notes: row['Notes'],
      description: row['Description'],
      amount: row['Amount'],
      type: row['Transaction Type'],
      category: row['Category'],
      account: row['Account Name'],
      currency: this._currencyOfAccount(row['Account Name']),
    }));
  }

  _currencyOfAccount(account /*: string */) /*: Currency */ {
    if (this.canadianAccounts.indexOf(account) === -1) {
      return "USD"
    } else {
      return "CAD"
    }
  }

  get _mintClient() {
    return new Promise(resolve => {
      if (this._pepperMintClient === undefined) {
        mintLogin(this.username, this.password).then(pepperMintClient => {
          this._pepperMintClient = pepperMintClient;
          resolve(pepperMintClient);
        });
      } else {
        resolve(this._pepperMintClient);
      }
    });
  }

  async fetchTransactionsBetweenDates(startDate /*:string*/, endDate /*:string*/) /*:Promise<MintTransaction[]>*/ {
    const mint = await
        this._mintClient;
    const startYear = new Date(startDate).getFullYear(); //TODO: this doesn't work for data ranges that span years
    let transactions = [];
    let offset = 0;
    let nextRawTransactions;
    do {
      nextRawTransactions = await
          mint.getTransactions({startDate, endDate, offset});
      for (let rawTransaction of nextRawTransactions) {
        console.log(rawTransaction);
        transactions.push(this.hydrateMintTransactionFromPeppermintTransaction(rawTransaction, startYear));
      }
      offset += 100;
    } while (nextRawTransactions.length === 100);
    return transactions;
  }

  hydrateMintTransactionFromPeppermintTransaction(rawTransaction /*: PeppermintTransaction */, year /*: number */) {
    const rawDate = new Date(rawTransaction.date);
    const date = `${rawDate.getMonth() + 1}/${rawDate.getDate()}/${year}`;
    const amount = Number(rawTransaction.amount.replace('$', '').replace(',', ''));
    if (isNaN(amount)) {
      console.error(rawTransaction);
      throw `amount "${rawTransaction.amount}" cannot be converted into a number`;
    }
    let notes = rawTransaction.note.length > 0 ? `${rawTransaction.note}\n\n` : '';
    notes += rawTransaction.omerchant;
    return new MintTransaction({
      date: date,
      notes: notes,
      description: rawTransaction.merchant,
      amount: amount,
      type: rawTransaction.isDebit ? 'debit' : 'credit',
      category: rawTransaction.category,
      account: rawTransaction.account,
      currency: this._currencyOfAccount(rawTransaction.account),
    });
  }
}

/*::
type MintTransactionConstructorParams = {
  type: string,
  amount: number,
  description: string,
  notes: string,
  date: string,
  category: string,
  account: string,
  currency: string
}
*/
class MintTransaction {
  /*:: _type : string */
  /*:: _amount : number */
  /*:: _description : string */
  /*:: _notes : string */
  /*:: _date : string */
  /*:: _category : string */
  /*:: _account: string */
  /*:: _currency: string */

  get category() {
    return this._category;
  }

  get date() {
    return this._date;
  }

  get notes() {
    return this._notes;
  }

  get description() {
    return this._description;
  }

  get amount() {
    return this._amount;
  }

  get type() {
    return this._type;
  }

  get account() {
    return this._account;
  }

  get currency() {
    return this._currency
  }

  get isCredit() {
    return this.type === 'credit';
  }

  constructor({type, amount, description, notes, date, category, account, currency} /*: MintTransactionConstructorParams */) {
    this._type = type;
    this._amount = amount;
    this._description = description;
    this._notes = notes;
    this._date = date;
    this._category = category;
    this._account = account;
    this._currency = currency;
  }
}

/*:: export type { MintTransaction } */
module.exports = MintRepository;


