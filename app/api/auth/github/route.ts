import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        // Redirect to GitHub OAuth
        const clientId = process.env.GITHUB_CLIENT_ID;
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github`;
        const scope = 'repo,workflow';

        const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

        return NextResponse.redirect(githubAuthUrl);
    }

    // Exchange code for access token
    try {
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
            }),
        });

        const { access_token } = await tokenResponse.json();

        if (!access_token) {
            return NextResponse.json({ error: 'Failed to get access token' }, { status: 400 });
        }

        // Get user info
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        const user = await userResponse.json();

        // In production, store this in a database with session management
        // For demo, we'll redirect with the token as a query param (NOT SECURE - demo only)
        const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?github_connected=true`);

        // Set HTTP-only cookie with token
        response.cookies.set('github_token', access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        response.cookies.set('github_user', JSON.stringify({ login: user.login, name: user.name }), {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30,
        });

        return response;
    } catch (error) {
        console.error('GitHub auth error:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
}
