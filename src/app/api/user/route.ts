/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import axios from 'axios';

interface Role {
  bp: string;
  em_cost_center: string | null;
  cost_center: string | null;
  user_type: string;
}

interface CostCenterMapping {
  BUKRS: string;
  user_role: string;
  cost_center: string;
  assigned_cost_center: string;
  seq_number: number;
  create_by: string;
  create_date: string;
  modified_by: string | null;
  modified_date: string | null;
  expired_date: string | null;
  is_active: boolean;
}

interface BPMapping {
  BUKRS: string;
  user_role: string;
  bp: string;
  cost_center: string;
  seq_number: number;
  create_by: string;
  create_date: string;
  modified_by: string | null;
  modified_date: string | null;
  expired_date: string | null;
  is_active: boolean;
}

interface Application {
  app_id: string;
  app_name: string;
  app_url: string;
  img_url: string | null;
  environment: string;
  BP: string;
  title_id: string;
  type: string;
  seq_nbr: number;
  start_effective_date: string;
  end_effective_date: string | null;
  remark: string | null;
  cost_center_name: string;
  role?: Role[];
}

interface CustomJwtPayload extends JwtPayload {
  partner: string;
  title: string;
  username?: string;
  email?: string;
  department: string;
  group: string;
  cost_center: string;
}

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const EmployeeEndpoint = process.env.NEXT_PUBLIC_DOTS_BE_END_POINT;
  const refreshToken = cookieStore.get('refresh_token');
  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token found' }, { status: 401 });
  }

  try {
    const payload = jwtDecode<CustomJwtPayload>(refreshToken.value);
    const bp = payload.partner;
    
    const applicationResponse = await axios<{ toa: Application[] }>({
      method: 'GET',
      url: `${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT}/role/all/${payload.email}`,
      headers: {
        'Content-Type': 'application/json'
      }
    });    

    if (applicationResponse.status !== 200) {
      throw new Error('Failed to fetch application data');
    }

    const applicationData = applicationResponse.data.toa;
    
    const dotsApp = applicationData.find(app => app.app_name === "DOTS");
    let roles: Role[] = dotsApp?.role || [];
    
    const costCenterResponse = await axios.get<{ data: CostCenterMapping[] }>(
      `${EmployeeEndpoint}/mapping-cost-center-user-types?searchBukrs=TUGU&searchCostCenter=${payload.cost_center}&isActive=Active&perPage=100`
    );

    if (costCenterResponse.data.data.length > 0) {
      const newRoles: Role[] = costCenterResponse.data.data.map(item => ({
        bp: payload.partner,
        em_cost_center: roles[0].em_cost_center,
        cost_center: item.assigned_cost_center || null,
        user_type: item.user_role
      }));
      roles = [...roles, ...newRoles];
    }

    const bpResponse = await axios.get<{ data: BPMapping[] }>(
      `${EmployeeEndpoint}/mapping-bp-user-types?bukrs=TUGU&bp=${bp}&is_active=Active&per_page=100`
    );

    if (bpResponse.data.data.length > 0) {
      const bpRoles: Role[] = bpResponse.data.data.map(item => ({
        bp: item.bp,
        em_cost_center: roles[0].em_cost_center,
        cost_center: item.cost_center || null,
        user_type: item.user_role
      }));
      roles = [...roles, ...bpRoles];
    }

    roles = roles.filter((role, index, self) =>
      index === self.findIndex(r => 
        r.bp === role.bp && 
        r.em_cost_center === role.em_cost_center &&
        r.cost_center === role.cost_center && 
        r.user_type === role.user_type
      )
    );

    if (dotsApp) {
      dotsApp.role = roles;
    }

    const imageResponse = await fetch(`${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT}/image/${bp}`, {
      method: 'GET',
    });

    if (!imageResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch image data' }, { status: imageResponse.status });
    }

    const imageData = await imageResponse.json();

    const dataProfileImage = imageData?.data?.image_data || "";

    const enrichedPayload = {
      ...payload,
      application: applicationData,
      profile_image: dataProfileImage,
    };

    return NextResponse.json(enrichedPayload);

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid token or failed to fetch data' }, 
      { status: 401 }
    );
  }
}
