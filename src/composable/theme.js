import { ref, onMounted } from 'vue';
import browser from 'webextension-polyfill';

const themes = [
  { name: 'Light', id: 'light' },
  { name: 'Dark', id: 'dark' },
  { name: 'System', id: 'system' },
];
const isPreferDark = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches;

export function useTheme() {
  const activeTheme = ref('system');

  async function setTheme(theme) {
    const isValidTheme = themes.some(({ id }) => id === theme);

    if (!isValidTheme) return;

    let isDarkTheme = theme === 'dark';

    if (theme === 'system') isDarkTheme = isPreferDark();

    document.documentElement.classList.toggle('dark', isDarkTheme);
    activeTheme.value = theme;

    await browser.storage.local.set({ theme });
  }
  async function getTheme() {
    let { theme } = await browser.storage.local.get('theme');

    if (!theme) theme = 'system';

    return theme;
  }
  async function init() {
    const theme = await getTheme();

    await setTheme(theme);
  }

  onMounted(async () => {
    activeTheme.value = await getTheme();
  });

  return {
    init,
    themes,
    activeTheme,
    set: setTheme,
    get: getTheme,
  };
}
