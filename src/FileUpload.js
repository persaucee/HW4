import React, { Component } from 'react';
import * as d3 from 'd3';
import './App.css';

class FileUpload extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedFile: null,
      parsedData: null,  // Store the parsed CSV data
    };
  }
  
  handleFileSubmit = () => {
    console.log("handleFileSubmit triggered!");
    const { selectedFile } = this.state;
    console.log("Selected file:", selectedFile);

    if (selectedFile) {
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        const csvText = e.target.result;
        const parsedJsonData = this.csvToJson(csvText);
        console.log("Parsed data:", parsedJsonData);
        this.setState({ parsedData: parsedJsonData });
        this.props.setUploadedData(parsedJsonData);
      };
      fileReader.readAsText(selectedFile);
    } else {
      console.log("No file selected!");
    }
  };

  csvToJson = (csvContent) => {
    const csvLines = csvContent.split("\n");  // Split by new line to get rows
    const columnHeaders = csvLines[0].split(",").map(h => h.trim()); // Split first row to get headers
    const parsedDataArray = [];
    const dateParser = d3.timeParse("%Y-%m-%d"); // Parse dates in format YYYY-MM-DD

    for (let rowIndex = 1; rowIndex < csvLines.length; rowIndex++) {
      if (!csvLines[rowIndex].trim()) continue; // Skip empty lines
      
      const rowValues = csvLines[rowIndex].split(","); // Split each line by comma
      const rowObject = {};

      // Map each column value to the corresponding header
      columnHeaders.forEach((columnName, columnIndex) => {
        const cellValue = rowValues[columnIndex]?.trim();
        
        // Parse Date column as Date object
        if (columnName === 'Date') {
          rowObject[columnName] = dateParser(cellValue);
        } 
        // Parse numeric columns as numbers
        else if (['GPT-4', 'Gemini', 'PaLM-2', 'Claude', 'LLaMA-3.1'].includes(columnName)) {
          rowObject[columnName] = parseFloat(cellValue); // Convert to number
        } 
        // Keep other values as strings
        else {
          rowObject[columnName] = cellValue;
        }
      });

      // Add object to result if it has valid data
      if (rowObject.Date && !isNaN(rowObject['GPT-4'])) {
        parsedDataArray.push(rowObject);
      }
    }

    console.log("Parsed CSV data:", parsedDataArray);
    return parsedDataArray;
  };

  render() {
    const { selectedFile } = this.state;
    const isDisabled = !selectedFile;
    console.log("FileUpload render - selectedFile:", selectedFile, "isDisabled:", isDisabled);

    return (
      <div style={{ backgroundColor: "#f0f0f0", padding: 20 }}>
        <h2>Upload a CSV File</h2>
        <div>
          <input
            type="file"
            accept=".csv"
            onChange={(event) => {
              console.log("File selected:", event.target.files[0]);
              this.setState({ selectedFile: event.target.files[0] });
            }}
          />
          <button
            type="button"
            className="upload-button"
            disabled={isDisabled}
            onClick={() => {
              console.log("BUTTON CLICKED!!!");
              this.handleFileSubmit();
            }}
            style={{
              opacity: isDisabled ? 0.5 : 1,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              pointerEvents: 'auto'
            }}
          >
            Upload
          </button>
        </div>
      </div>
    );
  }
}

export default FileUpload;
