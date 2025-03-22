export const HowToParticipate = () => {
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
              Connect with our Telegram bot to join the Midcurve community
            </li>
            <li>Explore Midcurve.live and engage with our 24/7 livestream</li>
          </ol>
        </div>

        <div className="space-y-4 w-full md:w-1/3">
          <h2 className="underline text-center md:text-left text-sm md:text-lg tracking-wider animate-fade-in">
            how it works
          </h2>
          <p className="text-center md:text-left text-sm md:text-md animate-fade-in delay-200">
            Interact with our live-streaming AI agent
          </p>
          <p className="text-center md:text-left text-xs md:text-base animate-fade-in delay-400">
            Midcurve.live features a 24/7 livestreamed AI Agent.
            <br />
            The agent researches tokens, conducts trades, and manages the
            Midcurve Treasury.
            <br />
            Participate in real-time discussions and influence decisions.
            <br />
            Watch as the AI analyzes market data and executes trades based on
            community input.
          </p>
        </div>

        <div className="space-y-4 w-full md:w-1/3">
          <h2 className="underline text-center md:text-left text-sm md:text-lg tracking-wider animate-fade-in">
            benefits
          </h2>
          <ul className="list-disc list-inside text-center md:text-left text-xs md:text-base animate-fade-in delay-100 space-y-2">
            <li>Collective intelligence trading</li>
            <li>Transparent decision-making process</li>
            <li>Community ownership via $MCRV tokens</li>
            <li>Base network integration</li>
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs text-center text-muted-foreground mt-auto">
          As a $MCRV token holder, you can influence the agent's behavior and
          decisions. Profits made by the agent are deposited into the Midcurve
          Treasury, managed by token holders.
        </p>
      </div>
    </div>
  );
};
