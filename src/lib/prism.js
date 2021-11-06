import { highlight, languages } from 'prismjs/components/prism-core';
import 'vue-prism-editor/dist/prismeditor.min.css';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism-tomorrow.css';
import '@/assets/css/prism-editor.css';

export function highlighter(language) {
  return function (code) {
    return highlight(code, languages[language]);
  };
}
