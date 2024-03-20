// Function to load CSV data
export function loadCSV(url) {
  return fetch(url)
    .then((response) => response.text())
    .then(
      (rawCSV) =>
        Papa.parse(rawCSV, {
          header: false,
          dynamicTyping: true,
          skipEmptyLines: true,
          delimiter: ";",
        }).data
    );
}
