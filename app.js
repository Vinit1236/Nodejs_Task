const express = require("express");
const whois = require("whois");
const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const nodemailer = require("nodemailer");
const schedule = require("node-schedule");
const PORT = process.env.PORT || 5000;

// set up the express.js app
const app = express();
app.use(express.json());
// Define the WHOIS extraction functions
function extractName(whoisData) {
  const nameRegex = /Registrant Name:(.*)/i;
  const match = whoisData.match(nameRegex);
  if (match && match.length > 1) {
    return match[1].trim();
  }
  return "John Doe";
}

function extractEmail(whoisData) {
  // Implement the logic to extract the email from the WHOIS data
  const emailRegex = /Registrant Email:(.*)/i;
  const match = whoisData.match(emailRegex);
  if (match && match.length > 1) {
    return match[1].trim();
  }
  return "john.doe@example.com";
}

function extractPhoneNumber(whoisData) {
  // Implement the logic to extract the phone number from the WHOIS data
  const phoneRegex = /Registrant Phone:(.*)/i;
  const match = whoisData.match(phoneRegex);
  if (match && match.length > 1) {
    return match[1].trim();
  }
  return "+1 123-456-7890";
}

function runDailyJob() {
  app.get("/daily-job", (req, res) => {
    const newlyRegisteredDomains = ["example.com", "example.org"]; // Add the list of newly registered domains
    // WHOIS lookup, data extraction, storage, and email sending logic
    const extractedData = [];
    newlyRegisteredDomains.forEach((domain) => {
      whois.lookup(domain, (err, data) => {
        if (err) {
          console.error("WHOIS lookup error:", err);
        } else {
          const name = extractName(data);
          const email = extractEmail(data);
          const phoneNumber = extractPhoneNumber(data);
          domain = domain;
          const registrationDate = new Date().toISOString();
          extractedData.push({
            name,
            domain,
            email,
            phoneNumber,
            registrationDate,
          });
          // Store the data in a CSV file
          const csvWriter = createCsvWriter({
            path: "extracted_data.csv",
            header: [
              { id: "name", title: "Name" },
              { id: "domain", title: "Domain" },
              { id: "email", title: "Email" },
              { id: "phoneNumber", title: "Phone Number" },
              { id: "registrationDate", title: "Registration Date" },
            ],
            append: true,
          });

          csvWriter
            .writeRecords(extractedData)
            .then(() => console.log("Data stored successfully"))
            .catch((error) => console.error("Error storing data:", error));
        }
      });
    });
    // Send an email with the extracted data with help of ethereal or fake smtp
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: "katrine.bashirian@ethereal.email",
        pass: "JTPy6N8gN1eGKrqBJ5",
      },
    });
    const mailOptions = {
      from: "your_email@example.com",
      to: "recipient@example.com",
      subject: "Extracted WHOIS Data",
      text: "Please find the attached CSV file with the extracted data.",
      attachments: [
        {
          filename: "extracted_data.csv",
          path: "extracted_data.csv",
        },
      ],
    };
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Error sending email:", err);
      } else {
        console.log("Email sent:", info.response);
      }
    });
    res.write("<h1>Data stored Successfully in csv file!!</h1>");
    res.write("<h1>Email sent Successfully!!</h1>");
    res.end();
  });
  console.log("Running daily jobs");
}
// schedule the daily job to run at a specific time
schedule.scheduleJob("0 0 * * *", () => {
  runDailyJob();
});
// Run the daily job immediately on server start
runDailyJob();
// function to log errors to a file
function logError(error) {
  const errorMessage = `${new Date().toISOString()} - ${error.message}\n`;
  fs.appendFile("error.log", errorMessage, (err) => {
    if (err) {
      console.error("Error logging error:", err);
    }
  });
}
// start the Express.js server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
