import {
	MessageSquare,
	TrendingUp,
	Database,
	Users,
	Rocket,
	Laugh,
} from "lucide-react";

interface TokenFeatureProps {
	icon: React.ReactNode;
	title: string;
	description: string;
	rotateEffect?: "left" | "right";
}

const TokenFeature = ({
	icon,
	title,
	description,
	rotateEffect,
}: TokenFeatureProps) => {
	const rotateClass =
		rotateEffect === "left"
			? "hover:-rotate-2"
			: rotateEffect === "right"
				? "hover:rotate-2"
				: "";

	return (
		<div
			className={`flex gap-4 p-5 rounded-lg bg-base-dark-2/60 hover:bg-base-dark-3/60 transition-all duration-300 ${rotateClass} border border-dashed border-primary/20 transform hover:scale-105`}
		>
			<div className="mt-1">
				<div className="p-2 bg-primary/10 rounded-lg">{icon}</div>
			</div>
			<div>
				<h3 className="text-lg font-medium mb-2 font-mono">{title}</h3>
				<p className="text-white/70 text-sm">{description}</p>
			</div>
		</div>
	);
};

const TokenInfo = () => {
	return (
		<section className="py-20 px-4 bg-base-dark-1 relative" id="token">
			<div className="absolute inset-0 opacity-10 pointer-events-none">
				<img
					src="/midcurve-diagram.png"
					alt="Bell curve meme"
					className="w-full h-full object-cover opacity-20"
				/>
			</div>

			<div className="container mx-auto max-w-6xl">
				<div className="text-center mb-16">
					<div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4 animate-fade-in transform hover:scale-110 transition-transform hover:rotate-3">
						<span className="text-sm text-primary font-mono animate-pulse">
							$MCRV
						</span>
					</div>

					<h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in">
						<span className="text-gradient">WTF is $MCRV?</span>
					</h2>
					<p className="text-white/70 max-w-2xl mx-auto animate-fade-in-delayed font-mono">
						A token that powers community-driven AI trading, giving holders a
						voice in algorithm decisions.
						<span className="inline-block ml-2 transform animate-bounce">
							🚀
						</span>
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<TokenFeature
						icon={<TrendingUp className="h-5 w-5 text-primary" />}
						title="Token-Gated Influence"
						description="Hold $MCRV to influence AI trading strategies. More tokens = stronger influence on agent decisions."
						rotateEffect="left"
					/>
					<TokenFeature
						icon={<MessageSquare className="h-5 w-5 text-primary" />}
						title="Telegram Community"
						description="Join our Telegram to interact with the community, share insights, and watch the AI perform trades in real-time."
						rotateEffect="right"
					/>
					<TokenFeature
						icon={<Database className="h-5 w-5 text-primary" />}
						title="Real-Time Transparency"
						description="Watch the AI's trades in real-time and see how community input shapes trading strategies."
						rotateEffect="left"
					/>
					<TokenFeature
						icon={<Laugh className="h-5 w-5 text-primary" />}
						title="Community Governance"
						description="Share ideas and voting power with fellow holders as we collectively guide the AI's trading journey."
						rotateEffect="right"
					/>
				</div>

				<div className="mt-12 max-w-md mx-auto">
					<div className="bg-base-dark-2/50 p-4 rounded-lg border border-yellow-500/30 flex gap-3 items-center transform -rotate-1">
						<p className="text-yellow-500/80 text-sm font-mono italic">
							"Not financial advice. DYOR and always trade responsibly."
						</p>
					</div>
				</div>
			</div>
		</section>
	);
};

export default TokenInfo;
