//@flow

const fs = require('fs');
const dateFormat = require('dateformat');

/*::
  type userIOInitParams = {
    logfile: string,
    printLogsOnScreen: boolean
  }
*/

/*::
  export type UserIO = {|
    init: (userIOInitParams) => void,
    print: (...any) => void,
    format: (...any) => string,
    log: (...any) => void,
  |}
*/

let _logfile;
let _printLogsOnScreen;

const userIO /*:UserIO*/ = {

  init: ({logfile, printLogsOnScreen = false} /*:userIOInitParams*/) => {
    _logfile = logfile;
    _printLogsOnScreen = printLogsOnScreen;
    userIO.log(`\n\n\n==${dateFormat(new Date(), 'isoDateTime')}================================`);
  },

  print: (...args) => {
    args.forEach(arg => {
      console.log(userIO.format(arg));
    });
  },

  format: (arg) => {
    if (typeof arg === 'string') {
      return arg
    } else {
      return JSON.stringify(arg, null, 2);
    }
  },

  log: (...args) => {
    if(_printLogsOnScreen) {
      userIO.print(...args);
    }
    args.forEach(arg => {
      fs.appendFileSync(_logfile, userIO.format(arg) + '\n');
    });
  }
};

module.exports = userIO;