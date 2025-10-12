import { Button } from "@/components/ui/button";
import { ArrowRight, Mail } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="glass p-12 md:p-16 rounded-2xl text-center max-w-4xl mx-auto glow-purple">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Revolutionize <span className="gradient-text">Voting</span>?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands of organizations already using HushVote to conduct 
            secure, transparent, and anonymous elections.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-gradient-primary hover:opacity-90 transition-opacity glow text-primary-foreground group">
              Start Voting Now
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="glass border-primary/30 hover:border-primary/60 hover:bg-primary/10">
              <Mail className="mr-2 w-5 h-5" />
              Contact Sales
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-8">
            No credit card required • Free trial available • Enterprise solutions
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
