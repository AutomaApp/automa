import { jsContentHandler } from '@/newtab/utils/javascriptBlockUtil';

function javascriptCode({ data }) {
  return jsContentHandler(...data);
}

export default javascriptCode;
