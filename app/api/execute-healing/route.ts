import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import AdmZip from 'adm-zip';

const execAsync = promisify(exec);

export async function POST(request: Request) {
    try {
        const { repository, mission, github_token } = await request.json();

        if (!repository || !mission) {
            return NextResponse.json(
                { error: 'Repository and mission are required' },
                { status: 400 }
            );
        }

        // Validate METAMORPH_API_KEY is configured
        if (!process.env.METAMORPH_API_KEY) {
            return NextResponse.json(
                { error: 'MetaMorph API key not configured' },
                { status: 500 }
            );
        }

        const [owner, repo] = repository.split('/');
        const tempDir = path.join('/tmp', `metamorph-${Date.now()}`);

        try {
            // Download repository as ZIP via GitHub API
            const zipResponse = await fetch(`https://api.github.com/repos/${repository}/zipball/main`, {
                headers: github_token ? {
                    Authorization: `Bearer ${github_token}`,
                    Accept: 'application/vnd.github.v3+json',
                } : {
                    Accept: 'application/vnd.github.v3+json',
                },
            });

            if (!zipResponse.ok) {
                throw new Error(`Failed to download repository: ${zipResponse.statusText}`);
            }

            // Save ZIP file
            const zipBuffer = Buffer.from(await zipResponse.arrayBuffer());
            const zipPath = `${tempDir}.zip`;
            await fs.mkdir(path.dirname(zipPath), { recursive: true });
            await fs.writeFile(zipPath, zipBuffer);

            // Extract ZIP
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(tempDir, true);

            // Find the extracted folder (GitHub creates a folder with commit hash)
            const entries = await fs.readdir(tempDir);
            const extractedFolder = path.join(tempDir, entries[0]);

            // Run Cline with MetaMorph's API key
            const { stdout, stderr } = await execAsync(
                `cd ${extractedFolder} && npx cline@latest --autonomous --task "${mission}" --max-iterations 5`,
                {
                    env: {
                        ...process.env,
                        OPENAI_API_KEY: process.env.METAMORPH_API_KEY,
                    },
                    timeout: 300000, // 5 minutes
                }
            );

            console.log('Cline output:', stdout);
            if (stderr) console.error('Cline errors:', stderr);

            // Check for changes by comparing files
            const changedFiles = await findChangedFiles(extractedFolder);

            if (changedFiles.length === 0) {
                // No changes made
                await cleanup(tempDir, zipPath);
                return NextResponse.json({
                    success: true,
                    message: 'No changes needed',
                    changes_made: false,
                });
            }

            // Create a new branch and PR via GitHub API
            if (github_token) {
                const branchName = `metamorph-fixes-${Date.now()}`;

                // Get the default branch SHA
                const refResponse = await fetch(`https://api.github.com/repos/${repository}/git/refs/heads/main`, {
                    headers: {
                        Authorization: `Bearer ${github_token}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                });
                const refData = await refResponse.json();
                const baseSha = refData.object.sha;

                // Create new branch
                await fetch(`https://api.github.com/repos/${repository}/git/refs`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${github_token}`,
                        Accept: 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ref: `refs/heads/${branchName}`,
                        sha: baseSha,
                    }),
                });

                // Upload changed files
                for (const file of changedFiles) {
                    const content = await fs.readFile(path.join(extractedFolder, file.path), 'utf-8');
                    const encodedContent = Buffer.from(content).toString('base64');

                    await fetch(`https://api.github.com/repos/${repository}/contents/${file.path}`, {
                        method: 'PUT',
                        headers: {
                            Authorization: `Bearer ${github_token}`,
                            Accept: 'application/vnd.github.v3+json',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            message: `fix: Auto-heal ${file.path}`,
                            content: encodedContent,
                            branch: branchName,
                            sha: file.sha, // Need to get original file SHA
                        }),
                    });
                }

                // Create PR
                const prResponse = await fetch(`https://api.github.com/repos/${repository}/pulls`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${github_token}`,
                        Accept: 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: '🤖 MetaMorph AI: Automated Code Fixes',
                        body: `## 🤖 Autonomous Code Healing\n\nThis PR was automatically generated by MetaMorph AI.\n\n**Mission:** ${mission}\n\n### Files Changed:\n${changedFiles.map(f => `- ${f.path}`).join('\n')}\n\nPowered by MetaMorph AI 🛡️`,
                        head: branchName,
                        base: 'main',
                    }),
                });

                const prData = await prResponse.json();

                // Cleanup
                await cleanup(tempDir, zipPath);

                return NextResponse.json({
                    success: true,
                    message: 'Healing complete, PR created',
                    changes_made: true,
                    pr_url: prData.html_url,
                    pr_number: prData.number,
                });
            } else {
                await cleanup(tempDir, zipPath);

                return NextResponse.json({
                    success: true,
                    message: 'Healing complete (changes made but no token to create PR)',
                    changes_made: true,
                });
            }

        } catch (error) {
            // Cleanup on error
            try {
                await cleanup(tempDir, `${tempDir}.zip`);
            } catch { }

            throw error;
        }

    } catch (error) {
        console.error('Healing execution error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Healing failed',
            },
            { status: 500 }
        );
    }
}

async function findChangedFiles(dir: string): Promise<Array<{ path: string; sha: string }>> {
    // Simplified - in production, compare with original files
    // For now, return all JS files as potentially changed
    const files: Array<{ path: string; sha: string }> = [];

    async function walk(currentPath: string, relativePath: string = '') {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);
            const relPath = path.join(relativePath, entry.name);

            if (entry.isDirectory() && !entry.name.startsWith('.')) {
                await walk(fullPath, relPath);
            } else if (entry.isFile() && entry.name.endsWith('.js')) {
                files.push({ path: relPath, sha: '' }); // SHA would come from comparing with original
            }
        }
    }

    await walk(dir);
    return files;
}

async function cleanup(tempDir: string, zipPath: string) {
    try {
        await fs.rm(tempDir, { recursive: true, force: true });
        await fs.unlink(zipPath);
    } catch (e) {
        console.error('Cleanup error:', e);
    }
}
