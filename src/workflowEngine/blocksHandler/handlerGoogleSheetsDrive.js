import handlerGoogleSheets from './handlerGoogleSheets';

export default function (blockData, additionalData) {
  blockData.data.isDriveSheet = true;
  return handlerGoogleSheets.call(this, blockData, additionalData);
}
