export function ThemeScript() {
  const themeScript = `
    (function() {
      function getTheme() {
        try {
          const stored = localStorage.getItem('zzp-hub-theme');
          if (stored === 'light' || stored === 'dark') return stored;
          if (stored === 'system' || !stored) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          }
        } catch (e) {}
        return 'light';
      }
      
      const theme = getTheme();
      document.documentElement.classList.add(theme);
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
