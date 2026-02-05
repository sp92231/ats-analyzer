"use client";

import { useState } from "react";

export default function ResumeATSAnalyzer() {
  // Form state
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  // API response and UI states
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleAnalyze = async () => {
    setError(null);
    setResult(null);

    if (!resume.trim() || !jobDescription.trim()) {
      setError("Please fill in both resume and job description fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: resume.trim(),
          job: jobDescription.trim(),
        }),
      });

      if (!response.ok)
        throw new Error(`API error: ${response.status} ${response.statusText}`);

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  // Parse and format the result
  const renderResults = () => {
    if (!result) return null;

    let analysisData;
    try {
      // Navigate through the nested structure
      const resultText = result.result?.[0]?.text;

      if (!resultText) {
        throw new Error("No text found in result");
      }

      console.log("Original text:", resultText);

      // Remove markdown code blocks (```json and ```)
      let cleanedText = resultText.trim();

      // Remove opening ```json or ```
      cleanedText = cleanedText.replace(/^```(?:json)?\s*\n?/i, "");

      // Remove closing ```
      cleanedText = cleanedText.replace(/\n?```\s*$/i, "");

      cleanedText = cleanedText.trim();

      console.log("Cleaned text:", cleanedText);
      console.log("Text length:", cleanedText.length);

      // Check if the JSON might be incomplete
      // Count opening and closing braces
      const openBraces = (cleanedText.match(/{/g) || []).length;
      const closeBraces = (cleanedText.match(/}/g) || []).length;

      console.log("Open braces:", openBraces, "Close braces:", closeBraces);

      // If JSON is incomplete, try to complete it or extract what we can
      if (openBraces > closeBraces) {
        console.warn(
          "Incomplete JSON detected, attempting to extract partial data"
        );
        // Try to find the last complete section
        const lastCompleteIndex = cleanedText.lastIndexOf("},");
        if (lastCompleteIndex > 0) {
          // Close the arrays and objects
          cleanedText =
            cleanedText.substring(0, lastCompleteIndex + 1) + "\n  ]\n}";
        }
      }

      // Parse the JSON
      analysisData = JSON.parse(cleanedText);
    } catch (e) {
      console.error("Parse error:", e);
      console.error("Failed text:", result.result?.[0]?.text);

      return (
        <div className="result-container">
          <h2 className="result-title">Analysis Results:</h2>
          <div className="error-box">
            <strong>Error parsing results:</strong>{" "}
            {e instanceof Error ? e.message : "Unknown error"}
            <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
              The API response may be incomplete or malformed. This sometimes
              happens with long responses. Try analyzing a shorter resume or job
              description.
            </p>
          </div>
          <details>
            <summary
              style={{ color: "#ccc", cursor: "pointer", marginTop: "1rem" }}
            >
              Show raw output
            </summary>
            <pre className="raw-output">{JSON.stringify(result, null, 2)}</pre>
          </details>
        </div>
      );
    }

    return (
      <div className="result-container">
        <h2 className="result-title">Analysis Results</h2>
        <br></br>

        {/* ATS Score */}
        <div className="score-section">
          <div className="score-badge">
            <div className="score-label">
              ATS Score: {analysisData.ats_score || 0}{" "}
            </div>
          </div>
          <div className="score-description">
            {(analysisData.ats_score || 0) >= 80
              ? "Excellent match!"
              : (analysisData.ats_score || 0) >= 60
              ? "Good match with room for improvement."
              : "Needs significant improvement."}
          </div>
          <br></br>
        </div>

        {/* Matching Keywords */}
        {analysisData.matching_keywords &&
          analysisData.matching_keywords.length > 0 && (
            <div className="section">
              <h3 className="section-header">
                ✓ Matching Keywords: ({analysisData.matching_keywords.length})
              </h3>
              <div className="keywords-container">
                {analysisData.matching_keywords.map(
                  (keyword: string, index: number) => (
                    <span key={index} className="keyword-badge matching">
                      {keyword}
                      {index < analysisData.matching_keywords.length - 1 &&
                        ", "}
                    </span>
                  )
                )}
              </div>
              <br></br>
            </div>
          )}

        {/* Missing Keywords */}
        {analysisData.missing_keywords &&
          analysisData.missing_keywords.length > 0 && (
            <div className="section">
              <h3 className="section-header warning">
                ⚠ Missing Keywords: ({analysisData.missing_keywords.length})
              </h3>
              <div className="keywords-container">
                {analysisData.missing_keywords.map(
                  (keyword: string, index: number) => (
                    <span key={index} className="keyword-badge missing">
                      {keyword}
                      {index < analysisData.matching_keywords.length - 1 &&
                        ", "}
                    </span>
                  )
                )}
              </div>
              <br></br>
            </div>
          )}

        {/* Resume Strengths */}
        {analysisData.resume_strengths &&
          analysisData.resume_strengths.length > 0 && (
            <div className="section">
              <h3 className="section-header">💪 Resume Strengths:</h3>
              <ul
                className="list"
                style={{ listStyleType: "disc", paddingLeft: "1.5rem" }}
              >
                {analysisData.resume_strengths.map(
                  (strength: string, index: number) => (
                    <li key={index} className="list-item">
                      {strength}
                    </li>
                  )
                )}
              </ul>
              <br></br>
            </div>
          )}

        {/* Improvement Suggestions */}
        {analysisData.improvement_suggestions &&
          analysisData.improvement_suggestions.length > 0 && (
            <div className="section">
              <h3 className="section-header">🎯 Improvement Suggestions:</h3>

              {analysisData.improvement_suggestions.map(
                (suggestion: any, index: number) => (
                  <div key={index} className="suggestion-card">
                    {suggestion.original_bullet && (
                      <>
                        <div className="suggestion-label">Original:</div>
                        <div className="original-text">
                          • {suggestion.original_bullet}
                        </div>
                      </>
                    )}

                    {suggestion.improved_bullet && (
                      <>
                        <div className="suggestion-label improved">
                          Improved:
                        </div>
                        <div className="improved-text">
                          • {suggestion.improved_bullet}
                        </div>
                      </>
                    )}

                    {suggestion.keywords_added &&
                      suggestion.keywords_added.length > 0 && (
                        <div className="keywords-added">
                          <strong>Keywords added:</strong>{" "}
                          {suggestion.keywords_added.join(", ")}
                        </div>
                      )}
                    <br></br>
                  </div>
                )
              )}
            </div>
          )}
      </div>
    );
  };

  return (
    <div className="container">
      <h1 className="title">Resume ATS Analyzer</h1>
      <p className="subtitle">
        Analyze how well your resume matches a job description
      </p>

      {/* Resume Input */}
      <div className="input-group">
        <label htmlFor="resume" className="label">
          Your Resume
        </label>
        <textarea
          id="resume"
          value={resume}
          onChange={(e) => setResume(e.target.value)}
          placeholder="Paste your resume text here..."
          className="textarea"
          rows={10}
          disabled={loading}
        />
      </div>

      {/* Job Description Input */}
      <div className="input-group">
        <label htmlFor="jobDescription" className="label">
          Job Description
        </label>
        <textarea
          id="jobDescription"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here..."
          className="textarea"
          rows={10}
          disabled={loading}
        />
      </div>

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className={`button ${loading ? "button-disabled" : ""}`}
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {/* Error Display */}
      {error && (
        <div className="error-box">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results Display */}
      {renderResults()}

      {/* Scoped CSS */}
      <style jsx>{`
        .container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 2rem;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .title {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
          color: rgb(232, 227, 227);
        }
        .subtitle {
          font-size: 1rem;
          color: rgb(232, 227, 227);
          margin-bottom: 2rem;
        }
        .input-group {
          margin-bottom: 1.5rem;
        }
        .label {
          display: block;
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: rgb(232, 227, 227);
        }
        .textarea {
          width: 100%;
          padding: 0.75rem;
          font-size: 0.95rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-family: monospace;
          resize: vertical;
          box-sizing: border-box;
        }
        .textarea:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }
        .button {
          background-color: #0070f3;
          color: white;
          padding: 0.75rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-bottom: 2rem;
          transition: background-color 0.2s;
        }
        .button:hover:not(.button-disabled) {
          background-color: #0051cc;
        }
        .button-disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        .error-box {
          background-color: #fee;
          border: 1px solid #fcc;
          color: #c33;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1.5rem;
        }
        .result-container {
          margin-top: 2rem;
          background-color: rgb(20, 20, 20);
          border: 1px solid #333;
          border-radius: 8px;
          padding: 2rem;
        }
        .result-title {
          font-size: 1.8rem;
          font-weight: bold;
          margin-bottom: 2rem;
          color: rgb(232, 227, 227);
          text-align: center;
        }
        .score-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2rem;
          text-align: center;
        }
        .score-badge {
          display: inline-block;
        }
        .score-number {
          font-size: 4rem;
          font-weight: bold;
          color: white;
          line-height: 1;
        }
        .score-label {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.9);
          margin-top: 0.5rem;
        }
        .score-description {
          font-size: 1.1rem;
          color: white;
          margin-top: 1rem;
          font-weight: 500;
        }
        .section {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background-color: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .section-header {
          font-size: 1.3rem;
          font-weight: 700;
          color: #0070f3;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid rgba(0, 112, 243, 0.3);
        }
        .section-header.warning {
          color: #f59e0b;
          border-bottom-color: rgba(245, 158, 11, 0.3);
        }
        .keywords-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .keyword-badge {
          padding: 0.4rem 0.8rem;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 500;
          display: inline-block;
        }
        .keyword-badge.matching {
          background-color: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .keyword-badge.missing {
          background-color: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .list-item {
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          color: #ddd;
          background-color: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          border-left: 3px solid #10b981;
          line-height: 1.6;
        }
        .suggestion-card {
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .suggestion-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #ef4444;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
          letter-spacing: 0.5px;
        }
        .suggestion-label.improved {
          color: #10b981;
          margin-top: 1rem;
        }
        .original-text {
          padding: 1rem;
          background-color: rgba(239, 68, 68, 0.1);
          border-left: 3px solid #ef4444;
          border-radius: 4px;
          color: #ddd;
          line-height: 1.6;
          margin-bottom: 1rem;
        }
        .improved-text {
          padding: 1rem;
          background-color: rgba(16, 185, 129, 0.1);
          border-left: 3px solid #10b981;
          border-radius: 4px;
          color: #ddd;
          line-height: 1.6;
        }
        .keywords-added {
          margin-top: 1rem;
          padding: 0.75rem;
          background-color: rgba(0, 112, 243, 0.1);
          border-radius: 4px;
          color: #bbb;
          font-size: 0.9rem;
        }
        .keywords-added strong {
          color: #0070f3;
        }
        .raw-output {
          background-color: rgba(0, 0, 0, 0.3);
          padding: 1rem;
          border-radius: 4px;
          overflow-x: auto;
          color: #ccc;
          font-size: 0.85rem;
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );
}
