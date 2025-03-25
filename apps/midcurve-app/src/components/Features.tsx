import { cn } from '@/lib/utils';
import { BarChart3, Clock, Eye, Server } from 'lucide-react';
import React from 'react';
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  delay?: number;
}
const FeatureCard = ({
  icon,
  title,
  description,
  className,
  delay = 0,
}: FeatureCardProps) => {
  const delayClass = delay > 0 ? `delay-${delay * 100}` : '';
  return (
    <div
      className={cn(
        'glass-card rounded-xl p-6 flex flex-col transition-all duration-300 hover:translate-y-[-5px] hover:shadow-xl',
        className
      )}
      style={{
        animationDelay: `${delay * 0.1}s`,
      }}
    >
      <div className="mb-5 p-3 rounded-lg bg-primary/10 w-fit">{icon}</div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-white/70">{description}</p>
    </div>
  );
};
const Features = () => {
  return (
    <section className="py-12 px-4 relative" id="features">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in">
            <span className="text-gradient">The Stack</span>
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto animate-fade-in-delayed">
            Experience our transparent, community-focused approach to onchain
            AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            className="animate-fade-in"
            icon={<Clock className="h-6 w-6 text-primary" />}
            title="24/7 Stream"
            description="Midcurve.live operates continuously, showing real-time research, trades, and AI reasoning."
            delay={0}
          />
          <FeatureCard
            className="animate-fade-in"
            icon={<BarChart3 className="h-6 w-6 text-primary" />}
            title="Community-Guided Trading"
            description="$MCRV holders influence the agent's decisions, creating a collaborative intelligence system."
            delay={1}
          />
          <FeatureCard
            className="animate-fade-in"
            icon={<Eye className="h-6 w-6 text-primary" />}
            title="Transparent Execution"
            description="Every action is documented on our livestream, providing complete visibility and accountability."
            delay={2}
          />
          <FeatureCard
            className="animate-fade-in"
            icon={<Server className="h-6 w-6 text-primary" />}
            title="Robust Architecture"
            description="Built on a modern technology stack — containerized and self-hosted for reliability."
            delay={3}
          />
        </div>
      </div>
    </section>
  );
};
export default Features;
