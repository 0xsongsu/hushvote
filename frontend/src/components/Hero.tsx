import { Button } from "@/components/ui/button";
import { ArrowRight, Shield } from "lucide-react";
import heroImage from "@/assets/hero-blockchain.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-dark"></div>
      
      {/* Hero image with overlay */}
      <div className="absolute inset-0 opacity-30">
        <img 
          src={heroImage} 
          alt="Blockchain voting visualization" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background"></div>
      </div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">Powered by Blockchain Technology</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-bold mb-6 animate-fade-in">
          <span className="gradient-text">HushVote</span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto animate-fade-in">
          The Future of Secure, Anonymous Voting
        </p>

        <p className="text-lg text-muted-foreground/80 mb-12 max-w-2xl mx-auto animate-fade-in">
          Revolutionary blockchain-based voting system ensuring transparency, security, 
          and complete anonymity for every vote cast.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
          <Button size="lg" className="group bg-gradient-primary hover:opacity-90 transition-opacity glow text-primary-foreground">
            Get Started
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button size="lg" variant="outline" className="glass border-primary/30 hover:border-primary/60 hover:bg-primary/10">
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
