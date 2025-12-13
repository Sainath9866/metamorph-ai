import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { error } = body;

        // In production, this would trigger Kestra via REST API
        // For hackathon demo, we can simulate or call actual Kestra

        const kestraUrl = process.env.KESTRA_API_URL || 'http://localhost:8080';
        const flowId = 'metamorph_healing_loop';
        const namespace = 'ai.metamorph';

        console.log('🔥 Simulating production failure:', error);

        // Trigger Kestra flow execution (requires multipart/form-data)
        try {
            const formData = new FormData();
            formData.append('inputs.error_logs', error);

            const response = await fetch(`${kestraUrl}/api/v1/executions/${namespace}/${flowId}`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Kestra API error:', errorText);
                return NextResponse.json({
                    success: false,
                    message: 'Failed to trigger Kestra workflow',
                    error: errorText,
                }, { status: response.status });
            }

            const execution = await response.json();
            return NextResponse.json({
                success: true,
                message: 'Kestra workflow triggered successfully',
                flowId,
                namespace,
                executionId: execution.id,
                error,
            });
        } catch (fetchError) {
            console.error('Error calling Kestra:', fetchError);
            return NextResponse.json({
                success: false,
                message: 'Failed to connect to Kestra',
                error: (fetchError as Error).message,
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Trigger error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to trigger workflow' },
            { status: 500 }
        );
    }
}
