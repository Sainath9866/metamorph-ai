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

        // SECURITY FIX: Add timeout handling to prevent hanging requests
        // Use AbortController to implement a 10-second timeout for the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            // Get recent pull requests
            const response = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&sort=created&direction=desc&per_page=5`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                    signal: controller.signal,
                }
            );

            clearTimeout(timeoutId);

            // SECURITY FIX: Enhanced error handling with specific status code checks
            // This prevents information leakage and provides appropriate error responses
            if (!response.ok) {
                const errorBody = await response.text().catch(() => 'Unable to parse error');
                
                // Handle specific HTTP status codes
                switch (response.status) {
                    case 401:
                        // Unauthorized - token is invalid or expired
                        console.error('GitHub API authentication failed');
                        return NextResponse.json(
                            { error: 'Authentication failed. Please re-authenticate.' },
                            { status: 401 }
                        );
                    
                    case 403:
                        // Forbidden - check if it's a rate limit issue
                        const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
                        const rateLimitReset = response.headers.get('x-ratelimit-reset');
                        
                        if (rateLimitRemaining === '0') {
                            const resetDate = rateLimitReset 
                                ? new Date(parseInt(rateLimitReset) * 1000).toLocaleTimeString()
                                : 'unknown';
                            console.error(`GitHub API rate limit exceeded. Resets at: ${resetDate}`);
                            return NextResponse.json(
                                { error: `Rate limit exceeded. Resets at ${resetDate}.` },
                                { status: 429 }
                            );
                        }
                        
                        console.error('GitHub API access forbidden:', errorBody);
                        return NextResponse.json(
                            { error: 'Access forbidden. Check repository permissions.' },
                            { status: 403 }
                        );
                    
                    case 404:
                        // Not found - repository doesn't exist or no access
                        console.error('Repository not found:', repository);
                        return NextResponse.json(
                            { error: 'Repository not found or you do not have access.' },
                            { status: 404 }
                        );
                    
                    case 422:
                        // Unprocessable entity - validation error
                        console.error('GitHub API validation error:', errorBody);
                        return NextResponse.json(
                            { error: 'Invalid repository format.' },
                            { status: 400 }
                        );
                    
                    default:
                        // Server errors (5xx) or other client errors
                        if (response.status >= 500) {
                            console.error('GitHub API server error:', response.status, errorBody);
                            return NextResponse.json(
                                { error: 'GitHub API is currently unavailable. Please try again later.' },
                                { status: 503 }
                            );
                        }
                        
                        console.error('GitHub API request failed:', response.status, errorBody);
                        return NextResponse.json(
                            { error: 'Failed to fetch pull requests.' },
                            { status: response.status }
                        );
                }
            }

            // SECURITY FIX: Validate response data before processing
            const prs = await response.json();
            
            if (!Array.isArray(prs)) {
                console.error('Invalid response format from GitHub API');
                return NextResponse.json(
                    { error: 'Invalid response from GitHub API.' },
                    { status: 500 }
                );
            }

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
        } catch (fetchError: any) {
            clearTimeout(timeoutId);
            
            // SECURITY FIX: Handle timeout and network errors separately
            if (fetchError.name === 'AbortError') {
                console.error('GitHub API request timeout after 10 seconds');
                return NextResponse.json(
                    { error: 'Request timeout. Please try again.' },
                    { status: 504 }
                );
            }
            
            // Network errors or other fetch-related issues
            console.error('Network error fetching PRs:', fetchError.message);
            return NextResponse.json(
                { error: 'Network error. Please check your connection and try again.' },
                { status: 503 }
            );
        }
    } catch (error: any) {
        // SECURITY FIX: Handle unexpected errors without exposing sensitive details
        console.error('Unexpected error in check-prs route:', error.message);
        return NextResponse.json(
            { error: 'An unexpected error occurred. Please try again.' },
            { status: 500 }
        );
    }
}