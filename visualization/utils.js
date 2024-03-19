// Function to load CSV data
export function loadCSV(url, delimiter) {
  return fetch(url)
    .then((response) => response.text())
    .then(
      (rawCSV) =>
        Papa.parse(rawCSV, {
          header: false,
          dynamicTyping: true,
          skipEmptyLines: true,
          delimiter: delimiter,
        }).data
    );
}
