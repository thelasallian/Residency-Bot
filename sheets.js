// const fs = require("fs");
// const { google } = require("googleapis");
// const serviceAccountKeyFile = "./credentials.json";
// const sheetId = process.env.SHEET_ID;
// require("dotenv").config();

// const clientEmail = process.env.CLIENT_EMAIL;
// const privateKey = process.env.PRIVATE_KEY;
// const googleSheetId = process.env.SHEET_ID;
// const googleSheetPage = "Residency";

// // authenticate the service account
// const googleAuth = new google.auth.JWT(
//   clientEmail,
//   null,
//   privateKey.replace(/\\n/g, "\n"),
//   "https://www.googleapis.com/auth/spreadsheets"
// );

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

// function readCSV() {
//   try {
//     // Load CSV data from file
//     const csvData = fs.readFileSync("logs.csv", "utf-8");

//     // Convert CSV data to a 2D array
//     const rows = csvData.split("\n").map((row) => row.split(","));
//     console.log("Data from CSV:", rows);
//     return rows;
//   } catch (err) {
//     console.log("readCSVToArray func() error", err);
//     return [];
//   }
// }

// module.exports = { readCSV };
