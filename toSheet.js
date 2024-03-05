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

// async function readSheet() {
//   try {
//     // google sheet instance
//     const sheetInstance = await google.sheets({
//       version: "v4",
//       auth: googleAuth,
//     });
//     // read data in the range in a sheet
//     const infoObjectFromSheet = await sheetInstance.spreadsheets.values.get({
//       auth: googleAuth,
//       spreadsheetId: googleSheetId,
//       range: `${googleSheetPage}!A2:A4`,
//     });

//     const valuesFromSheet = infoObjectFromSheet.data.values;
//     console.log(valuesFromSheet);
//   } catch (err) {
//     console.log("readSheet func() error", err);
//   }
// }

function getCurrentDate() {
  const currentDate = new Date();
  return currentDate.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

module.exports = {
  readCSV: function readCSV() {
    try {
      const csvData = fs.readFileSync("./logs.csv", "utf-8"); // Load CSV data from file
      const rows = csvData.split("\n").map((row) => row.split(",")); // CSV to aray

      console.log("Data: ", rows);
      dateToday = getCurrentDate().toString();
      console.log(dateToday);

      rows.pop();
      // const uniqueValues = [...new Set(rows.map((row) => row[0]))];    // get unique values from logs
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

      let data = [];
      for (const value of uniqueValues) {
        let sum = 0;

        for (const data of rows) {
          // Convert currentDate to the same format as returned by getCurrentDate

          let member = data[0];
          let date = data[2];
          if (member == value && value != "" && date == dateToday) {
            const timeComponents = data[1].split(" ");
            const hours = parseInt(timeComponents[0]) || 0;
            const minutes = parseInt(timeComponents[1]) || 0;
            const seconds = parseInt(timeComponents[2]) || 0;

            const totalTimeInSeconds = hours * 3600 + minutes * 60 + seconds;
            // Add to the sum in seconds
            sum += totalTimeInSeconds;
          }
        }

        // Convert the sum back to "h m s" format
        const sumHours = Math.floor(sum / 3600);
        const sumMinutes = Math.floor((sum % 3600) / 60);
        const sumSecondsRemaining = sum % 60;

        const formattedSum = `${sumHours}h ${sumMinutes}m ${sumSecondsRemaining}s`;

        console.log("Total Time:", formattedSum);

        // Update the sum in the sumData object
        data.push([value, formattedSum]);
      }

      //Perform your desired operation on matching rows
      console.log("unique value:", uniqueValues);
      console.log("new data: ", data);
      return rows;
    } catch (err) {
      console.log("errong reading logs to array", err);
      return [];
    }
  },
};
