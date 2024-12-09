const { chromium } = require("playwright");
const mysql = require("mysql2/promise");

// Database Configuration
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "Root@1234#", // Update with your DB password
  database: "job_db",
};

// Script Arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: node job_application.js <JobID> <CandidateID>");
  process.exit(1);
}

const jobID = parseInt(args[0]);
const candidateID = parseInt(args[1]);

/**
 * Update tracker table with the given status and other details.
 */
async function updateTracker(status, output, error) {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const timestamp = new Date().toISOString();

    // Update or Insert into tracker table
    const [result] = await connection.execute(
      `INSERT INTO trackers (job_id, candidate_id, status, output, error, timestamp, retry_count)
       VALUES (?, ?, ?, ?, ?, ?, retry_count + 1)
       ON DUPLICATE KEY UPDATE
       status = VALUES(status), output = VALUES(output), error = VALUES(error), timestamp = VALUES(timestamp), retry_count = retry_count + 1`,
      [jobID, candidateID, status, output, error || "", timestamp]
    );

    console.log("Tracker updated:", result);
    await connection.end();
  } catch (err) {
    console.error("Failed to update tracker:", err.message);
    process.exit(1);
  }
}

/**
 * Main function to automate job application process.
 */
async function applyForJob() {
  let browser;
  let status = "Success";
  let output = "";
  let error = "";

  try {
    console.log("Connecting to the database to fetch job details...");
    const connection = await mysql.createConnection(dbConfig);

    // Fetch job details from the jobs table
    const [jobDetails] = await connection.execute(
      `SELECT job_site, script_details FROM jobs WHERE job_id = ?`,
      [jobID]
    );

    if (jobDetails.length === 0) {
      throw new Error(`JobID ${jobID} not found in the jobs table.`);
    }

    const { job_site: jobSite, script_details: scriptDetails } = jobDetails[0];
    console.log(`Job Site: ${jobSite}, Script Details: ${scriptDetails}`);

    console.log("Launching browser...");
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log(`Navigating to job site: ${jobSite}`);
    await page.goto(jobSite, { timeout: 30000 });

    // Example Playwright steps (Adjust based on your site's requirements)
    console.log("Filling in the form...");
    await page.fill("#candidate-name", "John Doe"); // Fill name field
    await page.fill("#candidate-email", "johndoe@example.com"); // Fill email
   

    console.log("Submitting the application...");
    await page.click("#apply-button"); // Submit application

    output = "Job application submitted successfully.";
    console.log(output);

    await browser.close();
    await connection.end();
  } catch (err) {
    status = "Failure";
    output = "";
    error = err.message;
    console.error("Error during job application:", error);

    if (browser) {
      await browser.close();
    }
  }

  // Update tracker with the final status
  await updateTracker(status, output, error);
}

// Execute the script
applyForJob();
