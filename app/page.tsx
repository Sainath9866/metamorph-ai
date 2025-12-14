'use client';
import { useState, useEffect } from 'react';

interface LogEntry {
    timestamp: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
}

interface GitHubUser {
    login: string;
    name: string;
}

interface Repository {
    id: number;
    name: string;
    full_name: string;
    description: string;
    private: boolean;
}

export default function MissionControl() {
    const [logs, setLogs] = useState<LogEntry[]>([
        { timestamp: new Date().toLocaleTimeString(), message: 'System initialized', type: 'info' },
        { timestamp: new Date().toLocaleTimeString(), message: 'Monitoring production telemetry...', type: 'info' },
    ]);
    const [isHealing, setIsHealing] = useState(false);
    const [systemHealth, setSystemHealth] = useState<'healthy' | 'critical' | 'healing'>('healthy');

    // GitHub integration state
    const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);
    const [repositories, setRepositories] = useState<Repository[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<string>('');
    const [showRepoSelector, setShowRepoSelector] = useState(false);
    const [isSettingUp, setIsSettingUp] = useState(false);
    const [setupPrUrl, setSetupPrUrl] = useState<string>('');

    // Check if user is authenticated on mount
    useEffect(() => {
        const checkAuth = () => {
            const userCookie = document.cookie.split('; ').find(row => row.startsWith('github_user='));
            if (userCookie) {
                try {
                    const userData = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
                    setGithubUser(userData);
                    fetchRepositories();
                } catch (e) {
                    console.error('Failed to parse user data:', e);
                }
            }
        };
        checkAuth();

        // Check URL params for OAuth redirect
        const params = new URLSearchParams(window.location.search);
        if (params.get('github_connected') === 'true') {
            // Remove param from URL
            window.history.replaceState({}, document.title, window.location.pathname);
            checkAuth();
        }
    }, []);

    const fetchRepositories = async () => {
        try {
            const res = await fetch('/api/repos');
            if (res.ok) {
                const data = await res.json();
                setRepositories(data.repos);
            }
        } catch (error) {
            console.error('Failed to fetch repositories:', error);
        }
    };

    const handleConnectGitHub = () => {
        window.location.href = '/api/auth/github';
    };

    const handleSetupWorkflow = async () => {
        if (!selectedRepo) {
            alert('Please select a repository first!');
            return;
        }

        setIsSettingUp(true);
        const setupLog: LogEntry = {
            timestamp: new Date().toLocaleTimeString(),
            message: `⚙️ Setting up self-healing on ${selectedRepo}...`,
            type: 'info',
        };
        setLogs(prev => [...prev, setupLog]);

        try {
            const response = await fetch('/api/setup-workflow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repository: selectedRepo }),
            });

            const result = await response.json();

            if (result.success) {
                setSetupPrUrl(result.pr_url);
                const successLog: LogEntry = {
                    timestamp: new Date().toLocaleTimeString(),
                    message: `✅ Setup PR created! Please merge: ${result.pr_url}`,
                    type: 'success',
                };
                setLogs(prev => [...prev, successLog]);
            } else {
                const errorLog: LogEntry = {
                    timestamp: new Date().toLocaleTimeString(),
                    message: `❌ Setup failed: ${result.error}`,
                    type: 'error',
                };
                setLogs(prev => [...prev, errorLog]);
            }
        } catch (error) {
            const errorLog: LogEntry = {
                timestamp: new Date().toLocaleTimeString(),
                message: '❌ Error setting up workflow: ' + (error as Error).message,
                type: 'error',
            };
            setLogs(prev => [...prev, errorLog]);
        } finally {
            setIsSettingUp(false);
        }
    };

    const handleSimulateFailure = async () => {
        if (!selectedRepo && githubUser) {
            alert('Please select a repository first!');
            setShowRepoSelector(true);
            return;
        }

        setIsHealing(true);
        setSystemHealth('critical');

        const criticalLog: LogEntry = {
            timestamp: new Date().toLocaleTimeString(),
            message: '🔴 CRITICAL: Memory leak detected in src/vulnerable_code.js - Process exited with code 137',
            type: 'error',
        };
        setLogs(prev => [...prev, criticalLog]);

        try {
            const response = await fetch('/api/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    repository: selectedRepo || 'Sainath9866/metamorph-ai',
                    error_logs: 'CRITICAL: Memory leak detected in src/vulnerable_code.js around line 15. Process exited with code 137.',
                }),
            });

            const result = await response.json();

            const triggerLog: LogEntry = {
                timestamp: new Date().toLocaleTimeString(),
                message: result.success
                    ? `🤖 Self-healing initiated on ${selectedRepo || 'default repo'}...`
                    : `❌ ${result.error || 'Failed to trigger workflow'}`,
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

    // Previous helper functions remain the same
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
            <div className="border-b border-green-800 pb-4 mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl md:text-5xl font-bold mb-2">
                        META<span className="text-white">MORPH</span> <span className="text-cyber-blue">AI</span>
                    </h1>
                    <p className="text-gray-400 text-sm md:text-base">
                        Self-Healing DevOps Intelligence System
                    </p>
                </div>

                {/* GitHub Auth Button */}
                {!githubUser ? (
                    <button
                        onClick={handleConnectGitHub}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded border border-green-800 transition-all"
                    >
                        🔗 Connect GitHub
                    </button>
                ) : (
                    <div className="text-right">
                        <div className="text-sm text-gray-400">Connected as</div>
                        <div className="text-green-400 font-bold">{githubUser.login}</div>
                    </div>
                )}
            </div>

            {/* Repository Selector (if authenticated) */}
            {githubUser && (
                <div className="mb-6 border border-green-800 rounded-lg bg-gray-900 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg text-white">📂 Target Repository</h3>
                        <button
                            onClick={() => setShowRepoSelector(!showRepoSelector)}
                            className="text-xs px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded border border-green-800"
                        >
                            {showRepoSelector ? 'Hide' : 'Select Repo'}
                        </button>
                    </div>

                    {selectedRepo && (
                        <div className="mb-3">
                            <div className="text-sm text-green-400 mb-2">
                                Selected: <span className="font-bold">{selectedRepo}</span>
                            </div>

                            {/* Setup Workflow Button */}
                            {!setupPrUrl ? (
                                <button
                                    onClick={handleSetupWorkflow}
                                    disabled={isSettingUp}
                                    className={`w-full px-3 py-2 rounded text-sm font-bold transition-all ${isSettingUp
                                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-500'
                                        }`}
                                >
                                    {isSettingUp ? '⚙️ Setting up...' : '🚀 Setup Self-Healing (One-Time)'}
                                </button>
                            ) : (
                                <div className="bg-green-900 border border-green-500 rounded p-3">
                                    <div className="text-green-400 text-sm font-bold mb-1">✅ Setup PR Created!</div>
                                    <a
                                        href={setupPrUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                                    >
                                        View PR →
                                    </a>
                                    <div className="text-xs text-gray-400 mt-1">Merge the PR to enable self-healing</div>
                                </div>
                            )}
                        </div>
                    )}

                    {showRepoSelector && (
                        <div className="max-h-60 overflow-y-auto bg-black rounded border border-green-800 p-2">
                            {repositories.length === 0 ? (
                                <div className="text-gray-500 text-sm p-2">Loading repositories...</div>
                            ) : (
                                repositories.map(repo => (
                                    <div
                                        key={repo.id}
                                        onClick={() => {
                                            setSelectedRepo(repo.full_name);
                                            setShowRepoSelector(false);
                                        }}
                                        className={`p-2 rounded cursor-pointer transition-colors hover:bg-gray-800 ${selectedRepo === repo.full_name ? 'bg-gray-800 border-l-4 border-green-500' : ''
                                            }`}
                                    >
                                        <div className="text-sm text-white">{repo.name}</div>
                                        <div className="text-xs text-gray-400 truncate">{repo.description || 'No description'}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Main Dashboard - Previous content continues... */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* Production Telemetry */}
                <div className="border border-green-800 rounded-lg bg-gray-900 p-4 md:p-6 shadow-lg shadow-green-900/20">
                    <h2 className="text-xl md:text-2xl text-white mb-4 flex items-center gap-2">
                        <span className="text-2xl">📊</span> Production Telemetry
                    </h2>

                    <div className="mb-6 p-4 bg-black rounded border border-green-800">
                        {getHealthIndicator()}
                    </div>

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

                    <button
                        onClick={handleSimulateFailure}
                        disabled={isHealing || (!githubUser && !selectedRepo)}
                        className={`w-full px-4 py-3 rounded font-bold transition-all duration-200 ${isHealing || (!githubUser && !selectedRepo)
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/50 active:scale-95'
                            }`}
                    >
                        {isHealing ? '⏳ HEALING IN PROGRESS...' : '💥 SIMULATE FAILURE'}
                    </button>

                    <p className="text-xs text-gray-500 mt-2 text-center">
                        {githubUser
                            ? `Triggers on ${selectedRepo || 'selected repository'}`
                            : 'Connect GitHub to enable'}
                    </p>
                </div>

                {/* Agent Activity Stream - same as before */}
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

                    <div className="mt-4 p-3 bg-black rounded border border-green-800">
                        <div className="text-xs text-gray-400 mb-1">AGENT STATUS</div>
                        <div className="text-sm text-green-400">
                            {systemHealth === 'healing' ? '⚡ Analyzing code and generating fix...' : '💤 Standby mode'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Architecture Overview - same as before */}
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
