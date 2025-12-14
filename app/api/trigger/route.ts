import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { repository, error_logs } = await request.json();

        const cookieStore = cookies();
        const token = cookieStore.get('github_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Not authenticated with GitHub' }, { status: 401 });
        }

        if (!repository) {
            return NextResponse.json({ error: 'Repository not specified' }, { status: 400 });
        }

        // Trigger GitHub Actions workflow dispatch
        const [owner, repo] = repository.split('/');

        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/dispatches`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    event_type: 'deploy-agent',
                    client_payload: {
                        mission: error_logs || 'Fix detected issues in codebase',
                        triggered_by: 'dashboard',
                        timestamp: new Date().toISOString(),
                    },
                }),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error('GitHub dispatch error:', error);
            return NextResponse.json(
                { error: 'Failed to trigger workflow on repository' },
                { status: response.status }
            );
        }

        // Add event to status endpoint
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: 'TRIGGERED',
                message: `Self-healing initiated on ${repository}`,
                type: 'info',
            }),
        });

        return NextResponse.json({
            success: true,
            message: `Workflow triggered successfully on ${repository}`,
            repository,
        });
    } catch (error) {
        console.error('Error triggering workflow:', error);
        return NextResponse.json(
            { error: 'Failed to trigger workflow' },
            { status: 500 }
        );
    }
}
