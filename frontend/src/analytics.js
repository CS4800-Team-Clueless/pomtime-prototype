export const pageview = (url) => {
  if (window.gtag) {
    window.gtag("config", "G-LKRB2MT3FZ", {
      page_path: url,
    });
  }
};
