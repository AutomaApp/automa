import locale from '../locales/en/newtab.json';

export default function ({ message, ...data }) {
  const normalize = (value) => value.join('');
  const interpolate = (key) => data[key];
  const named = (key) => key;

  const localeMessage = locale.log.messages[message];
  if (localeMessage) return localeMessage({ normalize, interpolate, named });

  return message;
}
