import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Get the IP from headers (works on Vercel)
        const forwardedFor = request.headers.get('x-forwarded-for');
        const realIp = request.headers.get('x-real-ip');
        const vercelIp = request.headers.get('x-vercel-ip-country');

        // Try to get the actual server IP
        let serverIp = forwardedFor?.split(',')[0] || realIp || 'Unknown';

        // Get host information
        const host = request.headers.get('host') || 'Unknown';

        // For Vercel deployments, we can also get the deployment URL
        const vercelUrl = process.env.VERCEL_URL || host;

        return NextResponse.json({
            serverIp,
            host,
            vercelUrl,
            forwardedFor,
            realIp,
            // Generate consistent IPs for the form
            sendingServerIp: serverIp,
            logonServerIp: serverIp,
            globalServerIp: serverIp,
            receivingServerIp: serverIp,
            commonServerIp: serverIp,
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch server IP' },
            { status: 500 }
        );
    }
}
