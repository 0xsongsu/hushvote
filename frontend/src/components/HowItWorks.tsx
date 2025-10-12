import { CheckCircle2 } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Register & Verify",
    description: "Create your secure account using biometric authentication or digital identity verification.",
  },
  {
    number: "02",
    title: "Cast Your Vote",
    description: "Select your choices in an intuitive interface. Your vote is encrypted before being submitted.",
  },
  {
    number: "03",
    title: "Blockchain Recording",
    description: "Your encrypted vote is recorded on the blockchain as an immutable, timestamped transaction.",
  },
  {
    number: "04",
    title: "Verify & Track",
    description: "Receive a unique transaction ID to verify your vote was recorded without revealing your choice.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How <span className="gradient-text">HushVote</span> Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A simple, secure process that puts you in control
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative flex gap-8 mb-12 last:mb-0 group animate-fade-in"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div className="absolute left-8 top-20 w-0.5 h-full bg-gradient-to-b from-primary to-secondary opacity-30"></div>
              )}

              {/* Step number */}
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center font-bold text-xl glow group-hover:scale-110 transition-transform text-primary-foreground">
                  {step.number}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 glass p-8 rounded-lg group-hover:border-primary/50 transition-all">
                <div className="flex items-start gap-3 mb-3">
                  <CheckCircle2 className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <h3 className="text-2xl font-semibold text-foreground">
                    {step.title}
                  </h3>
                </div>
                <p className="text-muted-foreground leading-relaxed ml-9">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
