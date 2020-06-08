# mintwise

Imports a Mint transactions into a Splitwise group and splits the expenses (currently with only one other person.)

## Usage

Mintwise can copy Mint transactions into Splitwise in one of two ways:

* automatically copy all transactions from Mint within a given date range
* manually copy all of the [transactions exported from Mint into a CSV].

### Prerequisites
* [Node.js] (currently tested against v10.19; your millage may vary with other node versions)
* [Google Chrome] or [Chromium] (only needed if you want to automatically import transactions)

### Setup

1. clone this repo `git clone https://github.com/motevets/mintwise`
1. move into the cloned repo with `cd mintwise`
1. copy the example config file `cp config.example.json config.json`
1. configure `config.json`

#### config.json
Populate your `config.json` with the following

| key                     | type             | description                                                                                                                 |
|-------------------------|------------------|-----------------------------------------------------------------------------------------------------------------------------|
| splitwiseConsumerKey    | string           | API key for Splitwise                                                                                                       |
| splitwiseConsumerSecret | string           | API secret for Splitwise                                                                                                    |
| splitwiseGroupId        | string           | the Splitwise group in which to place the expenses                                                                          |
| splitwisePayerId        | integer          | your Splitwise user ID                                                                                                      |
| splitwiseBorrowerId     | integer          | the Splitwise user ID for the person you're splitting expenses with                                                         |
| mintUsername            | string           | (optional, automatic import only) your Mint username                                                                        |
| mintPassword            | string           | (optional, automatic import only) your Mint password                                                                        |
| startDate               | string           | (optional, automatic import only) the start of the date range (inclusive) from which to import expenses (mm/dd/yyyy format) |
| endDate                 | string           | (optional, automatic import only) the end of the date range (inclusive) from which to import expenses (mm/dd/yyyy format)   |
| canadianAccounts        | array of strings | (optional) Mint accounts whose transaction are in Canadian dollars; all other accounts are assumed to be USD            |

### Running mintwise

To automatically pull from Mint using your username and password run:
```
node .
```
_Note: you will see a Chrome/Chromium window pop-up, fill in your username and password, and ask you for two-factor
authentication. If you are not comfortable using this method (I don't blame you,) export your transactions manually and
use the method below._

To copy exported transactions into Splitwise run:
```
node . -f PATH_TO_CSV_EXPORT
```

With either method, you will be prompted one-by-one per transaction to select whether or not you want to split it.
Mintwise does it's best to automatically translate the Mint transaction category into a Splitwise category, but if it
can't, it will ask you to map the category manually. It will save this mapping for future transactions/runs.

## Known issues
The following are bugs and/or missing features. Please feel free to hack on 

* currently you can only split with one person in your Splitwise group
* date ranges for automatic import cannot span over a new year (e.g. 12/20/2019 to 01/10/2020 won't work)
* currently you cannot split "credit" transaction (i.e. when you were paid or refunded money)
* you cannot go back if you accidentally included a transaction; you have to start over
* there are no tests :O

## Questions, issues, pull requests
I originally made this for myself and had a lot of fun over engineering it. If you think this would help you, but
you're having trouble getting started due to incomplete documentation or a missing feature, please open an issue or a
pull request, I'm very open to improvements.

[transactions exported from Mint into a CSV]: https://help.mint.com/Accounts-and-Transactions/888960591/How-can-I-download-my-transactions.htm
[Node.js]: https://nodejs.org/en/download/
[Google Chrome]: https://www.google.com/chrome/
[Chromium]: https://www.chromium.org/Home