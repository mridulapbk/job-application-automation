const mysql = require("mysql2/promise");
// main_job_script
const args = process.argv.slice(2);
if (args.length < 2) {
    console.error("Usage: node job_script.js <jobID> <candidateID>");
    process.exit(1);
}

const jobID = parseInt(args[0]);
const candidateID = parseInt(args[1]);

const dbConfig = {
    host: "localhost",
    user: "root",
    password: "Root@1234#", 
    database: "job_db",
};

async function updateTracker(jobID, candidateID, status, output, error) {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");
        await connection.execute(
            `INSERT INTO trackers (job_id, candidate_id, status, output, error, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            output = VALUES(output),
            error = VALUES(error),
            timestamp = VALUES(timestamp)`,
            [jobID, candidateID, status, output, error, timestamp]
        );
        await connection.end();
        console.log("Tracker updated successfully.");
    } catch (err) {
        console.error("Failed to update tracker:", err.message);
        process.exit(1);
    }
}

async function processJob() {
    let status = "Success",
        output = `Application successful for JobID: ${jobID}`,
        error = "";

    try {
        console.log(`Processing JobID: ${jobID}, CandidateID: ${candidateID}`);
        if (Math.random() < 0.3) {
            throw new Error("Automation failure simulation");
        }
        console.log("Job processing succeeded.");
    } catch (err) {
        status = "Failure";
        output = "";
        error = err.message;
        console.error(`Error during job processing: ${err.message}`);
    }

    await updateTracker(jobID, candidateID, status, output, error);
    process.exit(status === "Success" ? 0 : 1);
}

processJob();
