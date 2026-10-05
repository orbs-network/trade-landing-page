const root = document.documentElement;
const toggle = document.querySelector('.theme-toggle');
const themeColor = document.querySelector('meta[name="theme-color"]');
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
let preference;

function applyTheme(theme) {
  root.dataset.theme = theme;
  themeColor.content = theme === 'dark' ? '#121214' : '#f6f6f6';
  const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`;
  toggle.setAttribute('aria-label', label);
  toggle.title = label;
}

applyTheme(preference ?? (systemTheme.matches ? 'dark' : 'light'));
toggle.hidden = false;

toggle.addEventListener('click', () => {
  preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(preference);
});

systemTheme.addEventListener('change', ({ matches }) => {
  if (!preference) applyTheme(matches ? 'dark' : 'light');
});
