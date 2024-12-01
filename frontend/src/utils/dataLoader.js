import * as d3 from 'd3';

// Load a CSV file from the public directory
export async function loadCSV(fileName) {
  const data = await d3.csv(`/data/${fileName}`);
  return data;
}