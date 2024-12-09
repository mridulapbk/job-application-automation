package controllers

import (
	"log"
	"net/http"

	"job-application-automation/models"
	"job-application-automation/services"

	"github.com/labstack/echo/v4"
)

// ApplyForJob handles the /apply endpoint
func ApplyForJob(c echo.Context) error {
	log.Println("Received POST /apply request")

	type Request struct {
		JobID       int64 `json:"job_id"`
		CandidateID int   `json:"candidate_id"`
	}

	var req Request
	if err := c.Bind(&req); err != nil {
		log.Printf("Failed to bind request: %v", err)
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
	}

	log.Printf("Request payload: %+v", req)

	// Fetch job details
	var job models.Job
	if err := services.FetchJob(req.JobID, &job); err != nil {
		log.Printf("Failed to fetch job details for JobID %d: %v", req.JobID, err)
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Job ID not found"})
	}

	log.Printf("Job details retrieved: %+v", job)

	// Execute Playwright script
	log.Println("Executing Playwright script...")
	err := services.ExecuteScriptService(req.JobID, req.CandidateID, job.ScriptDetails)
	if err != nil {
		log.Printf("Error executing script: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Script execution failed"})
	}

	log.Println("Job processed successfully")
	return c.JSON(http.StatusOK, map[string]string{"message": "Job processed successfully"})
}
