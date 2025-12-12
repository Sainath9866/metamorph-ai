import { NextResponse } from 'next/server';

// In-memory event store (for hackathon demo)
// In production, use Vercel KV or similar
let events: any[] = [];

export async function GET() {
    // Return the latest event if any
    const latestEvent = events.length > 0 ? events[events.length - 1] : null;

    return NextResponse.json({
        event: latestEvent,
        timestamp: new Date().toISOString(),
    });
}

export async function POST(request: Request) {
    try {
        const event = await request.json();

        events.push({
            ...event,
            timestamp: new Date().toISOString(),
        });

        // Keep only last 50 events
        if (events.length > 50) {
            events = events.slice(-50);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to add event' },
            { status: 500 }
        );
    }
}
