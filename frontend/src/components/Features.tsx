import { Shield, Eye, Lock, Zap, Database, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Shield,
    title: "Blockchain Security",
    description: "Immutable records secured by advanced cryptographic algorithms ensure every vote is protected and tamper-proof.",
  },
  {
    icon: Eye,
    title: "Complete Transparency",
    description: "Every transaction is publicly verifiable on the blockchain while maintaining voter privacy through encryption.",
  },
  {
    icon: Lock,
    title: "Anonymous Voting",
    description: "Zero-knowledge proofs ensure your vote remains completely private while still being verifiable.",
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Real-time vote counting with automated tallying eliminates delays and reduces human error.",
  },
  {
    icon: Database,
    title: "Decentralized Storage",
    description: "Distributed across multiple nodes, making it impossible for any single entity to manipulate results.",
  },
  {
    icon: Users,
    title: "Accessible to All",
    description: "User-friendly interface designed for everyone, from tech-savvy users to first-time blockchain voters.",
  },
];

const Features = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Why Choose <span className="gradient-text">HushVote</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Built on cutting-edge blockchain technology to revolutionize the voting experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="glass p-8 hover:border-primary/50 transition-all duration-300 group hover:glow animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-lg bg-gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform glow">
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
