import browser from 'webextension-polyfill';
import { printLine } from './modules/print';

console.log('Content script works!');
console.log('Must reload extension for modifications to take effect.');

printLine("Using the 'printLine' function from the Print Module");

(() => {
  browser.runtime.onConnect.addListener((a, b) => {
    console.log(a, b);
  });
})();
