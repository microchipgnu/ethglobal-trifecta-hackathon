import { formatEther } from 'viem';
import {
    AnimatedAvatar,
    LofiPlayer,
    SystemInfoSimple,
    TaskList
} from '../components';
import { useAgentData } from '../hooks/use-agent-data';
const VNC_HOST =
    import.meta.env.VITE_NODE_ENV === 'production' ? 'computer' : 'localhost';

function Main() {
    const address =
        import.meta.env.VITE_ADDRESS ||
        '0x0';

    const { data } = useAgentData();

    return (
        <div className="w-full h-screen flex flex-col relative overflow-hidden">
            {/* Background grid and effects */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-black opacity-50" />
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `
              linear-gradient(to right, rgba(255, 42, 109, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 42, 109, 0.1) 1px, transparent 1px)
            `,
                        backgroundSize: '40px 40px',
                        opacity: 0.3,
                    }}
                />

                {/* Horizontal scan line effect */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-20 overflow-hidden">
                    <div className="scan-line" />
                </div>

                {/* CRT screen effect */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            'radial-gradient(circle at center, transparent 50%, rgba(0,0,0,0.3) 100%)',
                        mixBlendMode: 'multiply',
                    }}
                />
            </div>

            <iframe
                src={`http://${VNC_HOST}:6080/vnc.html?view_only=1&autoconnect=1&resize=scale`}
                className="w-full h-full border-0 relative z-10"
                allow="fullscreen"
                title="Agent VNC"
            />

            {/* UI Overlay */}
            <div className="absolute inset-0 pointer-events-none z-20">
                <div className="absolute top-2 left-2">
                    <LofiPlayer />
                </div>

                <div className="absolute top-0 left-0 w-[300px] h-[100px]">
                    {/* <TokenCAChart contractAddress="0x1411aff02b272901e34e37b00e5a9219578cbbbd" chainId={8453} height={250} /> */}
                </div>

                <div className='absolute top-0 right-0 w-[300px] bg-black/50 text-white text-xs p-2'>
                    <TaskList />
                </div>

                <div className="absolute bottom-0 right-0 bg-black/70 text-white p-3 rounded-md backdrop-blur-sm border border-[var(--neon-purple)] shadow-lg">
                    <AnimatedAvatar />
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex flex-col">
                            <div className="text-xs opacity-70 mb-1">WALLET</div>
                            <div className="text-sm font-mono" style={{ color: 'var(--neon-cyan)' }}>
                                {address}
                            </div>
                            <div className="mt-1 flex items-center">
                                <span className="text-sm font-bold" style={{ color: 'var(--neon-green)' }}>
                                    {data?.balance ? parseFloat(formatEther(data.balance)).toFixed(4) : '0.0000'}
                                </span>
                                <span className="ml-1 text-xs opacity-70">ETH</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 bg-black/50 text-white text-xs p-2 rounded-md">
                    <SystemInfoSimple />
                </div>
                <div
                    className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-lg font-bold tracking-wider"
                    style={{
                        color: 'var(--neon-pink)',
                        textShadow: '0 0 5px var(--neon-pink)',
                        fontFamily: '"Orbitron", sans-serif',
                        letterSpacing: '0.2em',
                    }}
                >
                    <span style={{ opacity: 0.8 }}>midcurve.live</span>
                </div>
            </div>
        </div>
    );
}

export default Main;
