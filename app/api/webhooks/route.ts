import { NextResponse } from 'next/server';

// In-memory event store (for hackathon demo)
// In production, use Vercel KV or similar
let latestEvent: any = null;

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Store the event
        latestEvent = {
            ...body,
            receivedAt: new Date().toISOString(),
        };

        console.log('📨 Webhook received:', latestEvent);

        return NextResponse.json({
            success: true,
            message: 'Event received'
        });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to process webhook' },
            { status: 500 }
        );
    }
}

// Allow GET for testing
export async function GET() {
    return NextResponse.json({
        message: 'Webhook endpoint ready',
        latestEvent,
    });
}
