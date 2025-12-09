'use client';
import { useState, useEffect } from 'react';

interface LogEntry {
    timestamp: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
}

export default function MissionControl() {
    const [logs, setLogs] = useState<LogEntry[]>([
        { timestamp: new Date().toLocaleTimeString(), message: 'System initialized', type: 'info' },
        { timestamp: new Date().toLocaleTimeString(), message: 'Monitoring production telemetry...', type: 'info' },
    ]);
    const [isHealing, setIsHealing] = useState(false);
    const [systemHealth, setSystemHealth] = useState<'healthy' | 'critical' | 'healing'>('healthy');

    // Poll for status updates
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/status');
                const data = await res.json();

                if (data.event) {
                    const newLog: LogEntry = {
                        timestamp: new Date().toLocaleTimeString(),
                        message: data.event.message,
                        type: data.event.type || 'info',
                    };
                    setLogs(prev => [...prev, newLog].slice(-20)); // Keep last 20 logs

                    if (data.event.status) {
                        setSystemHealth(data.event.status);
                    }
                }
            } catch (error) {
                // Silent fail during development
            }
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const handleSimulateFailure = async () => {
        setIsHealing(true);
        setSystemHealth('critical');

        const criticalLog: LogEntry = {
            timestamp: new Date().toLocaleTimeString(),
            message: '🔴 CRITICAL: Memory leak detected in src/vulnerable_code.js - Process exited with code 137',
            type: 'error',
        };
        setLogs(prev => [...prev, criticalLog]);

        try {
            // Trigger Kestra workflow
            const response = await fetch('/api/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    error: 'CRITICAL: Memory leak detected in src/vulnerable_code.js around line 15. Process exited with code 137.',
                }),
            });

            const result = await response.json();

            const triggerLog: LogEntry = {
                timestamp: new Date().toLocaleTimeString(),
                message: result.success ? '🤖 Kestra workflow triggered - Initiating self-healing...' : '❌ Failed to trigger workflow',
                type: result.success ? 'warning' : 'error',
            };
            setLogs(prev => [...prev, triggerLog]);

            if (result.success) {
                setSystemHealth('healing');
            }
        } catch (error) {
            const errorLog: LogEntry = {
                timestamp: new Date().toLocaleTimeString(),
                message: '❌ Error triggering workflow: ' + (error as Error).message,
                type: 'error',
            };
            setLogs(prev => [...prev, errorLog]);
        } finally {
            setIsHealing(false);
        }
    };

    const getLogColor = (type: string) => {
        switch (type) {
            case 'error': return 'text-red-500 border-red-500';
            case 'warning': return 'text-yellow-500 border-yellow-500';
            case 'success': return 'text-green-500 border-green-500';
            default: return 'text-green-400 border-green-500';
        }
    };

    const getHealthIndicator = () => {
        switch (systemHealth) {
            case 'critical':
                return (
                    <div className="flex items-center gap-2 text-red-500">
                        <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></span>
                        <span className="font-bold glitch">CRITICAL ALERT</span>
                    </div>
                );
            case 'healing':
                return (
                    <div className="flex items-center gap-2 text-yellow-500">
                        <span className="h-3 w-3 rounded-full bg-yellow-500 animate-pulse"></span>
                        <span className="font-bold">SELF-HEALING IN PROGRESS</span>
                    </div>
                );
            default:
                return (
                    <div className="flex items-center gap-2 text-green-500">
                        <span className="h-3 w-3 rounded-full bg-green-500"></span>
                        <span className="font-bold">SYSTEM NOMINAL</span>
                    </div>
                );
        }
    };

    return (
        <div className="bg-black text-green-400 min-h-screen p-4 md:p-10 font-mono">
            {/* Header */}
            <div className="border-b border-green-800 pb-4 mb-8">
                <h1 className="text-3xl md:text-5xl font-bold mb-2">
                    META<span className="text-white">MORPH</span> <span className="text-cyber-blue">AI</span>
                </h1>
                <p className="text-gray-400 text-sm md:text-base">
                    Self-Healing DevOps Intelligence System
                </p>
            </div>

            {/* Main Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* Production Telemetry */}
                <div className="border border-green-800 rounded-lg bg-gray-900 p-4 md:p-6 shadow-lg shadow-green-900/20">
                    <h2 className="text-xl md:text-2xl text-white mb-4 flex items-center gap-2">
                        <span className="text-2xl">📊</span> Production Telemetry
                    </h2>

                    {/* System Health */}
                    <div className="mb-6 p-4 bg-black rounded border border-green-800">
                        {getHealthIndicator()}
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-black p-3 rounded border border-green-800">
                            <div className="text-gray-400 text-xs mb-1">UPTIME</div>
                            <div className="text-lg md:text-xl text-white font-bold">99.94%</div>
                        </div>
                        <div className="bg-black p-3 rounded border border-green-800">
                            <div className="text-gray-400 text-xs mb-1">RESPONSE TIME</div>
                            <div className="text-lg md:text-xl text-white font-bold">142ms</div>
                        </div>
                        <div className="bg-black p-3 rounded border border-green-800">
                            <div className="text-gray-400 text-xs mb-1">MEMORY</div>
                            <div className="text-lg md:text-xl text-red-500 font-bold">87%</div>
                        </div>
                        <div className="bg-black p-3 rounded border border-green-800">
                            <div className="text-gray-400 text-xs mb-1">CPU LOAD</div>
                            <div className="text-lg md:text-xl text-yellow-500 font-bold">64%</div>
                        </div>
                    </div>

                    {/* Simulate Failure Button */}
                    <button
                        onClick={handleSimulateFailure}
                        disabled={isHealing}
                        className={`w-full px-4 py-3 rounded font-bold transition-all duration-200 ${isHealing
                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/50 active:scale-95'
                            }`}
                    >
                        {isHealing ? '⏳ HEALING IN PROGRESS...' : '💥 SIMULATE FAILURE'}
                    </button>

                    <p className="text-xs text-gray-500 mt-2 text-center">
                        Triggers Kestra → Cline → Oumi → CodeRabbit loop
                    </p>
                </div>

                {/* Agent Brain Stream */}
                <div className="border border-green-800 rounded-lg bg-gray-900 p-4 md:p-6 shadow-lg shadow-green-900/20">
                    <h2 className="text-xl md:text-2xl text-white mb-4 flex items-center gap-2">
                        <span className="text-2xl">🤖</span> Agent Activity Stream
                    </h2>

                    <div className="h-80 md:h-96 overflow-y-auto bg-black rounded border border-green-800 p-3 font-mono text-xs md:text-sm">
                        {logs.map((log, i) => (
                            <div
                                key={i}
                                className={`mb-2 pb-2 border-l-2 pl-3 ${getLogColor(log.type)}`}
                            >
                                <span className="text-gray-500">[{log.timestamp}]</span>{' '}
                                <span>{log.message}</span>
                            </div>
                        ))}
                        <div className="cursor-blink text-green-400"></div>
                    </div>

                    {/* Agent Status */}
                    <div className="mt-4 p-3 bg-black rounded border border-green-800">
                        <div className="text-xs text-gray-400 mb-1">AGENT STATUS</div>
                        <div className="text-sm text-green-400">
                            {systemHealth === 'healing' ? '⚡ Analyzing code and generating fix...' : '💤 Standby mode'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Architecture Overview */}
            <div className="mt-8 border border-green-800 rounded-lg bg-gray-900 p-4 md:p-6">
                <h2 className="text-xl text-white mb-4">🏗️ System Architecture</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                    <div className="bg-black p-3 rounded border border-green-800 hover:border-neon-green transition-colors">
                        <div className="text-2xl mb-2">🧠</div>
                        <div className="text-xs text-white font-bold">KESTRA</div>
                        <div className="text-xs text-gray-400">Orchestration</div>
                    </div>
                    <div className="bg-black p-3 rounded border border-green-800 hover:border-neon-green transition-colors">
                        <div className="text-2xl mb-2">⚡</div>
                        <div className="text-xs text-white font-bold">CLINE</div>
                        <div className="text-xs text-gray-400">Agent</div>
                    </div>
                    <div className="bg-black p-3 rounded border border-green-800 hover:border-neon-green transition-colors">
                        <div className="text-2xl mb-2">🎯</div>
                        <div className="text-xs text-white font-bold">OUMI</div>
                        <div className="text-xs text-gray-400">Evaluation</div>
                    </div>
                    <div className="bg-black p-3 rounded border border-green-800 hover:border-neon-green transition-colors">
                        <div className="text-2xl mb-2">👁️</div>
                        <div className="text-xs text-white font-bold">VERCEL</div>
                        <div className="text-xs text-gray-400">Dashboard</div>
                    </div>
                    <div className="bg-black p-3 rounded border border-green-800 hover:border-neon-green transition-colors">
                        <div className="text-2xl mb-2">🛡️</div>
                        <div className="text-xs text-white font-bold">CODERABBIT</div>
                        <div className="text-xs text-gray-400">Quality Gate</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
