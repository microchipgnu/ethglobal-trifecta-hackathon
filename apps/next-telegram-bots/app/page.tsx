import Hero from './components/hero';
import HowToParticipate from './components/how-to-participate';
export const metadata = {
  title: 'W3GPT Telegram Agents',
  description: 'W3GPT Agents',
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main
      className="min-h-screen text-white"
      style={{
        background: 'linear-gradient(to bottom, #f0f4ff, #e6eeff, #d9e6ff)',
        color: '#333',
      }}
    >
      <div className="flex flex-col w-full md:w-7/8 min-h-screen mx-auto p-2 justify-between items-center space-y-8">
        <div className="p-12">
          <img
            src="/midcurve-diagram.webp"
            alt="X"
            className="h-16 w-auto transition-transform duration-1000 animate__fadeInDown"
          />
        </div>

        <div />
        <Hero />
        <HowToParticipate />

        <div className="w-full p-5 gap-5 flex flex-col md:flex-row justify-between items-center transition-transform duration-1000 animate__fadeInUp space-y-8 md:space-y-0">
          <div className="flex space-x-4">
            <a
              href="https://x.com/0xSoko"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/x-logo.png"
                alt="X"
                className="h-6 w-6 transition-transform duration-200 hover:scale-110"
              />
            </a>
            <a
              href="https://t.me/midcurvelive"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/tg-logo.png"
                alt="Telegram"
                className="h-6 w-6 transition-transform duration-200 hover:scale-110"
              />
            </a>
          </div>

          <div className="flex space-x-4">
            <img src="/base-logo.png" alt="Logo 1" className="h-7 w-auto" />
          </div>
        </div>
      </div>
    </main>
  );
}
