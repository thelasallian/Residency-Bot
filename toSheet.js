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

/**
 *
 * @returns valuesFromSheet, all records of members' residency hours
 * readSheet() function reads from 'TLS Residency Hours' tab in gsheet and returns the read rows,
 * except header row.
 */
async function readSheet() {
  try {
    // google sheet instance
    const sheetInstance = await google.sheets({
      version: "v4",
      auth: googleAuth,
    });

    // read data in the range in a sheet
    const dataFromSheet = await sheetInstance.spreadsheets.values.get({
      auth: googleAuth,
      spreadsheetId: googleSheetId,
      range: `${googleSheetPage}!A:B`,
    });

    const valuesFromSheet = dataFromSheet.data.values;

    valuesFromSheet.shift(); // remove first row
    return valuesFromSheet;
  } catch (err) {
    console.log("readSheet func() error", err);
  }
}

/**
 *
 * @returns valuesFromSheet, all logs of members ins and outs
 * readLogs() functions reads from 'logs' locked tab in gsheet
 */
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
      range: `logs!A:E`,
    });

    const valuesFromSheet = infoObjectFromSheet.data.values;
    return valuesFromSheet;
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

/**
 *TODO: time in, time out
 */
/**
 *
 * @param {*} data => empty array to fill up
 * @param {*} logs => all logs record in logs tab
 * @param {*} uniqueValues => list of members with residency hours today
 * @returns data, an array of array with format: [member_name, time_in, time_out, total_time]
 */
function storeDataToday(data, logs, uniqueValues) {
  for (const value of uniqueValues) {
    let sum = 0;

    for (const data of logs) {
      var member = data[0];
      let date = data[1];
      let memberDuration = data[4];

      if (member == value && value != "" && date == dateToday) {
        //convert time to seconds
        totalTimeInSeconds = timeToSeconds(memberDuration);
        // Add to the sum in seconds
        sum += totalTimeInSeconds;
      }
    }

    // Convert the sum back to "h m s" format
    sumTime = secondsToTime(sum);
    console.log(`Total Time today of ${value}:`, sumTime);

    // add the member new record to data array
    data.push([value, sumTime]);
  }
  return data;
}

/**
 *
 * @param {*} todayData => array of members data with residency today
 * @param {*} sheet => array of data from sheet
 * queryRecord() function checks if the member has a record already in sheet, if not it creates a new record
 * otherwise, it updates the member's record. (updateSheet function is called)
 */
async function queryRecord(todayData, sheet) {
  let newMembers = 0;
  for (const data of todayData) {
    let member = data[0];
    let memberFound = false;

    for (const [index, row] of sheet.entries()) {
      let sheetMember = row[0];

      if (member == sheetMember) {
        console.log(`${member} previous record: `, row);
        await updateSheet(data, index + 1, member); // plus 1 for removing header row
        memberFound = true;
        break;
      }
    }
    if (!memberFound) {
      console.log(`${member} successfully added to sheet`);
      updateSheet(data, sheet.length + 1 + newMembers, member); // plus 1 to jump to next empty cell in sheet
      newMembers += 1; // tracks actual sheet length while on the process of adding new members
    }
  }
}

/**
 *
 * @param {*} row => data to put in sheet
 * @param {*} index => row number in gsheet to update
 * updateSheet() function updates the members' record in gsheet
 */
async function updateSheet(row, index, member) {
  try {
    // google sheet instance
    const sheetInstance = await google.sheets({
      version: "v4",
      auth: googleAuth,
    });

    console.log(`${member} new record: `, row);
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
      // gets all logs from 'logs' tab in sheet
      let allLogs = await readLogs();

      // Converts array of arrays to a format similar to CSV rows
      const logsFormat = allLogs.map((row) => row.join(",")).join("\n");

      // Splitting the CSV-like string back into rows and columns
      const logs = logsFormat.split("\n").map((row) => row.split(",")); // CSV-like string to aray
      dateToday = getCurrentDate().toString(); // get current date and turn to string to compare later
      console.log("\nDate today: ", dateToday);

      // get unique members from the logs today (duplicates removed if members has multiple logs in a day)
      const uniqueValues = [
        ...new Set(
          logs
            .filter(
              (row) =>
                typeof row[1] !== "undefined" &&
                row[1].trim() === dateToday.trim() &&
                row[1].trim() !== ""
            )
            .map((row) => row[0])
        ),
      ];

      let data = [];

      // store today's logs to array
      data = storeDataToday(data, logs, uniqueValues);

      // print unique members with logs today
      console.log("Members today:", uniqueValues);

      //read from sheet (stored in an array)
      let sheetData = await readSheet();

      //check if record exists in sheet or not, then update sheet.
      queryRecord(data, sheetData);
      return logs;
    } catch (err) {
      console.log("error save to sheets", err);
      return [];
    }
  },

  savetoLogs: async function saveToLogs(
    user,
    today,
    timein,
    timeout,
    time,
    callback
  ) {
    try {
      let logs = await readLogs();
      var index = 1;

      if (logs != undefined) {
        let logs_length = logs.length;
        index = logs_length + 1;
      }

      let row = [user, today, timein, timeout, time];

      // google sheet instance
      const sheetInstance = await google.sheets({
        version: "v4",
        auth: googleAuth,
      });

      await sheetInstance.spreadsheets.values.update({
        auth: googleAuth,
        spreadsheetId: googleSheetId,
        range: `logs!A${index}:E`,
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
