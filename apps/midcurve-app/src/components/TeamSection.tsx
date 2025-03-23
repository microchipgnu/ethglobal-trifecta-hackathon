import React from "react";
import { Github } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
interface TeamMemberProps {
	name: string;
	alias: string;
	teamRole: string;
	image: string;
	memeImage?: string;
	github?: string;
	x?: string;
	rotateEffect?: boolean;
}
const TeamMember = ({
	name,
	alias,
	teamRole,
	image,
	memeImage,
	github,
	x,
	rotateEffect,
}: TeamMemberProps) => {
	return (
		<div
			className={`glass-card rounded-xl p-6 flex flex-col items-center text-center transition-all duration-300 hover:translate-y-[-10px] ${rotateEffect ? "hover:rotate-3" : ""} border-2 border-dashed border-primary/50 bg-base-dark-2/50`}
		>
			<div className="w-28 h-28 rounded-full overflow-hidden mb-4 border-2 border-primary/50 p-1 relative group">
				<img
					src={image}
					alt={name}
					className="w-full h-full object-cover rounded-full transition-opacity duration-300 group-hover:opacity-0"
				/>
				{memeImage && (
					<img
						src={memeImage}
						alt={`${name} meme`}
						className="absolute inset-0 w-full h-full object-cover rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
					/>
				)}
			</div>
			<h3 className="text-xl font-semibold mb-1">{name}</h3>
			<p className="text-primary mb-2 text-sm font-mono">{alias}</p>
			<div className="bg-primary/10 px-3 py-1 rounded-full text-xs text-white/70 mb-4">
				{teamRole}
			</div>

			<div className="flex gap-3 mt-auto">
				{github && (
					<a
						href={github}
						target="_blank"
						rel="noopener noreferrer"
						className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
					>
						<Github className="h-4 w-4" />
					</a>
				)}
				{x && (
					<a
						href={x}
						target="_blank"
						rel="noopener noreferrer"
						className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
					>
						<svg
							className="h-4 w-4"
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<title>X</title>
							<path d="M4 4l11.733 16h4.267l-11.733 -16z" />
							<path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
						</svg>
					</a>
				)}
			</div>
		</div>
	);
};
const TeamSection = () => {
	return (
		<section className="py-20 px-4 relative" id="team">
			<div className="container mx-auto max-w-6xl">
				<div className="text-center mb-16">
					<div className="inline-flex items-center justify-center font-mono px-3 py-1 rounded-full bg-primary/20 border border-primary/50 mb-4 rotate-2 animate-bounce">
						<span className="text-sm text-primary font-bold">THE BUILDERS</span>
					</div>

					<h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in">
						<span className="text-gradient">Midcurve Devs</span>
					</h2>
					<p className="text-white/70 max-w-2xl mx-auto animate-fade-in-delayed italic">
						&quot;Not financial advice, but we're pretty good at
						midcurving&quot; 💸
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
					<TeamMember
						name="Luis"
						alias="microchipgnu"
						teamRole="Vibestreamer"
						image="/micro.png"
						memeImage="/midcurve.png"
						github="https://github.com/microchipgnu"
						x="https://x.com/microchipgnu"
						rotateEffect={true}
					/>
					<TeamMember
						name="Markeljan"
						alias="Soko"
						teamRole="Wojak University Alumni"
						image="/soko.png"
						memeImage="/midcurve.png"
						github="https://github.com/markeljan"
						x="https://x.com/0xSoko"
						rotateEffect={true}
					/>
				</div>

				<div className="mt-16 text-center max-w-3xl mx-auto p-6 rounded-xl bg-base-dark-2/50 border-2 border-dashed border-primary/30 transform rotate-1">
					<h3 className="text-xl font-semibold mb-4 font-mono text-primary">
						🏆 Past Hacks 👨‍💻
					</h3>
					<p className="text-white/70 mb-6">
						Follow our journey in the trenches.
					</p>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<a
							href="https://w3gpt.ai"
							target="_blank"
							rel="noopener noreferrer"
							className="p-4 rounded-lg bg-base-dark-3 hover:bg-primary/10 transition-colors flex flex-col items-center transform hover:-rotate-3 border border-primary/20"
						>
							<h4 className="font-medium mb-1">W3GPT</h4>
							<span className="text-white/50 text-sm">ETHGlobal Finalist</span>
						</a>
						<a
							href="https://becomeagi-com.vercel.app"
							target="_blank"
							rel="noopener noreferrer"
							className="p-4 rounded-lg bg-base-dark-3 hover:bg-primary/10 transition-colors flex flex-col items-center transform hover:rotate-3 border border-primary/20"
						>
							<h4 className="font-medium mb-1">{"become{AGI}"}</h4>
							<span className="text-white/50 text-sm">ETHGlobal Finalist</span>
						</a>
						<a
							href="https://aim.tools"
							target="_blank"
							rel="noopener noreferrer"
							className="p-4 rounded-lg bg-base-dark-3 hover:bg-primary/10 transition-colors flex flex-col items-center transform hover:-rotate-3 border border-primary/20"
						>
							<h4 className="font-medium mb-1">AIM.tools</h4>
							<span className="text-white/50 text-sm">ETHGlobal Finalist</span>
						</a>
					</div>
				</div>
			</div>
		</section>
	);
};
export default TeamSection;
