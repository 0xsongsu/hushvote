const { ethers } = require("hardhat");

async function main() {
  console.log("Creating more sample votings...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Creating with account:", deployer.address);

  const ballotAddress = "0x0B07c2cd59eeE60AE68989bA3F97210Bf424A49C";
  const quadraticAddress = "0x2c5d2e0a35CE77001F638495e6e399765CC650C1";
  
  const FHEBallot = await ethers.getContractFactory("FHEBallot");
  const ballot = FHEBallot.attach(ballotAddress);
  
  const FHEQuadraticVoting = await ethers.getContractFactory("FHEQuadraticVoting");
  const quadratic = FHEQuadraticVoting.attach(quadraticAddress);

  const block = await ethers.provider.getBlock("latest");
  const now = block.timestamp;

  const votings = [
    // Currently active votings
    {
      name: "Team Expansion Vote",
      description: "Should we hire 5 new developers?",
      voteType: 0,
      startTime: now + 60, // Starts in 1 minute
      endTime: now + 86400 * 3, // 3 days
      options: ["Yes", "No"],
      descriptions: ["Hire 5 new developers", "Keep current team size"]
    },
    {
      name: "Marketing Strategy",
      description: "Choose our main marketing focus for 2024",
      voteType: 0,
      startTime: now + 120, // Starts in 2 minutes
      endTime: now + 86400 * 5, // 5 days
      options: ["Social Media", "Conferences", "Online Ads", "Influencers"],
      descriptions: [
        "Focus on social media campaigns",
        "Attend and sponsor conferences",
        "Run online advertising campaigns",
        "Partner with crypto influencers"
      ]
    },
    {
      name: "Token Burn Proposal",
      description: "Burn 10% of treasury tokens?",
      voteType: 0,
      startTime: now + 180, // Starts in 3 minutes
      endTime: now + 86400 * 7, // 7 days
      options: ["Burn 10%", "Burn 5%", "No Burn"],
      descriptions: [
        "Burn 10% of treasury tokens",
        "Burn 5% of treasury tokens",
        "Do not burn any tokens"
      ]
    },
    {
      name: "New Feature Vote",
      description: "Which feature should we build next?",
      voteType: 1, // Multiple choice
      startTime: now + 240, // Starts in 4 minutes
      endTime: now + 86400 * 4, // 4 days
      options: ["Mobile App", "Dark Mode", "AI Integration", "Multi-language"],
      descriptions: [
        "Build native mobile application",
        "Add dark mode theme",
        "Integrate AI features",
        "Add multi-language support"
      ]
    },
    {
      name: "Emergency Protocol",
      description: "Implement emergency pause feature?",
      voteType: 0,
      startTime: now + 300, // Starts in 5 minutes
      endTime: now + 86400 * 2, // 2 days
      options: ["Implement", "Don't Implement"],
      descriptions: [
        "Add emergency pause functionality",
        "Keep current system without pause"
      ]
    },
    {
      name: "Community Fund",
      description: "Allocate funds for community initiatives",
      voteType: 2, // Weighted
      startTime: now + 360, // Starts in 6 minutes
      endTime: now + 86400 * 6, // 6 days
      options: ["Hackathons", "Education", "Bug Bounties", "Meetups"],
      descriptions: [
        "Fund hackathon prizes",
        "Create educational content",
        "Increase bug bounty rewards",
        "Organize community meetups"
      ]
    },
    // Quadratic voting
    {
      name: "Research Priorities",
      description: "Prioritize research areas using quadratic voting",
      voteType: 3,
      startTime: now + 420, // Starts in 7 minutes
      endTime: now + 86400 * 10, // 10 days
      options: ["Zero-Knowledge", "Scalability", "Interoperability"],
      descriptions: [
        "Research zero-knowledge proofs",
        "Focus on scalability solutions",
        "Work on cross-chain interoperability"
      ],
      useQuadratic: true
    }
  ];

  let created = 0;
  for (let i = 0; i < votings.length; i++) {
    const voting = votings[i];
    console.log(`[${i + 1}/${votings.length}] Creating: ${voting.name}`);
    
    try {
      const contract = voting.useQuadratic ? quadratic : ballot;
      
      const votingConfig = {
        name: voting.name,
        description: voting.description,
        voteType: voting.voteType === 3 ? 0 : voting.voteType,
        startTime: voting.startTime,
        endTime: voting.endTime,
        quorum: 1,
        whitelistEnabled: false,
        maxVotersCount: 1000000
      };
      
      const tx = await contract.createVoting(
        votingConfig,
        voting.options,
        voting.descriptions,
        { gasLimit: 5000000 }
      );
      
      const receipt = await tx.wait();
      
      const event = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === "VotingCreated";
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsedEvent = contract.interface.parseLog(event);
        const votingId = parsedEvent.args[0];
        console.log(`  ✓ Created with ID: ${votingId}`);
        created++;
      }
      
    } catch (error) {
      console.log(`  ✗ Failed: ${error.message.substring(0, 50)}...`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\n✅ Successfully created ${created} votings!`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });