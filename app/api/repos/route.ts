import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    const cookieStore = cookies();
    const token = cookieStore.get('github_token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        // Fetch user's repositories
        const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=50', {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch repositories');
        }

        const repos = await response.json();

        return NextResponse.json({
            repos: repos.map((repo: any) => ({
                id: repo.id,
                name: repo.name,
                full_name: repo.full_name,
                description: repo.description,
                private: repo.private,
                updated_at: repo.updated_at,
            })),
        });
    } catch (error) {
        console.error('Error fetching repos:', error);
        return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 });
    }
}
