const { ethers } = require("hardhat");

async function main() {
  console.log("Creating sample votings for testing...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Creating with account:", deployer.address);

  // Contract addresses - use the actual deployed addresses
  const ballotAddress = "0x0B07c2cd59eeE60AE68989bA3F97210Bf424A49C";
  const quadraticAddress = "0x2c5d2e0a35CE77001F638495e6e399765CC650C1";
  
  const FHEBallot = await ethers.getContractFactory("FHEBallot");
  const ballot = FHEBallot.attach(ballotAddress);
  
  const FHEQuadraticVoting = await ethers.getContractFactory("FHEQuadraticVoting");
  const quadratic = FHEQuadraticVoting.attach(quadraticAddress);

  // Get current block timestamp
  const block = await ethers.provider.getBlock("latest");
  const now = block.timestamp;

  // Sample voting data
  const votings = [
    // Active votings (started, not ended)
    {
      name: "Community Treasury Allocation",
      description: "Vote on how to allocate the community treasury funds for Q1 2024",
      voteType: 0, // Single choice
      startTime: now - 3600, // Started 1 hour ago
      endTime: now + 86400, // Ends in 24 hours
      options: ["DeFi Partnerships", "Developer Grants", "Marketing Campaign", "Reserve Fund"],
      descriptions: [
        "Invest in strategic DeFi protocol partnerships",
        "Fund developer grants and hackathons",
        "Launch comprehensive marketing campaign",
        "Keep funds in reserve for future opportunities"
      ]
    },
    {
      name: "Protocol Upgrade Proposal",
      description: "Should we implement the new privacy-enhanced voting mechanism?",
      voteType: 0,
      startTime: now - 7200, // Started 2 hours ago
      endTime: now + 172800, // Ends in 2 days
      options: ["Yes - Implement", "No - Keep Current", "Abstain"],
      descriptions: [
        "Implement the new FHE-based privacy enhancements",
        "Maintain the current voting system",
        "Abstain from this decision"
      ]
    },
    {
      name: "Fee Structure Adjustment",
      description: "Vote on the new fee structure for the platform",
      voteType: 1, // Multiple choice
      startTime: now - 1800, // Started 30 minutes ago
      endTime: now + 259200, // Ends in 3 days
      options: ["0.1% Fee", "0.25% Fee", "0.5% Fee", "Dynamic Fees"],
      descriptions: [
        "Set flat fee at 0.1%",
        "Set flat fee at 0.25%",
        "Set flat fee at 0.5%",
        "Implement dynamic fee based on volume"
      ]
    },
    
    // Recently ended votings
    {
      name: "Board Election 2024",
      description: "Election for the new board members",
      voteType: 0,
      startTime: now - 259200, // Started 3 days ago
      endTime: now - 3600, // Ended 1 hour ago
      options: ["Alice Chen", "Bob Smith", "Carol Johnson", "David Lee"],
      descriptions: [
        "10 years experience in blockchain",
        "Former CTO of major tech company",
        "DeFi protocol founder",
        "Cryptography researcher"
      ]
    },
    {
      name: "Emergency Response Fund",
      description: "Create an emergency response fund for critical issues",
      voteType: 0,
      startTime: now - 172800, // Started 2 days ago
      endTime: now - 7200, // Ended 2 hours ago
      options: ["Approve", "Reject"],
      descriptions: [
        "Create a 100,000 token emergency fund",
        "Do not create emergency fund"
      ]
    },
    
    // Upcoming votings
    {
      name: "Annual Roadmap 2025",
      description: "Vote on the priority features for 2025 development",
      voteType: 2, // Weighted
      startTime: now + 3600, // Starts in 1 hour
      endTime: now + 604800, // Ends in 7 days
      options: ["Cross-chain Bridge", "Mobile App", "DAO Governance", "NFT Integration", "L2 Scaling"],
      descriptions: [
        "Build cross-chain bridge infrastructure",
        "Develop mobile application",
        "Implement full DAO governance",
        "Add NFT support and marketplace",
        "Deploy on Layer 2 solutions"
      ]
    },
    {
      name: "Partnership with Chainlink",
      description: "Should we integrate Chainlink oracles for price feeds?",
      voteType: 0,
      startTime: now + 7200, // Starts in 2 hours
      endTime: now + 432000, // Ends in 5 days
      options: ["Yes", "No", "Need More Info"],
      descriptions: [
        "Integrate Chainlink price feeds",
        "Use alternative oracle solution",
        "Request more information before deciding"
      ]
    },
    {
      name: "Staking Rewards Rate",
      description: "Adjust the staking rewards APY",
      voteType: 0,
      startTime: now + 86400, // Starts in 1 day
      endTime: now + 518400, // Ends in 6 days
      options: ["5% APY", "8% APY", "10% APY", "12% APY"],
      descriptions: [
        "Conservative 5% annual yield",
        "Moderate 8% annual yield",
        "Competitive 10% annual yield",
        "Aggressive 12% annual yield"
      ]
    },
    
    // Long-running active
    {
      name: "Constitution Amendment",
      description: "Propose changes to the DAO constitution",
      voteType: 0,
      startTime: now - 86400, // Started 1 day ago
      endTime: now + 1209600, // Ends in 14 days
      options: ["Approve Amendment", "Reject Amendment", "Modify Proposal"],
      descriptions: [
        "Accept the proposed constitutional changes",
        "Reject all proposed changes",
        "Send back for modifications"
      ]
    },
    {
      name: "Grant Application: DeFi Research",
      description: "Fund research into advanced DeFi mechanisms",
      voteType: 0,
      startTime: now - 43200, // Started 12 hours ago
      endTime: now + 345600, // Ends in 4 days
      options: ["Fund Full Amount", "Fund 50%", "Reject"],
      descriptions: [
        "Approve full 50,000 token grant",
        "Approve partial 25,000 token grant",
        "Reject grant application"
      ]
    },
    
    // Quadratic voting examples
    {
      name: "Feature Priority Quadratic Vote",
      description: "Use quadratic voting to prioritize new features",
      voteType: 3, // Quadratic
      startTime: now - 1800, // Started 30 minutes ago
      endTime: now + 432000, // Ends in 5 days
      options: ["Privacy Tools", "Analytics Dashboard", "API v2", "Delegation"],
      descriptions: [
        "Enhanced privacy features",
        "Comprehensive analytics dashboard",
        "New API version with more endpoints",
        "Vote delegation mechanism"
      ],
      useQuadratic: true
    },
    {
      name: "Budget Allocation (Quadratic)",
      description: "Allocate budget using quadratic voting for fairness",
      voteType: 3,
      startTime: now + 10800, // Starts in 3 hours
      endTime: now + 777600, // Ends in 9 days
      options: ["Security Audit", "UI Redesign", "Documentation", "Community Events"],
      descriptions: [
        "Professional security audit",
        "Complete UI/UX redesign",
        "Comprehensive documentation update",
        "Community meetups and events"
      ],
      useQuadratic: true
    }
  ];

  console.log(`Creating ${votings.length} sample votings...\n`);

  for (let i = 0; i < votings.length; i++) {
    const voting = votings[i];
    console.log(`[${i + 1}/${votings.length}] Creating: ${voting.name}`);
    
    try {
      const contract = voting.useQuadratic ? quadratic : ballot;
      
      const votingConfig = {
        name: voting.name,
        description: voting.description,
        voteType: voting.voteType === 3 ? 0 : voting.voteType, // Quadratic contract expects 0
        startTime: voting.startTime,
        endTime: voting.endTime,
        quorum: 1,
        whitelistEnabled: false,
        maxVotersCount: 1000000
      };
      
      const tx = await contract.createVoting(
        votingConfig,
        voting.options,
        voting.descriptions
      );
      
      const receipt = await tx.wait();
      
      // Get voting ID from events
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
        console.log(`  ✓ Created with ID: ${votingId} on ${voting.useQuadratic ? 'Quadratic' : 'Ballot'} contract`);
        
        // Determine status
        const status = now < voting.startTime ? "Upcoming" : 
                      now > voting.endTime ? "Ended" : "Active";
        console.log(`  Status: ${status}`);
      }
      
    } catch (error) {
      console.log(`  ✗ Failed: ${error.message}`);
    }
    
    // Small delay between transactions
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log("\n✅ Sample votings creation completed!");
  console.log("\nSummary:");
  console.log("- Active votings: 5");
  console.log("- Ended votings: 2");
  console.log("- Upcoming votings: 3");
  console.log("- Quadratic votings: 2");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });