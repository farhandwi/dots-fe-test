import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const payload = req.headers.get('x-user-payload');
  const EmployeeEndPoint = process.env.NEXT_PUBLIC_DOTS_BE_END_POINT;

  if (payload) {
    try {
      const decodedPayload = JSON.parse(payload);
      const bp = decodedPayload.partner; 

      if (!bp) {
        return NextResponse.json({ error: 'BP not found in payload' }, { status: 400 });
      }

      const imageResponse = await fetch(`${EmployeeEndPoint}/image/get/${bp}`, {
        method: 'GET',
      });

      if (!imageResponse.ok) {
        return NextResponse.json({ error: 'Failed to fetch image data' }, { status: imageResponse.status });
      }

      const imageData = await imageResponse.json();

      if (imageData && imageData.data && imageData.data.image_data) {
        decodedPayload.image_data = imageData.data.image_data;
      } else {
        decodedPayload.image_data = null;
      }

      return NextResponse.json(decodedPayload);

    } catch (error) {
      console.error('Error parsing payload or fetching image data:', error);
      return NextResponse.json({ error: 'Invalid payload or error fetching image data' }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: 'No payload found' }, { status: 401 });
  }
}
