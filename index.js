//@flow
const path = require('path');
const MintwiseController = require('./app/MintSplitwiseController');
const MintwiseCliView = require('./app/MintwiseCliView');
const userIO = require('./lib/userIO');
const logfile = path.join(__dirname, 'log', `log.log`);

const castToBoolean = (val) => !!val;
const argv = require('yargs')
  .options({
    'offline': {
      description: 'use cached version of categories',
      type: 'boolean',
      conflicts: 'save',
      coerce: castToBoolean,
    },
    'n': {
      alias: 'dry-run',
      type: 'boolean',
      description: 'do not save split selections to SplitWise',
      coerce: castToBoolean,
    },
    'c': {
      alias: 'config',
      config: true,
      default: 'config.json'
    },
    'f': {
      alias: 'file',
      type: 'string',
      description: 'path to Mint CSV export to split\nif absent, transactions are pulled from mint.com'
    },
    'd': {
      alias: 'debug',
      type: 'boolean',
      description: `print debug information to terminal\nnote: same information is always logged in log file`
    }
  })
  .help('h')
  .alias('h', 'help')
  .parse();

const options = {
  offline: argv.offline,
  save: !argv['dry-run'],
  exportFile: argv.file,
  splitwiseConsumerKey: argv.splitwiseConsumerKey,
  splitwiseConsumerSecret: argv.splitwiseConsumerSecret,
  splitwiseGroupId: argv.splitwiseGroupId,
  splitwisePayerId: argv.splitwisePayerId,
  splitwiseBorrowerId: argv.splitwiseBorrowerId,
  mintUsername: argv.mintUsername,
  mintPassword: argv.mintPassword,
  startDate: argv.startDate,
  endDate: argv.endDate,
  canadianAccounts: argv.canadianAccounts,
};

userIO.init({logfile, printLogsOnScreen: argv.debug});
userIO.log('argv:', options);

const view = new MintwiseCliView({print: userIO.print, log: userIO.log});
const controller = new MintwiseController({...options, view: view, log: userIO.log});

controller.init();
