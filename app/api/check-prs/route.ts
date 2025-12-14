import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const repository = searchParams.get('repository');

    const cookieStore = cookies();
    const token = cookieStore.get('github_token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!repository) {
        return NextResponse.json({ error: 'Repository not specified' }, { status: 400 });
    }

    try {
        const [owner, repo] = repository.split('/');

        // Get recent pull requests
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&sort=created&direction=desc&per_page=5`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch pull requests');
        }

        const prs = await response.json();

        // Filter for MetaMorph PRs
        const metamorphPRs = prs.filter((pr: any) =>
            pr.title.includes('MetaMorph') || pr.title.includes('Auto-heal')
        );

        return NextResponse.json({
            prs: metamorphPRs.map((pr: any) => ({
                number: pr.number,
                title: pr.title,
                url: pr.html_url,
                created_at: pr.created_at,
                body: pr.body,
                changed_files: pr.changed_files,
                additions: pr.additions,
                deletions: pr.deletions,
            })),
        });
    } catch (error) {
        console.error('Error fetching PRs:', error);
        return NextResponse.json({ error: 'Failed to fetch pull requests' }, { status: 500 });
    }
}
