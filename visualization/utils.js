// Function to load CSV data
export function loadCSV(url) {
  return fetch(url)
    .then((response) => response.text())
    .then(
      (rawCSV) =>
        Papa.parse(rawCSV, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
        }).data
    );
}
