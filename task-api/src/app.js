const express = require('express');
const taskRoutes = require('./routes/tasks');

const app = express();

app.use(express.json());

// Root endpoint for health check and basic API info
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Task API is running smoothly',
    endpoints: {
      tasks: '/tasks',
      stats: '/tasks/stats',
    },
  });
});
app.use('/tasks', taskRoutes);

//I added this custom error handler to catch invalid JSON formatting before it crashes the server
//Express normally turns broken syntax into a 500 server error, but since the client sent bad data, it should return a friendly 400 Bad Request error instead

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Task API running on port ${PORT}`);
  });
}

module.exports = app;