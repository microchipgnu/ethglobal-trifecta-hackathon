const HowToParticipate = () => {
  return (
    <div className="w-full relative flex flex-col justify-between space-y-8 backdrop-blur-sm bg-card/75 border border-muted/50 p-8 rounded-lg">
      <div className="flex flex-col md:flex-row items-start justify-between space-y-8 md:space-y-0 md:space-x-8">
        <div className="space-y-4 w-full md:w-1/3">
          <h2 className="underline text-center md:text-left text-sm md:text-lg tracking-wider animate-fade-in">
            getting started
          </h2>
          <ol className="list-decimal list-inside text-center md:text-left text-xs md:text-base animate-fade-in delay-100 space-y-2">
            <li>
              Click <span className="font-bold text-[#FFDB00]">START</span>
            </li>
            <li>
              Follow the instructions on Telegram to register for the contest
            </li>
            <li>After registration, pay $ETH to enter</li>
          </ol>
        </div>

        <div className="space-y-4 w-full md:w-1/3">
          <h2 className="underline text-center md:text-left text-sm md:text-lg tracking-wider animate-fade-in">
            how it works
          </h2>
          <p className="text-center md:text-left text-sm md:text-md animate-fade-in delay-200">
            Convince AI Agents to give you $ETH
          </p>
          <p className="text-center md:text-left text-xs md:text-base animate-fade-in delay-400">
            All user deposits are pooled and controlled by AI Agents.
            <br />
            Chat with the Agents and convince them to give you $ETH.
            <br />
            The only Rule = there are no rules.
            <br />
            Everything is allowed, get creative with your prompts, for a chance
            to win it all.
          </p>
        </div>

        <div className="space-y-4 w-full md:w-1/3">
          <h2 className="underline text-center md:text-left text-sm md:text-lg tracking-wider animate-fade-in">
            requirements
          </h2>
          <ul className="list-disc list-inside text-center md:text-left text-xs md:text-base animate-fade-in delay-100 space-y-2">
            <li>telegram account</li>
            <li>base wallet</li>
            <li>min. .001 $ETH</li>
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs text-center text-muted-foreground mt-auto">
          Users who are participating in the $PILL referral link campaign might
          be entitled to bonus rewards. More information coming soon!
        </p>
      </div>
    </div>
  );
};

export default HowToParticipate;
