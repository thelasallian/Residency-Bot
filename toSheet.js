const fs = require("node:fs");
const { google } = require("googleapis");
const serviceAccountKeyFile = "./credentials.json";
const sheetId = process.env.SHEET_ID;
require("dotenv").config();

const clientEmail = process.env.CLIENT_EMAIL;
const privateKey = process.env.PRIVATE_KEY;
const googleSheetId = process.env.SHEET_ID;
const googleSheetPage = "Residency";

// authenticate the service account
const googleAuth = new google.auth.JWT(
  clientEmail,
  null,
  privateKey.replace(/\\n/g, "\n"),
  "https://www.googleapis.com/auth/spreadsheets"
);

async function readSheet() {
  try {
    // google sheet instance
    const sheetInstance = await google.sheets({
      version: "v4",
      auth: googleAuth,
    });
    // read data in the range in a sheet
    const infoObjectFromSheet = await sheetInstance.spreadsheets.values.get({
      auth: googleAuth,
      spreadsheetId: googleSheetId,
      range: `${googleSheetPage}!A:B`,
    });

    const valuesFromSheet = infoObjectFromSheet.data.values;

    // store values to array
    valuesFromSheet.shift(); // remove first row
    let sheetData = sheetToArray(valuesFromSheet);
    return sheetData;
  } catch (err) {
    console.log("readSheet func() error", err);
  }
}

async function readLogs() {
  try {
    // google sheet instance
    const sheetInstance = await google.sheets({
      version: "v4",
      auth: googleAuth,
    });
    // read data in the range in a sheet
    const infoObjectFromSheet = await sheetInstance.spreadsheets.values.get({
      auth: googleAuth,
      spreadsheetId: googleSheetId,
      range: `logs!A:C`,
    });

    const valuesFromSheet = infoObjectFromSheet.data.values;

    // store values to array
    let sheetData = sheetToArray(valuesFromSheet);
    return sheetData;
  } catch (err) {
    console.log("readLogs func() error", err);
  }
}

function getCurrentDate() {
  const currentDate = new Date();
  return currentDate.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

function timeToSeconds(time) {
  const match = time.match(/(\d+)h (\d+)m (\d+)s/);
  const [, hours, minutes, seconds] = match.map(Number);
  const timeInSeconds = hours * 3600 + minutes * 60 + seconds;
  return timeInSeconds;
}

function secondsToTime(seconds) {
  const sumHours = Math.floor(seconds / 3600);
  const sumMinutes = Math.floor((seconds % 3600) / 60);
  const sumSecondsRemaining = seconds % 60;

  const time = `${sumHours}h ${sumMinutes}m ${sumSecondsRemaining}s`;
  return time;
}

function storeDataToday(data, rows, uniqueValues) {
  for (const value of uniqueValues) {
    let sum = 0;

    for (const data of rows) {
      // Convert currentDate to the same format as returned by getCurrentDate
      let member = data[0];
      let date = data[2];

      if (member == value && value != "" && date == dateToday) {
        //convert time to seconds
        totalTimeInSeconds = timeToSeconds(data[1]);
        // Add to the sum in seconds
        sum += totalTimeInSeconds;
      }
    }

    // Convert the sum back to "h m s" format
    sumTime = secondsToTime(sum);
    console.log("Total Time:", sumTime);

    // Update the sum in the sumData object
    data.push([value, sumTime]);
  }
  return data;
}

function sheetToArray(valuesFromSheet) {
  if (valuesFromSheet) {
    const dataList = [];

    for (const row of valuesFromSheet) {
      dataList.push(row);
    }
    return dataList;
  } else {
    console.log("Error pushing data to array.");
    return [];
  }
}

function updateRecord(todayData, sheet) {
  let newMembers = 0;
  for (const data of todayData) {
    let member = data[0];
    let memberFound = false;

    console.log("Data: ", data);

    for (const [index, row] of sheet.entries()) {
      let sheetMember = row[0];

      if (member == sheetMember) {
        console.log("Member found in row: ", row);
        console.log("Member found in row index: ", index);
        updateSheet(data, index + 1); // plus 1 for removing header row
        memberFound = true;
        break;
      }
    }
    if (!memberFound) {
      console.log("Add member to sheet");
      updateSheet(data, sheet.length + 1 + newMembers); // plus 1 to jump to next empty cell in sheet
      newMembers += 1; // tracks actual sheet length while on the process of adding new members
    }
  }
}

async function updateSheet(row, index) {
  try {
    // google sheet instance
    const sheetInstance = await google.sheets({
      version: "v4",
      auth: googleAuth,
    });

    console.log("ROW TO PUT: ", row);
    index = index + 1; // plus 1 to follow sheet numbering

    // update data in the range
    await sheetInstance.spreadsheets.values.update({
      auth: googleAuth,
      spreadsheetId: googleSheetId,
      range: `${googleSheetPage}!A${index}:B`,
      valueInputOption: "RAW",
      resource: {
        values: [row],
      },
    });
  } catch (err) {
    console.log("updateSheet func() error", err);
  }
}

module.exports = {
  savetoSheet: async function savetoSheet() {
    try {
      // const csvData = fs.readFileSync("./logs.csv", "utf-8"); // Load CSV data from file

      let logs = await readLogs();
      console.log("from sheets: ", logs);

      // Converting array of arrays to a format similar to CSV rows
      const logsFormat = logs.map((row) => row.join(",")).join("\n");

      // Splitting the CSV-like string back into rows and columns
      const rows = logsFormat.split("\n").map((row) => row.split(",")); // CSV to aray
      dateToday = getCurrentDate().toString(); // get current date and turn to string to compare later
      console.log(dateToday);

      const uniqueValues = [
        ...new Set(
          rows
            .filter(
              (row) =>
                typeof row[2] !== "undefined" &&
                row[2].trim() === dateToday.trim() &&
                row[2].trim() !== ""
            )
            .map((row) => row[0])
        ),
      ];

      console.log("Data: ", rows);

      let data = [];

      // store today's logs to array
      data = storeDataToday(data, rows, uniqueValues);

      // print unique members with logs today
      console.log("unique value:", uniqueValues);

      //print data to update in sheets
      console.log("new data: ", data);

      //read from sheet
      let sheetData = await readSheet();
      console.log(sheetData);

      //update sheet
      updateRecord(data, sheetData);
      return rows;
    } catch (err) {
      console.log("error save to sheets", err);
      return [];
    }
  },

  savetoLogs: async function saveToLogs(user, time, today, callback) {
    try {
      let logs = await readLogs();
      let logs_length = logs.length;
      let index = logs_length + 1;
      let row = [user, time, today];

      console.log("row read: ", logs_length);
      // console.log("row to save: ", row);

      // google sheet instance
      const sheetInstance = await google.sheets({
        version: "v4",
        auth: googleAuth,
      });

      await sheetInstance.spreadsheets.values.update({
        auth: googleAuth,
        spreadsheetId: googleSheetId,
        range: `logs!A${index}:C`,
        valueInputOption: "RAW",
        resource: {
          values: [row],
        },
      });

      console.log("Log entry added to logs in sheets");
      callback(null);
    } catch (err) {
      console.log("error save to logs", err);
      callback(err);
    }
  },
};
