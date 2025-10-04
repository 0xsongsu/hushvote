const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory storage for votings
let votings = [
  {
    id: '1',
    title: 'Board Election 2024',
    description: 'Annual board member election with privacy-preserving voting',
    type: 'SINGLE_CHOICE',
    status: 'ACTIVE',
    options: [
      { id: '1', label: 'Alice Johnson', description: '10 years experience' },
      { id: '2', label: 'Bob Smith', description: '15 years experience' },
      { id: '3', label: 'Carol Williams', description: '8 years experience' },
    ],
    startTime: '2024-01-01T00:00:00Z',
    endTime: '2024-01-31T23:59:59Z',
    createdBy: '0x1234...5678',
    totalVoters: 150,
    allowReencryption: true,
    createdAt: '2023-12-01T00:00:00Z',
    updatedAt: '2023-12-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Budget Allocation Vote',
    description: 'Quadratic voting for 2024 budget allocation',
    type: 'QUADRATIC',
    status: 'ACTIVE',
    options: [
      { id: '1', label: 'Research & Development', description: 'Increase R&D budget' },
      { id: '2', label: 'Marketing', description: 'Expand marketing efforts' },
      { id: '3', label: 'Operations', description: 'Improve operational efficiency' },
      { id: '4', label: 'Employee Benefits', description: 'Enhanced benefits package' },
    ],
    startTime: '2024-01-01T00:00:00Z',
    endTime: '2024-01-15T23:59:59Z',
    createdBy: '0x1234...5678',
    totalVoters: 200,
    quadraticCredits: 100,
    allowReencryption: true,
    createdAt: '2023-12-15T00:00:00Z',
    updatedAt: '2023-12-15T00:00:00Z',
  },
];

let votes = [];
let nextId = 3;

// Routes
app.get('/api/votings', (req, res) => {
  console.log('GET /api/votings');
  res.json(votings);
});

app.get('/api/votings/:id', (req, res) => {
  const voting = votings.find(v => v.id === req.params.id);
  if (voting) {
    res.json(voting);
  } else {
    res.status(404).json({ error: 'Voting not found' });
  }
});

app.post('/api/votings', (req, res) => {
  console.log('POST /api/votings', req.body);
  
  const newVoting = {
    id: String(nextId++),
    title: req.body.title,
    description: req.body.description,
    type: req.body.type,
    status: 'ACTIVE',
    options: req.body.options.map((opt, idx) => ({
      id: String(idx + 1),
      label: opt.label,
      description: opt.description || '',
    })),
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    createdBy: '0x' + Math.random().toString(16).substr(2, 8),
    totalVoters: 0,
    eligibleVoters: req.body.eligibleVoters || [],
    quadraticCredits: req.body.quadraticCredits,
    allowReencryption: req.body.allowReencryption !== false,
    decryptionThreshold: req.body.decryptionThreshold || 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  votings.push(newVoting);
  console.log('Created voting:', newVoting);
  res.status(201).json(newVoting);
});

app.put('/api/votings/:id', (req, res) => {
  const index = votings.findIndex(v => v.id === req.params.id);
  if (index !== -1) {
    votings[index] = { ...votings[index], ...req.body, updatedAt: new Date().toISOString() };
    res.json(votings[index]);
  } else {
    res.status(404).json({ error: 'Voting not found' });
  }
});

app.delete('/api/votings/:id', (req, res) => {
  const index = votings.findIndex(v => v.id === req.params.id);
  if (index !== -1) {
    votings.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Voting not found' });
  }
});

app.patch('/api/votings/:id/status', (req, res) => {
  const voting = votings.find(v => v.id === req.params.id);
  if (voting) {
    voting.status = req.body.status;
    voting.updatedAt = new Date().toISOString();
    res.json(voting);
  } else {
    res.status(404).json({ error: 'Voting not found' });
  }
});

// Vote endpoints
app.post('/api/votes', (req, res) => {
  console.log('POST /api/votes', req.body);
  const newVote = {
    id: String(votes.length + 1),
    votingId: req.body.votingId,
    encryptedChoice: req.body.encryptedChoice,
    encryptedWeight: req.body.encryptedWeight,
    proof: req.body.proof,
    voter: '0x' + Math.random().toString(16).substr(2, 8),
    timestamp: new Date().toISOString(),
  };
  votes.push(newVote);
  res.status(201).json(newVote);
});

app.get('/api/votes/verify/:votingId/:voter', (req, res) => {
  const vote = votes.find(v => v.votingId === req.params.votingId && v.voter === req.params.voter);
  res.json({
    voted: !!vote,
    reencrypted: vote ? 'encrypted_value_' + Math.random().toString(36) : undefined,
  });
});

app.get('/api/votes/status/:votingId/:voter', (req, res) => {
  const vote = votes.find(v => v.votingId === req.params.votingId && v.voter === req.params.voter);
  res.json({
    hasVoted: !!vote,
    timestamp: vote?.timestamp,
    canReencrypt: true,
  });
});

// Results endpoints
app.get('/api/results/:votingId', (req, res) => {
  const voting = votings.find(v => v.id === req.params.votingId);
  if (!voting) {
    return res.status(404).json({ error: 'Voting not found' });
  }
  
  // Mock results
  const results = voting.options.map(opt => ({
    optionId: opt.id,
    label: opt.label,
    votes: Math.floor(Math.random() * 100),
    percentage: Math.random() * 100,
  }));
  
  res.json({
    votingId: req.params.votingId,
    totalVotes: results.reduce((sum, r) => sum + r.votes, 0),
    results,
    decrypted: voting.status === 'COMPLETED',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/results/:votingId/partial', (req, res) => {
  const votingVotes = votes.filter(v => v.votingId === req.params.votingId);
  res.json({
    totalVotes: votingVotes.length,
    participationRate: Math.random() * 100,
  });
});

// Admin endpoints
app.get('/api/admin/stats', (req, res) => {
  res.json({
    totalVotings: votings.length,
    activeVotings: votings.filter(v => v.status === 'ACTIVE').length,
    totalVotes: votes.length,
    totalUsers: 250,
  });
});

app.get('/api/admin/votings/:votingId', (req, res) => {
  const voting = votings.find(v => v.id === req.params.votingId);
  if (!voting) {
    return res.status(404).json({ error: 'Voting not found' });
  }
  
  const votingVotes = votes.filter(v => v.votingId === req.params.votingId);
  res.json({
    voting,
    votes: votingVotes.length,
    participants: [...new Set(votingVotes.map(v => v.voter))],
    decryptionProgress: Math.random() * 100,
  });
});

app.post('/api/admin/votings/:votingId/decrypt', (req, res) => {
  const voting = votings.find(v => v.id === req.params.votingId);
  if (voting) {
    console.log('Initiating decryption for voting:', req.params.votingId);
    res.status(200).json({ message: 'Decryption initiated' });
  } else {
    res.status(404).json({ error: 'Voting not found' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Mock backend server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET    /api/votings');
  console.log('  GET    /api/votings/:id');
  console.log('  POST   /api/votings');
  console.log('  PUT    /api/votings/:id');
  console.log('  DELETE /api/votings/:id');
  console.log('  PATCH  /api/votings/:id/status');
  console.log('  POST   /api/votes');
  console.log('  GET    /api/votes/verify/:votingId/:voter');
  console.log('  GET    /api/votes/status/:votingId/:voter');
  console.log('  GET    /api/results/:votingId');
  console.log('  GET    /api/results/:votingId/partial');
  console.log('  GET    /api/admin/stats');
  console.log('  GET    /api/admin/votings/:votingId');
  console.log('  POST   /api/admin/votings/:votingId/decrypt');
});