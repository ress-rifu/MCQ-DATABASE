// routes/questions.js
const express = require('express');
const pool = require('../db'); // Assuming you have the db setup file
const router = express.Router();
const { authenticateToken } = require('../middleware/authenticate');
const multer = require('multer');

// GET route to fetch all questions
router.get('/', async (req, res) => {
    try {
        // Query the database to get all questions
        const result = await pool.query('SELECT * FROM questions'); // Make sure your table is named 'questions'

        // Return the list of questions
        res.json(result.rows); // Assuming you want to return all rows from the questions table
    } catch (err) {
        console.error('Error fetching questions:', err);
        res.status(500).json({ message: 'Failed to fetch questions' });
    }
});

// POST route to add a new question
router.post('/add', async (req, res) => {
    const {
        qserial, classname, subject, chapter, topic, ques, ques_img, option_a, option_a_img,
        option_b, option_b_img, option_c, option_c_img, option_d, option_d_img, answer,
        explanation, explanation_img, hint, hint_img, difficulty_level, reference
    } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO questions
             (qserial, classname, subject, chapter, topic, ques, ques_img, option_a, option_a_img,
              option_b, option_b_img, option_c, option_c_img, option_d, option_d_img, answer,
              explanation, explanation_img, hint, hint_img, difficulty_level, reference)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
             RETURNING *`,
            [qserial, classname, subject, chapter, topic, ques, ques_img, option_a, option_a_img,
                option_b, option_b_img, option_c, option_c_img, option_d, option_d_img, answer,
                explanation, explanation_img, hint, hint_img, difficulty_level, reference]
        );

        res.status(201).json({ message: "Question added successfully", question: result.rows[0] });
    } catch (err) {
        console.error('Error adding question:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// POST route as an alternative to add a new question
router.post('/', async (req, res) => {
    const {
        qserial, classname, subject, chapter, topic, ques, ques_img, option_a, option_a_img,
        option_b, option_b_img, option_c, option_c_img, option_d, option_d_img, answer,
        explanation, explanation_img, hint, hint_img, difficulty_level, reference
    } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO questions
             (qserial, classname, subject, chapter, topic, ques, ques_img, option_a, option_a_img,
              option_b, option_b_img, option_c, option_c_img, option_d, option_d_img, answer,
              explanation, explanation_img, hint, hint_img, difficulty_level, reference)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
             RETURNING *`,
            [qserial, classname, subject, chapter, topic, ques, ques_img, option_a, option_a_img,
                option_b, option_b_img, option_c, option_c_img, option_d, option_d_img, answer,
                explanation, explanation_img, hint, hint_img, difficulty_level, reference]
        );

        res.status(201).json({ message: "Question added successfully", question: result.rows[0] });
    } catch (err) {
        console.error('Error adding question:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Update a question by ID
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`PUT request received for question ID: ${id}`);

    const {
        qserial, classname, subject, chapter, topic, ques, ques_img, option_a, option_a_img,
        option_b, option_b_img, option_c, option_c_img, option_d, option_d_img, answer,
        explanation, explanation_img, hint, hint_img, difficulty_level, reference
    } = req.body;

    try {
        // PostgreSQL uses numeric ids - we need to ensure we're using a number
        let idValue = id;

        // Convert to number if possible, for PostgreSQL
        if (!isNaN(parseInt(id))) {
            idValue = parseInt(id);
        }

        console.log(`Updating question with id=${idValue} (Type: ${typeof idValue})`);

        // Log the query and parameters
        console.log('Query parameters:', {
            qserial, classname, subject, chapter, topic,
            id: idValue
        });

        const result = await pool.query(
            `UPDATE questions
             SET qserial=$1, classname=$2, subject=$3, chapter=$4, topic=$5, ques=$6, ques_img=$7,
                 option_a=$8, option_a_img=$9, option_b=$10, option_b_img=$11, option_c=$12, option_c_img=$13,
                 option_d=$14, option_d_img=$15, answer=$16, explanation=$17, explanation_img=$18,
                 hint=$19, hint_img=$20, difficulty_level=$21, reference=$22
             WHERE id=$23 RETURNING *`,
            [qserial, classname, subject, chapter, topic, ques, ques_img, option_a, option_a_img,
                option_b, option_b_img, option_c, option_c_img, option_d, option_d_img, answer,
                explanation, explanation_img, hint, hint_img, difficulty_level, reference, idValue]
        );

        if (result.rows.length === 0) {
            console.log(`No question found with id=${idValue}`);
            return res.status(404).json({ message: "Question not found" });
        }

        console.log(`Question updated successfully: id=${idValue}`);
        res.json({ message: "Question updated successfully", question: result.rows[0] });
    } catch (err) {
        console.error('Error updating question:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Delete a question by ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`DELETE request received for question ID: ${id}`);

    try {
        // PostgreSQL uses numeric ids - we need to ensure we're using a number
        let idValue = id;

        // Convert to number if possible, for PostgreSQL
        if (!isNaN(parseInt(id))) {
            idValue = parseInt(id);
        }

        console.log(`Deleting question with id=${idValue} (Type: ${typeof idValue})`);

        const result = await pool.query('DELETE FROM questions WHERE id = $1 RETURNING *', [idValue]);

        if (result.rows.length === 0) {
            console.log(`No question found with id=${idValue}`);
            return res.status(404).json({ message: "Question not found" });
        }

        console.log(`Question deleted successfully: id=${idValue}`);
        res.json({ message: "Question deleted successfully" });
    } catch (err) {
        console.error('Error deleting question:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// GET dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
    try {
        // Get total question count
        const totalQuestionsResult = await pool.query('SELECT COUNT(*) FROM questions');
        const totalQuestions = parseInt(totalQuestionsResult.rows[0].count) || 0;

        // Get questions uploaded today
        let uploadedToday = 0;
        try {
            const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
            const uploadedTodayResult = await pool.query(
                "SELECT COUNT(*) FROM questions WHERE DATE(created_at) = $1",
                [today]
            );
            uploadedToday = parseInt(uploadedTodayResult.rows[0].count) || 0;
        } catch (err) {
            console.error('Error getting today uploads:', err);
            // Continue with 0 as default
        }

        // Get user's questions (using user_id from token)
        let myQuestions = 0;
        try {
            const userId = req.user ? req.user.id : null; // Assuming auth middleware sets req.user

            if (userId) {
                const myQuestionsResult = await pool.query(
                    'SELECT COUNT(*) FROM questions WHERE user_id = $1',
                    [userId]
                );
                myQuestions = parseInt(myQuestionsResult.rows[0].count) || 0;
            }
        } catch (err) {
            console.error('Error getting user questions:', err);
            // Continue with 0 as default
        }

        // Get questions uploaded this month
        let monthlyUploads = 0;
        try {
            const firstDayOfMonth = new Date();
            firstDayOfMonth.setDate(1);
            firstDayOfMonth.setHours(0, 0, 0, 0);

            const monthlyUploadsResult = await pool.query(
                'SELECT COUNT(*) FROM questions WHERE created_at >= $1',
                [firstDayOfMonth.toISOString()]
            );
            monthlyUploads = parseInt(monthlyUploadsResult.rows[0].count) || 0;
        } catch (err) {
            console.error('Error getting monthly uploads:', err);
            // Continue with 0 as default
        }

        // Log the stats for debugging
        console.log('Dashboard stats:', {
            totalQuestions,
            uploadedToday,
            myQuestions,
            monthlyUploads
        });

        res.json({
            totalQuestions,
            uploadedToday,
            myQuestions,
            monthlyUploads
        });
    } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        // Return default values instead of error to prevent UI breakage
        res.json({
            totalQuestions: 0,
            uploadedToday: 0,
            myQuestions: 0,
            monthlyUploads: 0
        });
    }
});

// GET recent questions/uploads
router.get('/recent', async (req, res) => {
    try {
        const recentUploadsResult = await pool.query(
            `SELECT q.id, q.subject,
             COALESCE(q.qserial, CONCAT(LOWER(SUBSTRING(q.subject, 1, 3)), '-', q.id)) as title,
             q.created_at as date,
             COUNT(*) OVER (PARTITION BY q.subject) as questions
             FROM questions q
             ORDER BY q.created_at DESC
             LIMIT 10`
        );

        // Format the response to match the expected structure
        const formattedUploads = recentUploadsResult.rows.map(row => {
            try {
                return {
                    id: row.id,
                    title: row.title || 'Untitled',
                    subject: row.subject || 'Unknown',
                    date: row.date ? row.date.toISOString() : new Date().toISOString(),
                    questions: parseInt(row.questions) || 0
                };
            } catch (err) {
                // Return fallback data if there's an error with a particular row
                console.error('Error formatting row:', err, row);
                return {
                    id: row.id || Math.random().toString(36).substr(2, 9),
                    title: 'Error processing item',
                    subject: 'Unknown',
                    date: new Date().toISOString(),
                    questions: 0
                };
            }
        });

        // Log data for debugging
        console.log('Recent uploads endpoint returning count:', formattedUploads.length);

        res.json(formattedUploads);
    } catch (err) {
        console.error('Error fetching recent uploads:', err);
        res.json([]); // Return empty array instead of error to prevent UI breakage
    }
});

// GET subject distribution
router.get('/subjects', async (req, res) => {
    try {
        const subjectStatsResult = await pool.query(
            `SELECT subject, COUNT(*) as count
             FROM questions
             GROUP BY subject
             ORDER BY count DESC
             LIMIT 10`
        );

        // Ensure we send an array, even if it's empty
        const subjects = subjectStatsResult.rows.map(row => ({
            subject: row.subject || 'Unknown',
            count: parseInt(row.count) || 0
        }));

        // Log data for debugging
        console.log('Subjects endpoint returning:', subjects);

        res.json(subjects);
    } catch (err) {
        console.error('Error fetching subject distribution:', err);
        res.json([]); // Return empty array instead of error to prevent UI breakage
    }
});

// Add a dedicated route for recent questions
router.get("/recent-questions", authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5; // Default to 5 questions
        console.log(`Fetching ${limit} recent questions`);

        // Get the most recently created questions
        const recentQuestions = await pool.query(
            "SELECT * FROM questions ORDER BY id DESC LIMIT $1",
            [limit]
        );

        console.log(`Found ${recentQuestions.rows.length} recent questions`);

        // Process the results to ensure all fields have proper values, not null
        const processedQuestions = recentQuestions.rows.map(question => {
            // Create a processed object with all fields
            const processedQuestion = {};

            // Loop through all properties and ensure they're not null/undefined
            Object.entries(question).forEach(([key, value]) => {
                // If value is null or undefined, provide an empty string or appropriate default
                processedQuestion[key] = value ??
                    (key.includes('img') ? null : // Keep image fields as null
                    key === 'id' ? question.id :
                    '');
            });

            return processedQuestion;
        });

        console.log(`Returning ${processedQuestions.length} processed recent questions`);
        res.status(200).json(processedQuestions);
    } catch (err) {
        console.error("Error fetching recent questions:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Get dashboard statistics
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    console.log("Fetching dashboard statistics");

    // Get total questions
    const totalQuestionsResult = await pool.query("SELECT COUNT(*) FROM questions");
    const totalQuestions = parseInt(totalQuestionsResult.rows[0].count) || 0;

    // Get total unique subjects
    const subjectsResult = await pool.query("SELECT COUNT(DISTINCT subject) FROM questions WHERE subject IS NOT NULL");
    const totalSubjects = parseInt(subjectsResult.rows[0].count) || 0;

    // Get total unique chapters
    const chaptersResult = await pool.query("SELECT COUNT(DISTINCT chapter) FROM questions WHERE chapter IS NOT NULL");
    const totalChapters = parseInt(chaptersResult.rows[0].count) || 0;

    // Get total unique topics
    const topicsResult = await pool.query("SELECT COUNT(DISTINCT topic) FROM questions WHERE topic IS NOT NULL");
    const totalTopics = parseInt(topicsResult.rows[0].count) || 0;

    // Get questions uploaded this month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const monthlyUploadsResult = await pool.query(
      'SELECT COUNT(*) FROM questions WHERE created_at >= $1',
      [firstDayOfMonth.toISOString()]
    );
    const monthlyUploads = parseInt(monthlyUploadsResult.rows[0].count) || 0;

    // Get questions uploaded by current user
    let userUploads = 0;
    if (req.user && req.user.id) {
      const userUploadsResult = await pool.query(
        'SELECT COUNT(*) FROM questions WHERE created_by = $1',
        [req.user.id]
      );
      userUploads = parseInt(userUploadsResult.rows[0].count) || 0;
    }

    console.log("Dashboard stats:", {
      totalQuestions,
      totalSubjects,
      totalChapters,
      totalTopics,
      monthlyUploads,
      userUploads
    });

    res.json({
      totalQuestions,
      totalSubjects,
      totalChapters,
      totalTopics,
      monthlyUploads,
      userUploads
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Error fetching dashboard statistics" });
  }
});

// Delete all questions with the same timestamp
router.delete("/batch/by-timestamp/:timestamp", authenticateToken, async (req, res) => {
  try {
    const { timestamp } = req.params;
    console.log(`Attempting to delete all questions with timestamp: ${timestamp}`);

    if (!timestamp) {
      return res.status(400).json({ message: "Timestamp parameter is required" });
    }

    // Parse the timestamp to ensure it's a valid date
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: "Invalid timestamp format" });
    }

    // Format the date for PostgreSQL timestamp comparison
    const formattedDate = date.toISOString();

    // Delete all questions with the matching timestamp
    // We use DATE_TRUNC to compare only the date part, ignoring time
    const result = await pool.query(
      `DELETE FROM questions
       WHERE DATE_TRUNC('day', created_at) = DATE_TRUNC('day', $1::timestamp)
       RETURNING id`,
      [formattedDate]
    );

    const deletedCount = result.rowCount;
    console.log(`Deleted ${deletedCount} questions with timestamp ${timestamp}`);

    res.json({
      message: `Successfully deleted ${deletedCount} questions`,
      deletedCount
    });
  } catch (error) {
    console.error("Error deleting questions by timestamp:", error);
    res.status(500).json({ message: "Error deleting questions", error: error.message });
  }
});

// Get subject distribution
router.get("/subjects", authenticateToken, async (req, res) => {
  try {
    console.log("Fetching subject distribution");

    const result = await pool.query(`
      SELECT
        COALESCE(subject, 'Unknown') as subject,
        COUNT(*) as count
      FROM questions
      GROUP BY COALESCE(subject, 'Unknown')
      ORDER BY count DESC
    `);

    console.log(`Found ${result.rows.length} subjects`);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching subject distribution:", error);
    res.status(500).json({ message: "Error fetching subject distribution" });
  }
});

// Delete imported questions by import ID
router.delete("/import/:id", authenticateToken, async (req, res) => {
  const importId = req.params.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if this is an import ID from the activity log
    let questionIds = [];

    try {
      // First try to get question IDs from activity log
      const activityResult = await client.query(
        `SELECT details FROM activity_log WHERE id = $1 AND action = 'import_questions'`,
        [importId]
      );

      if (activityResult.rows.length > 0 && activityResult.rows[0].details?.question_ids) {
        questionIds = activityResult.rows[0].details.question_ids;
      }
    } catch (err) {
      console.log('Activity log query failed, trying direct import ID:', err);
      // If activity log doesn't exist or query fails, assume importId is a batch ID
      questionIds = [];
    }

    // If we couldn't get question IDs from activity log, try using import ID as a batch identifier
    if (questionIds.length === 0) {
      const batchResult = await client.query(
        `SELECT id FROM questions WHERE import_batch_id = $1`,
        [importId]
      );

      questionIds = batchResult.rows.map(row => row.id);
    }

    if (questionIds.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'No questions found for this import' });
    }

    // Delete the questions
    const deleteResult = await client.query(
      `DELETE FROM questions WHERE id = ANY($1) RETURNING id`,
      [questionIds]
    );

    // Try to log the deletion as a new activity if the activity_log table exists
    try {
      await client.query(
        `INSERT INTO activity_log
         (user_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          req.user.id,
          'delete_import',
          'questions',
          null,
          { deleted_import_id: importId, question_count: deleteResult.rowCount }
        ]
      );
    } catch (logErr) {
      console.log('Could not log deletion activity:', logErr);
      // Continue even if logging fails
    }

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Successfully deleted imported questions',
      deleted_count: deleteResult.rowCount
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting imported questions:', error);
    res.status(500).json({
      message: 'Error deleting imported questions',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Get total questions count for dashboard
router.get("/count", async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM questions');
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error("Error counting questions:", error);
    res.status(500).json({ message: "Error counting questions", error: error.message });
  }
});

module.exports = router;
