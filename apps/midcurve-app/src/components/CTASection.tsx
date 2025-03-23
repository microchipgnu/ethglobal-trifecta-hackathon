import React from "react";
import { Button } from "@/components/ui/button";
import { MessageSquareText, ExternalLink, Rocket } from "lucide-react";
import GlowEffect from "./GlowEffect";

const CTASection = () => {
	return (
		<section className="py-12 md:py-24 md:px-4 relative overflow-hidden">
			<div className="absolute inset-0 opacity-10 pointer-events-none">
				<img
					src="/midcurve-diagram.png"
					alt="Bell curve meme"
					className="w-full h-full object-cover opacity-30"
				/>
			</div>
			<div className="absolute inset-0 -z-10 bg-gradient-to-b from-base-dark-1/0 via-primary/5 to-base-dark-1/0 opacity-50" />

			<div className="container mx-auto max-w-4xl relative z-10">
				<GlowEffect
					className="rounded-2xl p-8 md:p-12 text-center transform rotate-1"
					color="from-primary/20 to-purple-500/20"
					size="lg"
					intensity="high"
				>
					<div className="glass-card rounded-2xl p-8 md:p-12 border-2 border-dashed border-primary/30 relative">
						<img
							src="/midcurve.png"
							alt="Crying wojak"
							className="absolute -top-10 -right-10 w-20 h-20 transform rotate-12 animate-pulse rounded-xs"
						/>

						<h2 className="text-3xl md:text-4xl font-bold mb-4 font-mono">
							<span className="text-gradient">Join the Chat</span>
						</h2>
						<p className="text-white/70 max-w-2xl mx-auto mb-8 font-mono">
							Jump into our Telegram group and start chatting to make an impact
							on the stream. Buy and hold $MCRV for more ways to engage with
							Midcurve agent.
							<span className="inline-block animate-bounce ml-2">🚀</span>
						</p>

						<div className="flex flex-col sm:flex-row justify-center gap-4">
							<Button
								asChild
								size="lg"
								className="bg-primary hover:bg-primary/90 font-medium font-mono group relative overflow-hidden"
							>
								<a
									href="https://t.me/midcurvelive"
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-2"
								>
									<MessageSquareText className="h-5 w-5 relative z-10" />
									<span className="relative z-10">Join Telegram</span>
									<span className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
								</a>
							</Button>
							<Button
								asChild
								variant="outline"
								size="lg"
								className="border-white/10 hover:bg-white/5 font-mono"
							>
								<a href="#livestream" className="flex items-center gap-2">
									Livestream <ExternalLink className="h-4 w-4" />
								</a>
							</Button>
						</div>

						<div className="mt-10 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-center gap-6 text-sm">
							<div className="flex items-center gap-2 bg-base-dark-2/50 px-3 py-1 rounded-full">
								<div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
								<span className="text-white/70 font-mono">
									24/7 Live Trading
								</span>
							</div>
							<div className="flex items-center gap-2 bg-base-dark-2/50 px-3 py-1 rounded-full transform -rotate-1">
								<div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
								<span className="text-white/70 font-mono">
									Community <s>FUD</s> FUN
								</span>
							</div>
							<div className="flex items-center gap-2 bg-base-dark-2/50 px-3 py-1 rounded-full transform rotate-1">
								<div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
								<span className="text-white/70 font-mono">Cope Together</span>
							</div>
						</div>
					</div>
				</GlowEffect>
			</div>
		</section>
	);
};

export default CTASection;
