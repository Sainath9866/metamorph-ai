import { NextResponse } from 'next/server';

// This would connect to the same store as webhooks
// For demo, we'll use a simple module-level variable
let events: any[] = [];

export async function GET() {
    // Return the latest event if any
    const latestEvent = events.length > 0 ? events[events.length - 1] : null;

    return NextResponse.json({
        event: latestEvent,
        timestamp: new Date().toISOString(),
    });
}

// Helper to add events (used by trigger endpoint)
export function addEvent(event: any) {
    events.push({
        ...event,
        timestamp: new Date().toISOString(),
    });

    // Keep only last 50 events
    if (events.length > 50) {
        events = events.slice(-50);
    }
}
