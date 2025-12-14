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

        // Call Railway FastAPI backend
        const healingServiceUrl = process.env.HEALING_SERVICE_URL || 'http://localhost:8000';

        const healingResponse = await fetch(`${healingServiceUrl}/heal`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                repository,
                mission: error_logs || 'Fix detected issues in codebase',
                github_token: token,
            }),
        });

        const result = await healingResponse.json();

        if (result.success) {
            // Add event to status endpoint
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://metamorph-ai-three.vercel.app'}/api/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'HEALING',
                    message: `Self-healing initiated on ${repository}`,
                    type: 'info',
                }),
            });

            return NextResponse.json({
                success: true,
                message: result.message,
                pr_url: result.pr_url,
                pr_number: result.pr_number,
                changes_made: result.changes_made,
                output: result.output,
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.detail || result.error || 'Healing failed',
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Error triggering healing:', error);
        return NextResponse.json(
            { error: 'Failed to trigger healing' },
            { status: 500 }
        );
    }
}
